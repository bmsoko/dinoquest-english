from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Unit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    source_prompt: str
    kind: str = Field(default="unit", index=True)  # "unit" | "exam"
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Word(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    unit_id: int = Field(foreign_key="unit.id", index=True)
    text: str
    translation: str = ""
    example_sentence: str = ""
    emoji: str = ""
    category: str = ""


class ExerciseItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    unit_id: int = Field(foreign_key="unit.id", index=True)
    word_id: Optional[int] = Field(default=None, foreign_key="word.id")
    type: str = Field(index=True)  # listen_choose | dictation | unscramble | fill_in
    payload: str  # JSON, shape depends on type
    difficulty: int = 1


class Player(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    avatar: str = "🦖"
    xp: int = 0
    level: int = 1
    egg_progress: int = 0  # 0..100
    streak: int = 0
    last_played: Optional[date] = None
    companion_id: Optional[int] = None
    weekly_xp: int = 0
    week_start: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WordStat(SQLModel, table=True):
    word_id: int = Field(primary_key=True, foreign_key="word.id")
    player_id: int = Field(primary_key=True, foreign_key="player.id")
    box: int = 1  # Leitner box 1 (struggling) .. 4 (mastered)
    correct: int = 0
    wrong: int = 0
    last_result_at: Optional[datetime] = None


class OwnedDino(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    player_id: int = Field(foreign_key="player.id", index=True)
    species_id: str
    stage: int = 1  # 1..3
    xp: int = 0
    acquired_at: datetime = Field(default_factory=datetime.utcnow)
