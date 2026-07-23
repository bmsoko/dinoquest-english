from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..game import week_start_of, xp_into_level
from ..models import OwnedDino, Player, WordStat
from ..themes import ALL_SPECIES_BY_ID, THEMES, theme_or_default
from .units import check_pin

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
    species = ALL_SPECIES_BY_ID.get(dino.species_id)
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
    theme = theme_or_default(player.theme)
    return {
        "id": player.id,
        "name": player.name,
        "avatar": player.avatar,
        "theme": player.theme,
        "theme_emoji": theme["emoji"],
        "collection_es": theme["collection_es"],
        "collection_en": theme["collection_en"],
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
def get_species(
    player_id: int = Depends(player_id_header), session: Session = Depends(get_session)
):
    player = get_player(session, player_id)
    return theme_or_default(player.theme)["species"]


@router.get("/themes")
def list_themes():
    return [
        {"id": t["id"], "name_es": t["name_es"], "name_en": t["name_en"], "emoji": t["emoji"]}
        for t in THEMES
    ]


class ProfileRequest(BaseModel):
    avatar: str | None = None
    theme: str | None = None


@router.post("/profile")
def update_own_profile(
    req: ProfileRequest,
    player_id: int = Depends(player_id_header),
    session: Session = Depends(get_session),
):
    """Kid-facing avatar / prize-set change (no parent PIN). Changing the prize
    set only affects future eggs — characters already earned are kept."""
    player = get_player(session, player_id)
    if req.avatar:
        player.avatar = req.avatar[:8]
    if req.theme:
        player.theme = clean_theme(req.theme)
    session.add(player)
    session.commit()
    theme = theme_or_default(player.theme)
    return {
        "avatar": player.avatar,
        "theme": player.theme,
        "theme_emoji": theme["emoji"],
        "collection_es": theme["collection_es"],
        "collection_en": theme["collection_en"],
    }


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
                "theme": p.theme,
                "has_pin": bool(p.pin),
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
    theme: str = "dinos"
    pin: str = ""


def clean_pin(pin: str) -> str | None:
    pin = "".join(ch for ch in pin if ch.isdigit())[:6]
    return pin or None


def clean_theme(theme: str) -> str:
    return theme_or_default(theme)["id"]


@players_router.post("")
def create_player(req: CreatePlayerRequest, session: Session = Depends(get_session)):
    name = req.name.strip()[:20]
    if not name:
        raise HTTPException(status_code=400, detail="El nombre está vacío")
    player = Player(
        name=name,
        avatar=req.avatar[:8] or "🦖",
        theme=clean_theme(req.theme),
        pin=clean_pin(req.pin),
    )
    session.add(player)
    session.commit()
    session.refresh(player)
    return {"id": player.id, "name": player.name, "avatar": player.avatar, "theme": player.theme}


class UpdatePlayerRequest(BaseModel):
    name: str | None = None
    avatar: str | None = None
    theme: str | None = None
    pin: str | None = None  # "" clears the PIN


@players_router.patch("/{pid}", dependencies=[Depends(check_pin)])
def update_player(pid: int, req: UpdatePlayerRequest, session: Session = Depends(get_session)):
    player = get_player(session, pid)
    if req.name is not None:
        name = req.name.strip()[:20]
        if not name:
            raise HTTPException(status_code=400, detail="El nombre está vacío")
        player.name = name
    if req.avatar is not None and req.avatar:
        player.avatar = req.avatar[:8]
    if req.theme is not None and req.theme:
        player.theme = clean_theme(req.theme)
    if req.pin is not None:
        player.pin = clean_pin(req.pin)
    session.add(player)
    session.commit()
    return {"id": player.id, "name": player.name, "avatar": player.avatar, "theme": player.theme, "has_pin": bool(player.pin)}


class VerifyPinRequest(BaseModel):
    pin: str


@players_router.post("/{pid}/verify")
def verify_pin(pid: int, req: VerifyPinRequest, session: Session = Depends(get_session)):
    player = get_player(session, pid)
    return {"ok": not player.pin or player.pin == "".join(ch for ch in req.pin if ch.isdigit())}


@players_router.delete("/{pid}", dependencies=[Depends(check_pin)])
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
