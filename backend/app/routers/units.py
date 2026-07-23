import json

import anthropic
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..config import settings
from ..db import get_session
from ..exercises import build_word_exercises, normalize
from ..generation import GeneratedUnit, generate_unit
from ..models import ExerciseItem, Unit, Word, WordStat

router = APIRouter(prefix="/units", tags=["units"])


def check_pin(x_parent_pin: str | None = Header(default=None)) -> None:
    if settings.parent_pin and x_parent_pin != settings.parent_pin:
        raise HTTPException(status_code=403, detail="PIN incorrecto")


@router.get("/pin-check", dependencies=[Depends(check_pin)])
def pin_check():
    return {"ok": True}


class GenerateRequest(BaseModel):
    prompt: str


class SaveUnitRequest(BaseModel):
    source_prompt: str
    unit: GeneratedUnit
    kind: str = "unit"


@router.post("/generate", dependencies=[Depends(check_pin)])
def generate(req: GenerateRequest) -> GeneratedUnit:
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="El texto está vacío")
    try:
        return generate_unit(req.prompt)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except anthropic.AuthenticationError:
        raise HTTPException(
            status_code=502,
            detail="La clave de IA (ANTHROPIC_API_KEY) no es válida. Revisala en Railway.",
        )
    except anthropic.BadRequestError as e:
        msg = str(getattr(e, "message", "")) or str(e)
        if "credit balance" in msg.lower():
            raise HTTPException(
                status_code=502,
                detail="La cuenta de Anthropic no tiene saldo. Agregá créditos en console.anthropic.com → Billing.",
            )
        raise HTTPException(status_code=502, detail="La IA rechazó el pedido. Probá un texto más corto.")
    except anthropic.APIError:
        raise HTTPException(
            status_code=502,
            detail="No se pudo conectar con la IA en este momento. Probá de nuevo en un minuto.",
        )


class AddWordsRequest(BaseModel):
    words: list[str]
    single_word: bool = False  # spelling test: collapse "scare crow" -> "scarecrow"


@router.post("/{unit_id}/words", dependencies=[Depends(check_pin)])
def add_words(unit_id: int, req: AddWordsRequest, session: Session = Depends(get_session)):
    """Append vocabulary to a unit, skipping anything already there."""
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")

    existing = session.exec(select(Word).where(Word.unit_id == unit_id)).all()
    existing_keys = {normalize(w.text) for w in existing}
    pool = [w.text for w in existing]

    # Accept a pasted blob: split on newlines and commas
    incoming: list[str] = []
    for raw in req.words:
        for part in raw.replace(",", "\n").split("\n"):
            cleaned = " ".join(part.split())
            if cleaned:
                incoming.append(cleaned)

    added: list[str] = []
    skipped: list[str] = []
    for raw_word in incoming:
        word_text = raw_word.replace(" ", "") if req.single_word else raw_word
        key = normalize(word_text)
        if not key:
            continue
        if key in existing_keys:
            skipped.append(word_text)
            continue
        existing_keys.add(key)
        added.append(word_text)

    full_pool = pool + added
    for word_text in added:
        word = Word(unit_id=unit_id, text=word_text)
        session.add(word)
        session.commit()
        session.refresh(word)
        for ex in build_word_exercises(word_text, [p for p in full_pool if p != word_text]):
            payload = {k: v for k, v in ex.items() if k != "type"}
            session.add(
                ExerciseItem(
                    unit_id=unit_id,
                    word_id=word.id,
                    type=ex["type"],
                    payload=json.dumps(payload, ensure_ascii=False),
                    difficulty=1,
                )
            )
    session.commit()
    return {"added": added, "skipped": skipped}


@router.post("", dependencies=[Depends(check_pin)])
def save_unit(req: SaveUnitRequest, session: Session = Depends(get_session)):
    unit = Unit(
        title=req.unit.title,
        source_prompt=req.source_prompt,
        kind="exam" if req.kind == "exam" else "unit",
    )
    session.add(unit)
    session.commit()
    session.refresh(unit)

    words_by_text: dict[str, Word] = {}
    for w in req.unit.words:
        word = Word(
            unit_id=unit.id,
            text=w.text.strip(),
            translation=w.translation,
            example_sentence=w.example_sentence,
            emoji=w.emoji,
            category=w.category,
        )
        session.add(word)
        words_by_text[word.text.lower()] = word
    session.commit()

    for ex in req.unit.exercises:
        word = words_by_text.get((ex.word_text or "").strip().lower())
        payload = ex.model_dump(exclude={"type", "word_text", "difficulty"}, exclude_none=True)
        session.add(
            ExerciseItem(
                unit_id=unit.id,
                word_id=word.id if word else None,
                type=ex.type,
                payload=json.dumps(payload, ensure_ascii=False),
                difficulty=ex.difficulty,
            )
        )
    session.commit()
    return {"id": unit.id, "title": unit.title}


@router.get("")
def list_units(session: Session = Depends(get_session)):
    units = session.exec(select(Unit).order_by(Unit.created_at.desc())).all()
    result = []
    for u in units:
        word_count = len(session.exec(select(Word).where(Word.unit_id == u.id)).all())
        result.append(
            {
                "id": u.id,
                "title": u.title,
                "kind": u.kind,
                "active": u.active,
                "created_at": u.created_at,
                "word_count": word_count,
            }
        )
    return result


@router.patch("/{unit_id}", dependencies=[Depends(check_pin)])
def toggle_unit(unit_id: int, active: bool, session: Session = Depends(get_session)):
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    unit.active = active
    session.add(unit)
    session.commit()
    return {"id": unit.id, "active": unit.active}


@router.delete("/{unit_id}", dependencies=[Depends(check_pin)])
def delete_unit(unit_id: int, session: Session = Depends(get_session)):
    unit = session.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unidad no encontrada")
    for ex in session.exec(select(ExerciseItem).where(ExerciseItem.unit_id == unit_id)).all():
        session.delete(ex)
    for word in session.exec(select(Word).where(Word.unit_id == unit_id)).all():
        for stat in session.exec(select(WordStat).where(WordStat.word_id == word.id)).all():
            session.delete(stat)
        session.delete(word)
    session.delete(unit)
    session.commit()
    return {"deleted": unit_id}
