from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..game import xp_into_level
from ..models import OwnedDino, PlayerState
from ..species import SPECIES, SPECIES_BY_ID

router = APIRouter(prefix="/player", tags=["player"])


def get_player(session: Session) -> PlayerState:
    player = session.get(PlayerState, 1)
    if not player:
        player = PlayerState(id=1)
        session.add(player)
        session.commit()
        session.refresh(player)
    return player


def dino_view(dino: OwnedDino) -> dict:
    species = SPECIES_BY_ID.get(dino.species_id)
    stage_info = species["stages"][dino.stage - 1] if species else {"name": "?", "emoji": "❓"}
    return {
        "id": dino.id,
        "species_id": dino.species_id,
        "rarity": species["rarity"] if species else "common",
        "color": species["color"] if species else "#888",
        "stage": dino.stage,
        "xp": dino.xp,
        "name": stage_info["name"],
        "emoji": stage_info["emoji"],
    }


@router.get("")
def get_state(session: Session = Depends(get_session)):
    player = get_player(session)
    dinos = session.exec(select(OwnedDino)).all()
    progress, needed = xp_into_level(player.xp)
    return {
        "xp": player.xp,
        "level": player.level,
        "level_progress": progress,
        "level_needed": needed,
        "egg_progress": player.egg_progress,
        "streak": player.streak,
        "last_played": player.last_played,
        "companion_id": player.companion_id,
        "dinos": [dino_view(d) for d in dinos],
    }


@router.get("/species")
def get_species():
    return SPECIES


class CompanionRequest(BaseModel):
    dino_id: int


@router.post("/companion")
def set_companion(req: CompanionRequest, session: Session = Depends(get_session)):
    player = get_player(session)
    dino = session.get(OwnedDino, req.dino_id)
    if not dino:
        raise HTTPException(status_code=404, detail="Dino no encontrado")
    player.companion_id = dino.id
    session.add(player)
    session.commit()
    return {"companion_id": player.companion_id}
