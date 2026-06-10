# DinoQuest English 🦖

Gamified English practice for kids (Spanish speakers, 7+). Paste the school's
review notice in the Parent Zone and Claude generates vocabulary + exercises;
the kid practices through listening, dictation/spelling, grammar and memory
games, earning XP, hatching dino eggs and evolving companions.

## Stack

- **Backend**: FastAPI + SQLModel + SQLite (`backend/`)
- **Frontend**: React + TypeScript + Vite + Tailwind v4 (`frontend/`)
- **AI**: Claude API (structured outputs) turns pasted school notices into units
- **Audio**: browser speech synthesis (Web Speech API), normal + slow speed

## Local development

```bash
# Backend (http://localhost:8000)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env   # add your ANTHROPIC_API_KEY
.venv/bin/uvicorn app.main:app --port 8000

# Frontend (http://localhost:5173, proxies /api to the backend)
cd frontend
npm install
npm run dev
```

No API key yet? Seed test content (Unidad 2 Power Up) without Claude:

```bash
cd backend && .venv/bin/python seed_unidad2.py
```

## Railway deployment (two services from this repo)

**Backend service** (root: `backend/`):
- Volume mounted at `/app/data` (SQLite)
- Variables: `ANTHROPIC_API_KEY`, `FRONTEND_URL=<frontend Railway URL>`,
  optional `PARENT_PIN`, optional `GENERATION_MODEL`

**Frontend service** (root: `frontend/`):
- Variables **before first build**: `VITE_BACKEND_URL=<backend Railway URL>`
  (baked at build time), `PORT=80` (nginx routing)
- Redeploys reuse cached images — push an empty commit to force a rebuild

## How content works

1. Parent Zone (`/parents`): paste the school notice → **Generar unidad** →
   preview → **Guardar**.
2. Active units feed play sessions. Words use Leitner boxes (1–4): missed words
   come back more often.
3. Game rules live in `backend/app/game.py`; dino species are data in
   `backend/app/species.py` (add creature packs there).
