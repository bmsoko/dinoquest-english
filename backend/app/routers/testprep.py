import json
from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..game import XP_PER_CORRECT, grant_rewards, xp_into_level
from ..models import TestItem
from ..routers.units import check_pin
from ..testprep_builder import assemble_paper, topic_layout
from ..testprep_content import TOPICS

router = APIRouter(prefix="/test", tags=["test"])


def player_id_header(x_player_id: int = Header(default=1)) -> int:
    return x_player_id


@router.get("/topics")
def list_topics(session: Session = Depends(get_session)):
    out = []
    rows = session.exec(select(TestItem).where(TestItem.active == True)).all()  # noqa: E712
    for topic, meta in TOPICS.items():
        n = sum(1 for r in rows if r.topic == topic)
        if n:
            order, _ = topic_layout(meta)
            out.append({"topic": topic, "title": meta["title"], "items": n, "parts": len(order),
                        "emoji": meta.get("emoji", "📝"), "minutes": meta.get("minutes")})
    return out


@router.get("/paper")
def get_paper(topic: str = "unit4", session: Session = Depends(get_session)):
    items = session.exec(select(TestItem).where(TestItem.topic == topic)).all()
    if not items:
        raise HTTPException(status_code=404, detail="No hay preguntas para este tema")
    meta = TOPICS.get(topic, {})
    order, counts = topic_layout(meta)
    title = meta.get("title", topic)
    return {"topic": topic, "title": title, "sections": assemble_paper(items, counts, order)}


class SectionScore(BaseModel):
    section: str
    correct: int
    total: int


class TestResultRequest(BaseModel):
    topic: str
    correct: int
    total: int
    sections: list[SectionScore] = []


@router.post("/result")
def post_result(
    req: TestResultRequest,
    player_id: int = Depends(player_id_header),
    session: Session = Depends(get_session),
):
    from ..models import Player

    player = session.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")

    events = grant_rewards(session, player, req.correct, date.today())
    session.commit()

    progress, needed = xp_into_level(player.xp)
    return {
        "xp_earned": req.correct * XP_PER_CORRECT,
        "events": events,
        "player": {
            "xp": player.xp, "level": player.level,
            "level_progress": progress, "level_needed": needed,
            "egg_progress": player.egg_progress, "streak": player.streak,
            "weekly_xp": player.weekly_xp,
        },
        "report": {
            "topic": req.topic, "correct": req.correct, "total": req.total,
            "sections": [s.model_dump() for s in req.sections],
        },
    }


@router.post("/seed", dependencies=[Depends(check_pin)])
def seed_endpoint(topic: str = "unit4", session: Session = Depends(get_session)):
    if topic not in TOPICS:
        raise HTTPException(status_code=404, detail="Tema desconocido")
    for row in session.exec(select(TestItem).where(TestItem.topic == topic)).all():
        session.delete(row)
    session.commit()
    n = _load_topic(session, topic)
    session.commit()
    return {"topic": topic, "seeded": n}


def _load_topic(session: Session, topic: str) -> int:
    meta = TOPICS[topic]
    for spec in meta["items"]:
        session.add(TestItem(
            topic=topic, section=spec["section"], format=spec["format"],
            prompt=spec["prompt"], payload=json.dumps(spec["payload"], ensure_ascii=False)))
    return len(meta["items"])
