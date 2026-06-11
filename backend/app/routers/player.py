from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..game import week_start_of, xp_into_level
from ..models import OwnedDino, Player, WordStat
from ..species import SPECIES, SPECIES_BY_ID

router = APIRouter(prefix="/player", tags=["player"])
players_router = APIRouter(prefix="/players", tags=["players"])


def player_id_header(x_player_id: int = Header(default=1)) -> int:
    return x_player_id


def get_player(session: Session, player_id: int) -> Player:
    player = session.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    return player


def current_weekly_xp(player: Player) -> int:
    """Weekly XP, treating a stale week_start as zero (resets Mondays)."""
    if player.week_start != week_start_of(date.today()):
        return 0
    return player.weekly_xp


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
def get_state(
    player_id: int = Depends(player_id_header), session: Session = Depends(get_session)
):
    player = get_player(session, player_id)
    dinos = session.exec(select(OwnedDino).where(OwnedDino.player_id == player.id)).all()
    progress, needed = xp_into_level(player.xp)
    return {
        "id": player.id,
        "name": player.name,
        "avatar": player.avatar,
        "xp": player.xp,
        "level": player.level,
        "level_progress": progress,
        "level_needed": needed,
        "egg_progress": player.egg_progress,
        "streak": player.streak,
        "weekly_xp": current_weekly_xp(player),
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
def set_companion(
    req: CompanionRequest,
    player_id: int = Depends(player_id_header),
    session: Session = Depends(get_session),
):
    player = get_player(session, player_id)
    dino = session.get(OwnedDino, req.dino_id)
    if not dino or dino.player_id != player.id:
        raise HTTPException(status_code=404, detail="Dino no encontrado")
    player.companion_id = dino.id
    session.add(player)
    session.commit()
    return {"companion_id": player.companion_id}


@players_router.get("")
def list_players(session: Session = Depends(get_session)):
    players = session.exec(select(Player).order_by(Player.created_at)).all()
    out = []
    for p in players:
        dino_count = len(session.exec(select(OwnedDino).where(OwnedDino.player_id == p.id)).all())
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "avatar": p.avatar,
                "level": p.level,
                "xp": p.xp,
                "weekly_xp": current_weekly_xp(p),
                "streak": p.streak,
                "dino_count": dino_count,
            }
        )
    return out


class CreatePlayerRequest(BaseModel):
    name: str
    avatar: str = "🦖"


@players_router.post("")
def create_player(req: CreatePlayerRequest, session: Session = Depends(get_session)):
    name = req.name.strip()[:20]
    if not name:
        raise HTTPException(status_code=400, detail="El nombre está vacío")
    player = Player(name=name, avatar=req.avatar[:8] or "🦖")
    session.add(player)
    session.commit()
    session.refresh(player)
    return {"id": player.id, "name": player.name, "avatar": player.avatar}


@players_router.delete("/{pid}")
def delete_player(pid: int, session: Session = Depends(get_session)):
    players = session.exec(select(Player)).all()
    if len(players) <= 1:
        raise HTTPException(status_code=400, detail="Debe quedar al menos un jugador")
    player = session.get(Player, pid)
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")
    for dino in session.exec(select(OwnedDino).where(OwnedDino.player_id == pid)).all():
        session.delete(dino)
    for stat in session.exec(select(WordStat).where(WordStat.player_id == pid)).all():
        session.delete(stat)
    session.delete(player)
    session.commit()
    return {"deleted": pid}
