import json
import random
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..game import (
    XP_PER_CORRECT,
    grant_rewards,
    week_start_of,
    xp_into_level,
)
from ..models import ExerciseItem, Player, Unit, Word, WordStat

router = APIRouter(prefix="/play", tags=["play"])

# Leitner: lower boxes (struggling words) get picked far more often.
# Unseen words use the box-1 weight so new vocabulary shows up early.
BOX_WEIGHTS = {1: 8, 2: 4, 3: 2, 4: 1}

# "Latest words" practices vocabulary added within this window
RECENT_DAYS = 14


def coverage_order(word_ids: list[int], stats: dict) -> list[int]:
    """Order words so every one is served before any repeats: least-shown first,
    struggling words (low Leitner box) earlier within a shown level, then random."""
    def key(wid: int):
        st = stats.get(wid)
        return (st.shown if st else 0, st.box if st else 1, random.random())

    return sorted(word_ids, key=key)


def bump_shown(word_ids, stats, session, player_id) -> None:
    """Record that these words were served — increments the coverage counter."""
    for wid in word_ids:
        if wid is None:
            continue
        st = stats.get(wid)
        if not st:
            st = WordStat(word_id=wid, player_id=player_id)
            stats[wid] = st
        st.shown += 1
        session.add(st)
    session.commit()


def get_player(session: Session, player_id: int) -> Player:
    player = session.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return player


def roll_week(player: Player, today: date) -> None:
    monday = week_start_of(today)
    if player.week_start != monday:
        player.week_start = monday
        player.weekly_xp = 0


def player_id_header(x_player_id: int = Header(default=1)) -> int:
    return x_player_id


@router.get("/exam")
def exam_status(
    player_id: int = Depends(player_id_header), session: Session = Depends(get_session)
):
    exams = session.exec(
        select(Unit).where(Unit.active == True, Unit.kind == "exam")  # noqa: E712
    ).all()
    if not exams:
        return {"exists": False}
    exam_ids = [u.id for u in exams]
    words = session.exec(select(Word).where(Word.unit_id.in_(exam_ids))).all()
    stats = {
        s.word_id: s
        for s in session.exec(select(WordStat).where(WordStat.player_id == player_id)).all()
    }
    mastered = sum(1 for w in words if stats.get(w.id) and stats[w.id].box >= 3)
    return {
        "exists": True,
        "title": exams[0].title,
        "words_total": len(words),
        "words_mastered": mastered,
    }


