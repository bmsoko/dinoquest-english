# Test Practice Mode — Design

**Date:** 2026-10-20
**Status:** Approved (design); pending implementation plan
**App:** DinoQuest English (gamified English practice for a 7-year-old, Spanish L1)

## Goal

Add a guided **mock test** section so Estanislao can practice for upcoming
Cambridge-style Unit 4 classroom tests. It mirrors the structure of the real
papers (see `/Users/brunosoko/Downloads/Practica_5_Version_A_Cambridge_Unit_4.pdf`
and the two `Prueba_*_Unidad_4` papers): five parts — Listening, Vocabulary,
Grammar, Reading, Writing — on the Unit 4 theme (family, homes, comparatives,
possessive pronouns).

## Key decisions (from brainstorming)

1. **Format:** a dedicated, guided mock-test mode that runs the 5 parts in
   order and ends with a score/report. Not folded into the existing wheel.
2. **Grading:** Cambridge-faithful **objective** item types only (multiple
   choice, word-bank gap-fill, matching, sentence ordering, listen-and-pick).
   This is how Cambridge grades Pre-A1 Starters / A1 Movers young learners — no
   free composition to misjudge, so a child can play and be graded solo.
3. **Replay:** each attempt is **randomly assembled** from a hand-authored pool
   of Unit 4 items, so he can retake with variety.
4. **Scope:** Unit 4 only now; the data model generalizes to future units.

## User experience

- New Home button **📝 Practice Test** (`t.test_practice`), distinct from the
  existing 🎯 spelling Exam prep.
- **Intro card:** topic title ("Unit 4 · Family & Homes"), "5 parts, ~6 min",
  **Start** button.
- **Section flow:** parts run in fixed order with a progress header
  ("Part 2 of 5 · Vocabulary"). Chunky kid UI, dino Companion in the corner.
- **One attempt per question** (test feel): answer → gentle feedback that shows
  the correct answer (reuse `FeedbackBanner`) → **Next**. Never blocks progress.
- **Report card** at the end: per-part score + total with stars, XP earned, and
  any egg/level-up rewards surfaced through the existing reward overlay.

## The five parts & formats

All formats are auto-graded client-side (consistent with existing activities,
which already ship the answer in the payload and grade in the component).

| Part | `section` | `format`(s) | Notes |
|------|-----------|-------------|-------|
| 1. Listening | `listening` | `listen_pick` | TTS speaks `audio` sentence; tap the matching option. |
| 2. Vocabulary | `vocabulary` | `mcq`, `gap_bank`, `match` | choose word / fill from a word box / match term↔meaning. |
| 3. Grammar | `grammar` | `mcq` | comparatives (`old→older`) and possessives (`mine/hers/…`). |
| 4. Reading | `reading` | `reading` | one short passage + 3 comprehension MCQs, self-contained in payload. |
| 5. Writing | `writing` | `order`, `gap_bank` | controlled writing: tap words into sentence order / gap-fill. |

### Per-attempt paper composition (short, ~16 items for a 7-year-old)

- Listening ×3, Vocabulary ×4, Grammar ×4, Reading ×1 block (3 questions),
  Writing ×2. Counts live in one place (backend assembler) and are easy to tune.

## Data model (backend, SQLModel)

Isolated from the Word/ExerciseItem spelling engine so it never interacts with
the word-coverage selection logic.

```python
class TestItem(SQLModel, table=True):
    id: int | None = PK
    topic: str              # "unit4"
    section: str            # listening|vocabulary|grammar|reading|writing
    format: str             # listen_pick|mcq|gap_bank|match|order|reading
    prompt: str             # question / sentence-with-blank / passage title
    payload: str            # JSON, format-specific (see below)
    active: bool = True
```

### `payload` shapes by format

- `listen_pick`: `{ "audio": "The flat is on the second floor.", "options": ["first floor","second floor","third floor"], "answer": "second floor", "emoji"?: "..." }`
- `mcq`: `{ "options": [...], "answer": "..." }` (prompt holds the sentence, `___` for the blank)
- `gap_bank`: `{ "sentences": [{ "text": "My bedroom is ___.", "answer": "upstairs" }, ...], "bank": ["upstairs","outside","inside",...] }`
- `match`: `{ "pairs": [{ "left": "lift", "right": "takes you to another floor" }, ...] }`
- `order`: `{ "tokens": ["Mia","is","happier","than","Ben"], "answer": "Mia is happier than Ben" }`
- `reading`: `{ "passage": "Hello! I'm Oliver...", "questions": [{ "q": "Where does Oliver live?", "options": [...], "answer": "..." }, ...] }`

## Backend API (new `test` router, prefix `/test`)

- `GET /test/topics` → `[{ "topic": "unit4", "title": "Unit 4 · Family & Homes", "items": <n> }]`
- `GET /test/paper?topic=unit4` → assembled randomized paper:
  `{ "topic", "title", "sections": [{ "section", "items": [ {id, format, prompt, ...payload} ] }] }`
  (answers included — graded client-side, as the rest of the app does).
- `POST /test/result` → body `{ topic, correct, total, sections: [{section, correct, total}] }`
  → awards XP/eggs via the existing `game.py` economy and `/play/result` logic
  (XP per correct, egg progress, level-up, companion XP), returns
  `{ xp_earned, events, player, report }`. Test items are not word-linked, so
  no `WordStat` is touched.

### Content source & seeding

- Unit 4 pool is **version-controlled Python data** in
  `backend/app/test_content.py` (a dict: topic → title + list of item specs).
- Loaded by an **idempotent first-run seed** in `init_db()` (seed topic only if
  it currently has zero items — same pattern as the default-player seed), plus a
  **PIN-protected `POST /test/seed?topic=unit4`** (reload/replace) so the pool
  can be updated later without a schema change. The app runs SQLite on a Railway
  volume in production, so first-run seeding is safe.

## Frontend

- New route `/test` → `TestPractice` page (`frontend/src/pages/TestPractice.tsx`)
  that drives the intro → section flow → report, tracks per-section results, and
  posts the result.
- Small, focused renderers in `frontend/src/test/`, one per format, each taking
  an item and reporting correct/incorrect:
  `ListenPick.tsx`, `Mcq.tsx`, `GapBank.tsx`, `Match.tsx`, `Order.tsx`,
  `Reading.tsx`.
- Reuses: `tts.speak`, `sounds.sfx`, `canvas-confetti`, `Companion`,
  `FeedbackBanner`/`ProgressDots` patterns, chunky Tailwind styles, and the
  reward overlay for egg/level events.
- Types added to `types.ts`: `TestSection`, `TestFormat`, `TestItem`,
  `TestPaper`, `TestReport`.
- i18n (`i18n.tsx`): EN/ES strings for the button, section names, intro, Start,
  Next, check, report labels.

## Out of scope (YAGNI)

- Units other than Unit 4 (model supports them; content comes later).
- Parent-zone UI to author test items (seed via code for now).
- Free-text writing / AI grading.
- Server-side answer hiding (app grades client-side throughout).

## Testing

- Backend: a unit test that `GET /test/paper` returns the expected section
  order and item counts, and that every item's `answer` is present in its
  `options`/derivable (payload integrity check over `test_content.py`).
- Frontend: manual verification via the dev-server preview — run one full paper,
  confirm each renderer grades correctly and the report totals match.
