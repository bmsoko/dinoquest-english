import os

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

if settings.database_url.startswith("sqlite:///./"):
    os.makedirs(os.path.dirname(settings.database_url.replace("sqlite:///", "")) or ".", exist_ok=True)

engine = create_engine(settings.database_url, connect_args=connect_args)


def init_db() -> None:
    # v2 migration: multiplayer replaced the single-player tables. Legacy
    # progress tables are dropped (progress was zero pre-launch); content
    # tables (unit/word/exerciseitem) are preserved.
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    tables = inspector.get_table_names()
    with engine.begin() as conn:
        if "playerstate" in tables:
            conn.execute(text("DROP TABLE playerstate"))
        for table in ("wordstat", "owneddino"):
            if table in tables and "player_id" not in [
                c["name"] for c in inspector.get_columns(table)
            ]:
                conn.execute(text(f"DROP TABLE {table}"))

    if "player" in tables and "pin" not in [
        c["name"] for c in inspector.get_columns("player")
    ]:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE player ADD COLUMN pin VARCHAR"))

    SQLModel.metadata.create_all(engine)

    from sqlmodel import Session, select

    from .models import Player

    with Session(engine) as session:
        if not session.exec(select(Player)).first():
            session.add(Player(name="Jugador 1", avatar="🦖"))
            session.commit()


def get_session():
    with Session(engine) as session:
        yield session
