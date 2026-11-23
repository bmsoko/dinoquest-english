from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db
from .routers import play, player, testprep, units

app = FastAPI(title="Newton English Quest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(units.router, prefix="/api/v1")
app.include_router(play.router, prefix="/api/v1")
app.include_router(player.router, prefix="/api/v1")
app.include_router(player.players_router, prefix="/api/v1")
app.include_router(testprep.router, prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}