@router.get("/round")
def get_round(
    type: str,
    count: int = 6,
    scope: str = "all",
    player_id: int = Depends(player_id_header),
    session: Session = Depends(get_session),
):
    query = select(Unit).where(Unit.active == True)  # noqa: E712
    if scope == "exam":
        query = query.where(Unit.kind == "exam")
    active_unit_ids = [u.id for u in session.exec(query).all()]
    if not active_unit_ids:
        raise HTTPException(status_code=404, detail="No hay unidades activas")

    # "Latest added": restrict to the most recently added vocabulary (ids ascend)
    recent_word_ids: set[int] | None = None
    if scope == "recent":
        cutoff = datetime.utcnow() - timedelta(days=RECENT_DAYS)
        recent = session.exec(
            select(Word).where(
                Word.unit_id.in_(active_unit_ids),
                Word.created_at != None,  # noqa: E711
                Word.created_at >= cutoff,
            )
        ).all()
        recent_word_ids = {w.id for w in recent}
        if not recent_word_ids:
            raise HTTPException(status_code=404, detail="No hay palabras nuevas")

    # Per-player coverage counters drive least-shown-first selection everywhere
    stats = {
        s.word_id: s
        for s in session.exec(select(WordStat).where(WordStat.player_id == player_id)).all()
    }

    if type == "memory":
        words = session.exec(select(Word).where(Word.unit_id.in_(active_unit_ids), Word.emoji != "")).all()
        if recent_word_ids is not None:
            words = [w for w in words if w.id in recent_word_ids]
        # The same word can exist in a regular unit AND an exam unit — keep one
        # per text (and one per emoji, so card faces stay unambiguous)
        seen_text: set[str] = set()
        seen_emoji: set[str] = set()
        unique_words = []
        for w in words:
            key = w.text.lower().strip()
            if key in seen_text or w.emoji in seen_emoji:
                continue
            seen_text.add(key)
            seen_emoji.add(w.emoji)
            unique_words.append(w)
        if len(unique_words) < 4:
            raise HTTPException(status_code=404, detail="No hay suficientes palabras")
        by_id = {w.id: w for w in unique_words}
        picked_ids = coverage_order(list(by_id), stats)[: min(count, len(by_id))]
        bump_shown(picked_ids, stats, session, player_id)
        picked = [by_id[i] for i in picked_ids]
        return {
            "type": "memory",
            "items": [
                {"word_id": w.id, "text": w.text, "emoji": w.emoji, "translation": w.translation}
                for w in picked
            ],
        }

    # Sentence spelling reuses the dictation pool, filtered to full sentences
    query_type = "dictation" if type == "sentence_spelling" else type
    items = session.exec(
        select(ExerciseItem).where(
            ExerciseItem.unit_id.in_(active_unit_ids), ExerciseItem.type == query_type
        )
    ).all()
    if recent_word_ids is not None:
        items = [i for i in items if i.word_id in recent_word_ids]

    # Letter-by-letter activities are for single short words only — never
    # sentences (spelling a whole sentence is miserable for a 7-year-old).
    if type in ("dictation", "anagram", "missing_letter", "sentence_spelling"):
        want_sentences = type == "sentence_spelling"
        filtered = []
        for item in items:
            try:
                payload = json.loads(item.payload)
            except ValueError:
                continue
            target = (payload.get("text") or payload.get("answer") or "").strip()
            if not target:
                continue
            words_in_target = len(target.split())
            # Sentence spelling = 3+ words. Word spelling (dictation) allows
            # short vocab up to 2 words ("dining room"). The letter games
            # (anagram / missing letter) stay strictly single-word.
            if want_sentences:
                keep = words_in_target >= 3
            elif type == "dictation":
                keep = 1 <= words_in_target <= 2
            else:
                keep = words_in_target == 1
            if keep:
                filtered.append(item)
        items = filtered

    if not items:
        raise HTTPException(status_code=404, detail=f"No hay ejercicios de tipo {type}")

    # Group by word so a round never repeats a word, then serve least-shown
    # words first (coverage). Sentence/grammar items have no word link.
    by_word: dict[int, list[ExerciseItem]] = {}
    loose: list[ExerciseItem] = []
    for item in items:
        if item.word_id is None:
            loose.append(item)
        else:
            by_word.setdefault(item.word_id, []).append(item)

    chosen: list[ExerciseItem] = []
    for wid in coverage_order(list(by_word), stats):
        if len(chosen) >= count:
            break
        chosen.append(random.choice(by_word[wid]))
    if len(chosen) < count and loose:
        random.shuffle(loose)
        chosen.extend(loose[: count - len(chosen)])

    bump_shown([i.word_id for i in chosen], stats, session, player_id)

    words = {w.id: w for w in session.exec(select(Word).where(Word.unit_id.in_(active_unit_ids))).all()}
    out = []
    for item in chosen:
        payload = json.loads(item.payload)
        word = words.get(item.word_id) if item.word_id else None
        out.append(
            {
                "exercise_id": item.id,
                "word_id": item.word_id,
                "type": item.type,
                "difficulty": item.difficulty,
                "emoji": word.emoji if word else "",
                **payload,
            }
        )
    return {"type": type, "items": out}


@router.get("/word-ranking")
def word_ranking(
    player_id: int = Depends(player_id_header), session: Session = Depends(get_session)
):
    """How many times each word has been served to this player (most first)."""
    words = {w.id: w.text for w in session.exec(select(Word)).all()}
    stats = session.exec(select(WordStat).where(WordStat.player_id == player_id)).all()
    ranking = [
        {"word": words.get(s.word_id, "?"), "shown": s.shown, "box": s.box}
        for s in stats
        if s.shown > 0
    ]
    ranking.sort(key=lambda r: r["shown"], reverse=True)
    return ranking


class ItemResult(BaseModel):
    word_id: int | None = None
    correct: bool


class RoundResult(BaseModel):
    results: list[ItemResult]


@router.post("/result")
def post_result(
    req: RoundResult,
    player_id: int = Depends(player_id_header),
    session: Session = Depends(get_session),
):
    player = get_player(session, player_id)
    today = date.today()

    for r in req.results:
        if r.word_id is None:
            continue
        stat = session.get(WordStat, (r.word_id, player.id))
        if not stat:
            stat = WordStat(word_id=r.word_id, player_id=player.id)
        if r.correct:
            stat.correct += 1
            stat.box = min(4, stat.box + 1)
        else:
            stat.wrong += 1
            stat.box = 1
        stat.last_result_at = datetime.utcnow()
        session.add(stat)

    n_correct = sum(1 for r in req.results if r.correct)
    events = grant_rewards(session, player, n_correct, today)
    xp_earned = n_correct * XP_PER_CORRECT

    session.commit()

    progress, needed = xp_into_level(player.xp)
    return {
        "xp_earned": xp_earned,
        "events": events,
        "player": {
            "xp": player.xp,
            "level": player.level,
            "level_progress": progress,
            "level_needed": needed,
            "egg_progress": player.egg_progress,
            "streak": player.streak,
            "weekly_xp": player.weekly_xp,
        },
    }
