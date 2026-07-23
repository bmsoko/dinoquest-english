import json
import random
from datetime import date, datetime

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..game import (
    EGG_POINTS_PER_CORRECT,
    XP_PER_CORRECT,
    level_for_xp,
    roll_species,
    stage_for_companion_xp,
    updated_streak,
    week_start_of,
    xp_into_level,
)
from ..models import ExerciseItem, OwnedDino, Player, Unit, Word, WordStat
from ..themes import ALL_SPECIES_BY_ID

router = APIRouter(prefix="/play", tags=["play"])

# Leitner: lower boxes (struggling words) get picked far more often.
# Unseen words use the box-1 weight so new vocabulary shows up early.
BOX_WEIGHTS = {1: 8, 2: 4, 3: 2, 4: 1}


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

    if type == "memory":
        words = session.exec(select(Word).where(Word.unit_id.in_(active_unit_ids), Word.emoji != "")).all()
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
        picked = random.sample(unique_words, min(count, len(unique_words)))
        return {
            "type": "memory",
            "items": [
                {"word_id": w.id, "text": w.text, "emoji": w.emoji, "translation": w.translation}
                for w in picked
            ],
        }

    items = session.exec(
        select(ExerciseItem).where(
            ExerciseItem.unit_id.in_(active_unit_ids), ExerciseItem.type == type
        )
    ).all()
    if not items:
        raise HTTPException(status_code=404, detail=f"No hay ejercicios de tipo {type}")

    stats = {
        s.word_id: s
        for s in session.exec(select(WordStat).where(WordStat.player_id == player_id)).all()
    }

    def weight(item: ExerciseItem) -> int:
        if item.word_id:
            stat = stats.get(item.word_id)
            return BOX_WEIGHTS.get(stat.box, 4) if stat else BOX_WEIGHTS[1]
        return 3

    chosen: list[ExerciseItem] = []
    pool = list(items)
    while pool and len(chosen) < count:
        weights = [weight(i) for i in pool]
        pick = random.choices(pool, weights=weights)[0]
        pool.remove(pick)
        chosen.append(pick)

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
    events: list[dict] = []

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
    xp_earned = n_correct * XP_PER_CORRECT

    old_level = level_for_xp(player.xp)
    player.xp += xp_earned
    new_level = level_for_xp(player.xp)
    if new_level > old_level:
        events.append({"type": "level_up", "level": new_level})
    player.level = new_level

    roll_week(player, today)
    player.weekly_xp += xp_earned

    player.streak = updated_streak(player.streak, player.last_played, today)
    player.last_played = today

    player.egg_progress += n_correct * EGG_POINTS_PER_CORRECT
    while player.egg_progress >= 100:
        player.egg_progress -= 100
        species = roll_species(player.theme)
        dino = OwnedDino(player_id=player.id, species_id=species["id"])
        session.add(dino)
        session.commit()
        session.refresh(dino)
        if player.companion_id is None:
            player.companion_id = dino.id
        events.append(
            {
                "type": "egg_hatched",
                "dino": {"id": dino.id, "species_id": species["id"], "rarity": species["rarity"], "stage": 1},
            }
        )

    # Companion gains the same XP and may evolve
    if player.companion_id:
        companion = session.get(OwnedDino, player.companion_id)
        if companion and companion.player_id == player.id:
            old_stage = companion.stage
            companion.xp += xp_earned
            companion.stage = stage_for_companion_xp(companion.xp)
            if companion.stage > old_stage:
                species = ALL_SPECIES_BY_ID.get(companion.species_id, {})
                stage_info = species.get("stages", [{}] * 3)[companion.stage - 1]
                events.append(
                    {
                        "type": "dino_evolved",
                        "dino_id": companion.id,
                        "stage": companion.stage,
                        "name": stage_info.get("name", ""),
                    }
                )
            session.add(companion)

    session.add(player)
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
