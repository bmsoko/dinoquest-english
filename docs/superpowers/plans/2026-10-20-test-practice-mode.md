# Test Practice Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided, auto-graded mock-test mode ("📝 Practice Test") that mirrors the Cambridge Unit 4 papers (Listening, Vocabulary, Grammar, Reading, Writing), randomized from a hand-authored pool.

**Architecture:** A new `TestItem` SQLModel table holds objective question items (topic + section + format + JSON payload), isolated from the Word/ExerciseItem spelling engine. A pure `assemble_paper()` builder draws a randomized paper per attempt. A new `/test` FastAPI router serves topics/paper/result and awards XP through a shared `game.grant_rewards()` helper. The React frontend adds a `/test` page that runs the five parts in order with small per-format renderer components, grades client-side, and shows a report card wired into the existing dino reward economy.

**Tech Stack:** Python 3.12 · FastAPI 0.136 · SQLModel · SQLite (Railway volume) · React 18 · TypeScript · Vite · TailwindCSS v4.

## Global Constraints

- Backend runs from `backend/` using `.venv/bin/python` (no pytest installed — tests are plain-assert scripts run with that interpreter).
- SQLite in all environments (`settings.database_url` starts with `sqlite`). Table creation is `SQLModel.metadata.create_all` in `init_db()`; content seeding only runs when the topic has zero items (idempotent first-run), matching the existing default-player seed.
- PIN-protected admin endpoints use the existing `check_pin` dependency (`backend/app/routers/units.py:18`), header `x-parent-pin`, value from `settings.parent_pin` (production PIN `0351`).
- Client-side grading: answers ship in the payload, consistent with every existing activity. Do not add server-side answer hiding.
- Reuse existing frontend primitives: `tts.speak`, `sounds.sfx`, `canvas-confetti`, `Companion`, `RewardOverlay`, and `activities/shared.tsx` (`FeedbackBanner`, `shuffle`). Chunky UI classes: `btn-chunky`, `card-toy`, color tokens `jungle`/`sky`/`coral`/`sun`/`berry`.
- i18n strings live in `frontend/src/i18n.tsx` with **both** `es` and `en` keys; Spanish is the primary display language for this child (Rioplatense phrasing, e.g. "escribí").
- Commit after each task. Co-author trailer on every commit:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Work on branch `feature/test-practice-mode` (already created).

---

### Task 1: `TestItem` model + table creation

**Files:**
- Modify: `backend/app/models.py` (append new model after `OwnedDino`)
- Modify: `backend/app/db.py:55` (create_all already covers new tables — verify, no change needed beyond confirming import path)
- Test: `backend/tests/check_testprep.py` (create; Step 1 adds the first assertion)

**Interfaces:**
- Produces: `TestItem` with fields `id: int|None (PK)`, `topic: str (index)`, `section: str (index)`, `format: str`, `prompt: str`, `payload: str` (JSON), `active: bool = True`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/check_testprep.py`:

```python
"""Plain-assert checks for the test-practice feature. Run:
    cd backend && .venv/bin/python tests/check_testprep.py
Exits non-zero on first failure.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def test_testitem_model_fields():
    from app.models import TestItem

    item = TestItem(topic="unit4", section="grammar", format="mcq", prompt="old → ___", payload="{}")
    assert item.topic == "unit4"
    assert item.section == "grammar"
    assert item.format == "mcq"
    assert item.active is True
    print("ok: test_testitem_model_fields")


if __name__ == "__main__":
    test_testitem_model_fields()
    print("ALL PASSED")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: FAIL with `ImportError: cannot import name 'TestItem'`.

- [ ] **Step 3: Add the model**

Append to `backend/app/models.py`:

```python
class TestItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    topic: str = Field(index=True)  # "unit4"
    section: str = Field(index=True)  # listening|vocabulary|grammar|reading|writing
    format: str  # listen_pick|mcq|gap_bank|match|order|reading
    prompt: str
    payload: str  # JSON, shape depends on format
    active: bool = True
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: `ok: test_testitem_model_fields` then `ALL PASSED`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/models.py backend/tests/check_testprep.py
git commit -m "feat(testprep): add TestItem model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Unit 4 content pool + integrity check

**Files:**
- Create: `backend/app/testprep_content.py`
- Test: `backend/tests/check_testprep.py` (add `test_content_integrity`)

**Interfaces:**
- Produces:
  - `SECTION_ORDER: list[str] = ["listening", "vocabulary", "grammar", "reading", "writing"]`
  - `PAPER_COUNTS: dict[str, int] = {"listening": 3, "vocabulary": 4, "grammar": 4, "reading": 1, "writing": 2}`
  - `TOPICS: dict[str, dict]` keyed by topic id; each value `{"title": str, "items": list[dict]}` where each item dict is `{"section", "format", "prompt", "payload"}` and `payload` is a Python dict (serialized to JSON at seed time).

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/check_testprep.py` (and call it in `__main__`):

```python
def test_content_integrity():
    from app.testprep_content import SECTION_ORDER, PAPER_COUNTS, TOPICS

    assert SECTION_ORDER == ["listening", "vocabulary", "grammar", "reading", "writing"]
    assert set(PAPER_COUNTS) == set(SECTION_ORDER)

    u4 = TOPICS["unit4"]
    assert u4["title"]
    by_section = {}
    for it in u4["items"]:
        assert it["section"] in SECTION_ORDER, it
        assert it["format"] in {"listen_pick", "mcq", "gap_bank", "match", "order", "reading"}, it
        assert it["prompt"]
        p = it["payload"]
        by_section.setdefault(it["section"], 0)
        by_section[it["section"]] += 1
        if it["format"] in {"listen_pick", "mcq"}:
            assert p["answer"] in p["options"], it
        elif it["format"] == "gap_bank":
            assert p["bank"] and p["sentences"]
            for s in p["sentences"]:
                assert s["answer"] in p["bank"], it
                assert "___" in s["text"], it
        elif it["format"] == "match":
            assert len(p["pairs"]) >= 2
        elif it["format"] == "order":
            assert " ".join(p["tokens"]) == p["answer"], it
        elif it["format"] == "reading":
            assert p["passage"] and len(p["questions"]) >= 2
            for q in p["questions"]:
                assert q["answer"] in q["options"], it
    # Enough items per section to assemble a full paper with variety
    for section, need in PAPER_COUNTS.items():
        assert by_section.get(section, 0) >= need, (section, by_section.get(section, 0), need)
    print("ok: test_content_integrity")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.testprep_content'`.

- [ ] **Step 3: Create the content pool**

Create `backend/app/testprep_content.py` with this exact content:

```python
"""Hand-authored Cambridge-style Unit 4 test items (family, homes,
comparatives, possessive pronouns). Objective formats only, auto-graded.
Source: the three Unit 4 practice papers. This is the version-controlled
source of truth; it is seeded into the TestItem table."""

SECTION_ORDER = ["listening", "vocabulary", "grammar", "reading", "writing"]
PAPER_COUNTS = {"listening": 3, "vocabulary": 4, "grammar": 4, "reading": 1, "writing": 2}

_UNIT4_ITEMS = [
    # ---- 1. LISTENING (listen_pick): TTS reads `audio`, tap the match ----
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "The flat is on the second floor.",
                 "options": ["first floor", "second floor", "third floor"],
                 "answer": "second floor"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "Mia is happier than Ben.",
                 "options": ["Mia is happier", "Ben is happier", "they are the same"],
                 "answer": "Mia is happier"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "Their grandparents live in a village.",
                 "options": ["a village", "a town centre", "a flat"],
                 "answer": "a village"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "The lift is outside the house.",
                 "options": ["inside", "outside", "upstairs"],
                 "answer": "outside"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "My cousin has curly hair.",
                 "options": ["curly hair", "short hair", "long hair"],
                 "answer": "curly hair"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "The garden is behind the house.",
                 "options": ["behind the house", "inside the house", "on the roof"],
                 "answer": "behind the house"}},

    # ---- 2. VOCABULARY (mcq / gap_bank / match) ----
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My mum's sister is my ___.",
     "payload": {"options": ["aunt", "cousin", "grandmother"], "answer": "aunt"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My uncle's son is my ___.",
     "payload": {"options": ["cousin", "grandson", "nephew"], "answer": "cousin"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My parents' parents are my ___.",
     "payload": {"options": ["grandparents", "cousins", "aunts"], "answer": "grandparents"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "The top covering of a house is the ___.",
     "payload": {"options": ["roof", "basement", "balcony"], "answer": "roof"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "You go up to another floor in a ___.",
     "payload": {"options": ["lift", "garden", "roof"], "answer": "lift"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My dad's brother is my ___.",
     "payload": {"options": ["uncle", "cousin", "grandfather"], "answer": "uncle"}},
    {"section": "vocabulary", "format": "gap_bank",
     "prompt": "Complete with the words in the box.",
     "payload": {"bank": ["upstairs", "outside", "inside", "town centre", "village", "balcony"],
                 "sentences": [
                     {"text": "My bedroom is on the first floor. It is ___.", "answer": "upstairs"},
                     {"text": "Let's play in the garden, ___ the house.", "answer": "outside"},
                     {"text": "It is raining. Let's stay ___.", "answer": "inside"},
                     {"text": "Shops and cafés are often in the ___.", "answer": "town centre"},
                     {"text": "My grandparents live in a small ___.", "answer": "village"},
                     {"text": "You can stand on the ___ and look at the street.", "answer": "balcony"}]}},
    {"section": "vocabulary", "format": "match",
     "prompt": "Match each word to its meaning.",
     "payload": {"pairs": [
         {"left": "lift", "right": "takes you to another floor"},
         {"left": "basement", "right": "a place below the ground floor"},
         {"left": "roof", "right": "the top of a house"},
         {"left": "balcony", "right": "a place outside an upstairs room"}]}},

    # ---- 3. GRAMMAR (mcq): comparatives + possessives ----
    {"section": "grammar", "format": "mcq", "prompt": "old → ___",
     "payload": {"options": ["older", "olderer", "more old"], "answer": "older"}},
    {"section": "grammar", "format": "mcq", "prompt": "young → ___",
     "payload": {"options": ["younger", "youngerer", "more young"], "answer": "younger"}},
    {"section": "grammar", "format": "mcq", "prompt": "pretty → ___",
     "payload": {"options": ["prettier", "prettyer", "more pretty"], "answer": "prettier"}},
    {"section": "grammar", "format": "mcq", "prompt": "curly → ___",
     "payload": {"options": ["curlier", "curlyer", "more curly"], "answer": "curlier"}},
    {"section": "grammar", "format": "mcq", "prompt": "happy → ___",
     "payload": {"options": ["happier", "happyer", "more happy"], "answer": "happier"}},
    {"section": "grammar", "format": "mcq", "prompt": "big → ___",
     "payload": {"options": ["bigger", "biger", "more big"], "answer": "bigger"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "The red bag belongs to me. It is ___.",
     "payload": {"options": ["mine", "hers", "yours"], "answer": "mine"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "This is Emma's room. It is ___.",
     "payload": {"options": ["hers", "his", "theirs"], "answer": "hers"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "Mum and I live here. The house is ___.",
     "payload": {"options": ["ours", "theirs", "mine"], "answer": "ours"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "The cousins have bikes. The bikes are ___.",
     "payload": {"options": ["theirs", "ours", "yours"], "answer": "theirs"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "This is your coat. It is ___.",
     "payload": {"options": ["yours", "his", "mine"], "answer": "yours"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "This is his bedroom. It is ___.",
     "payload": {"options": ["his", "hers", "ours"], "answer": "his"}},

    # ---- 4. READING (reading): passage + comprehension MCQs ----
    {"section": "reading", "format": "reading", "prompt": "Read and answer.",
     "payload": {"passage": "Hello! I'm Oliver. I live with my parents and my younger "
                            "sister, Lily. We live in a house in a village. My aunt lives "
                            "in a flat in the town centre. Her flat is on the second floor, "
                            "and she uses the lift. Lily's hair is curlier than mine.",
                 "questions": [
                     {"q": "Where does Oliver live?",
                      "options": ["In a house in a village", "In a flat in the town centre", "In a basement"],
                      "answer": "In a house in a village"},
                     {"q": "Where does his aunt live?",
                      "options": ["In a flat in the town centre", "In a village", "In a house"],
                      "answer": "In a flat in the town centre"},
                     {"q": "Whose hair is curlier?",
                      "options": ["Lily's", "Oliver's", "the aunt's"],
                      "answer": "Lily's"}]}},
    {"section": "reading", "format": "reading", "prompt": "Read and answer.",
     "payload": {"passage": "I am Sam. I live with my parents, my sister and my "
                            "grandparents. Our house is in a village. My grandparents sleep "
                            "downstairs. My sister and I sleep upstairs. My bedroom is "
                            "smaller than hers. The garden is outside the house.",
                 "questions": [
                     {"q": "Does Sam live in a flat?",
                      "options": ["No, he lives in a house", "Yes, in the town centre", "Yes, on the third floor"],
                      "answer": "No, he lives in a house"},
                     {"q": "Where do the grandparents sleep?",
                      "options": ["Downstairs", "Upstairs", "In the garden"],
                      "answer": "Downstairs"},
                     {"q": "Whose bedroom is bigger?",
                      "options": ["His sister's", "Sam's", "the grandparents'"],
                      "answer": "His sister's"}]}},
    {"section": "reading", "format": "reading", "prompt": "Read and answer.",
     "payload": {"passage": "I am Rosie. My family lives in the town centre. Our flat is on "
                            "the third floor. We take the lift. It has a balcony, but it has "
                            "no garden. My cousin Mia lives in a house in a village. Her "
                            "house is older than our flat.",
                 "questions": [
                     {"q": "Which floor is Rosie's flat on?",
                      "options": ["The third floor", "The first floor", "The second floor"],
                      "answer": "The third floor"},
                     {"q": "Does her flat have a garden?",
                      "options": ["No, it doesn't", "Yes, it does", "Yes, a big one"],
                      "answer": "No, it doesn't"},
                     {"q": "Which home is older?",
                      "options": ["Mia's house", "Rosie's flat", "they are the same"],
                      "answer": "Mia's house"}]}},

    # ---- 5. WRITING (order / gap_bank): controlled writing ----
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["Mia", "is", "happier", "than", "Ben"],
                 "answer": "Mia is happier than Ben"}},
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["My", "flat", "is", "on", "the", "third", "floor"],
                 "answer": "My flat is on the third floor"}},
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["The", "red", "bag", "is", "mine"],
                 "answer": "The red bag is mine"}},
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["Her", "house", "is", "older", "than", "our", "flat"],
                 "answer": "Her house is older than our flat"}},
    {"section": "writing", "format": "gap_bank",
     "prompt": "Complete with the words in the box.",
     "payload": {"bank": ["younger", "mine", "outside"],
                 "sentences": [
                     {"text": "My sister is ___ than my dad.", "answer": "younger"},
                     {"text": "This book is ___.", "answer": "mine"},
                     {"text": "The garden is ___ the house.", "answer": "outside"}]}},
]

TOPICS = {
    "unit4": {"title": "Unit 4 · Family & Homes", "items": _UNIT4_ITEMS},
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: `ok: test_content_integrity` and `ALL PASSED`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/testprep_content.py backend/tests/check_testprep.py
git commit -m "feat(testprep): author Unit 4 question pool

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Paper assembler (pure function)

**Files:**
- Create: `backend/app/testprep_builder.py`
- Test: `backend/tests/check_testprep.py` (add `test_assemble_paper`)

**Interfaces:**
- Consumes: `SECTION_ORDER`, `PAPER_COUNTS` from `testprep_content`.
- Produces:
  - `serialize_item(item) -> dict`: returns `{"id": item.id, "format": item.format, "prompt": item.prompt, **json.loads(item.payload)}`. Works for any object exposing `.id/.format/.prompt/.payload` (ORM row).
  - `assemble_paper(items: list, counts: dict[str, int]) -> list[dict]`: for each section in `SECTION_ORDER`, filter `items` to that section with `active` truthy, `random.sample` up to `counts[section]`, and return `[{"section": s, "items": [serialize_item(i), ...]}, ...]` in section order (sections with zero picks are included with an empty list).

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/check_testprep.py` (and call in `__main__`):

```python
def test_assemble_paper():
    import json as _json
    from types import SimpleNamespace
    from app.testprep_builder import assemble_paper, serialize_item
    from app.testprep_content import SECTION_ORDER

    def fake(i, section, fmt="mcq", active=True):
        payload = _json.dumps({"options": ["a", "b"], "answer": "a"})
        return SimpleNamespace(id=i, section=section, format=fmt, prompt=f"q{i}", payload=payload, active=active)

    items = []
    k = 0
    for s in SECTION_ORDER:
        for _ in range(5):
            items.append(fake(k, s)); k += 1
    items.append(fake(999, "grammar", active=False))  # inactive excluded

    counts = {"listening": 3, "vocabulary": 4, "grammar": 4, "reading": 1, "writing": 2}
    paper = assemble_paper(items, counts)

    assert [sec["section"] for sec in paper] == SECTION_ORDER  # fixed order
    got = {sec["section"]: len(sec["items"]) for sec in paper}
    assert got == counts, got
    # serialize flattens payload into the item dict
    one = paper[0]["items"][0]
    assert one["format"] == "mcq" and one["answer"] == "a" and "id" in one
    # inactive never chosen
    ids = [it["id"] for sec in paper for it in sec["items"]]
    assert 999 not in ids
    print("ok: test_assemble_paper")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.testprep_builder'`.

- [ ] **Step 3: Implement the builder**

Create `backend/app/testprep_builder.py`:

```python
import json
import random

from .testprep_content import SECTION_ORDER


def serialize_item(item) -> dict:
    """Flatten an item's JSON payload into a client-ready dict."""
    return {
        "id": item.id,
        "format": item.format,
        "prompt": item.prompt,
        **json.loads(item.payload),
    }


def assemble_paper(items: list, counts: dict) -> list[dict]:
    """Build a randomized paper: for each section in fixed order, pick up to
    counts[section] active items at random. Sections are always present."""
    sections = []
    for section in SECTION_ORDER:
        pool = [i for i in items if i.section == section and i.active]
        n = min(counts.get(section, 0), len(pool))
        chosen = random.sample(pool, n) if n else []
        sections.append({"section": section, "items": [serialize_item(i) for i in chosen]})
    return sections
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: `ok: test_assemble_paper` and `ALL PASSED`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/testprep_builder.py backend/tests/check_testprep.py
git commit -m "feat(testprep): randomized paper assembler

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Extract `grant_rewards` into game.py (DRY the economy)

Both the existing spelling result and the new test result award the same XP/egg/level/streak/companion rewards. Extract that logic so both call one helper, keeping behavior identical.

**Files:**
- Modify: `backend/app/game.py` (add `grant_rewards`)
- Modify: `backend/app/routers/play.py:269-348` (`post_result` uses the helper for the reward half, keeping the per-word `WordStat` loop)
- Test: `backend/tests/check_testprep.py` (add `test_grant_rewards`)

**Interfaces:**
- Produces: `grant_rewards(session, player, n_correct: int, today) -> list[dict]`. Adds `n_correct * XP_PER_CORRECT` XP to `player`; updates `player.level`, weekly XP (`roll_week`), streak (`updated_streak`), egg progress + hatching (creating `OwnedDino`, setting `companion_id` if none), and companion evolution; returns the same `events` list shape `post_result` builds today (`level_up`, `egg_hatched`, `dino_evolved`). Commits owned-dino rows as needed but leaves the final `session.commit()` to the caller.
- Consumes (in later tasks): the `/test/result` endpoint calls `grant_rewards`.

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/check_testprep.py` (and call in `__main__`). Uses an in-memory DB:

```python
def test_grant_rewards():
    from datetime import date
    from sqlmodel import SQLModel, Session, create_engine
    from app.models import Player
    from app.game import grant_rewards, XP_PER_CORRECT

    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        p = Player(name="T")
        s.add(p); s.commit(); s.refresh(p)
        events = grant_rewards(s, p, n_correct=3, today=date.today())
        s.commit()
        assert p.xp == 3 * XP_PER_CORRECT
        assert p.streak >= 1
        assert isinstance(events, list)
    print("ok: test_grant_rewards")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: FAIL with `ImportError: cannot import name 'grant_rewards'`.

- [ ] **Step 3: Add the helper, then refactor `post_result` to use it**

Add to `backend/app/game.py` (imports go at top: `from .models import OwnedDino, Player`; `from .themes import ALL_SPECIES_BY_ID`). Place after `updated_streak`:

```python
def grant_rewards(session, player, n_correct: int, today) -> list[dict]:
    """Shared reward economy: XP, level-up, weekly XP, streak, egg hatching and
    companion evolution. Caller handles the final commit. Returns game events."""
    events: list[dict] = []
    xp_earned = n_correct * XP_PER_CORRECT

    old_level = level_for_xp(player.xp)
    player.xp += xp_earned
    new_level = level_for_xp(player.xp)
    if new_level > old_level:
        events.append({"type": "level_up", "level": new_level})
    player.level = new_level

    monday = week_start_of(today)
    if player.week_start != monday:
        player.week_start = monday
        player.weekly_xp = 0
    player.weekly_xp += xp_earned

    player.streak = updated_streak(player.streak, player.last_played, today)
    player.last_played = today

    player.egg_progress += n_correct * EGG_POINTS_PER_CORRECT
    while player.egg_progress >= 100:
        player.egg_progress -= 100
        species = roll_species(player.theme)
        dino = OwnedDino(player_id=player.id, species_id=species["id"])
        session.add(dino)
        session.commit()
        session.refresh(dino)
        if player.companion_id is None:
            player.companion_id = dino.id
        events.append({"type": "egg_hatched",
                       "dino": {"id": dino.id, "species_id": species["id"],
                                "rarity": species["rarity"], "stage": 1}})

    if player.companion_id:
        companion = session.get(OwnedDino, player.companion_id)
        if companion and companion.player_id == player.id:
            old_stage = companion.stage
            companion.xp += xp_earned
            companion.stage = stage_for_companion_xp(companion.xp)
            if companion.stage > old_stage:
                species = ALL_SPECIES_BY_ID.get(companion.species_id, {})
                stage_info = species.get("stages", [{}] * 3)[companion.stage - 1]
                events.append({"type": "dino_evolved", "dino_id": companion.id,
                               "stage": companion.stage, "name": stage_info.get("name", "")})
            session.add(companion)

    session.add(player)
    return events
```

Then in `backend/app/routers/play.py`, replace the body of `post_result` from the line `n_correct = sum(...)` down to just before `session.add(player)`/`session.commit()` with:

```python
    n_correct = sum(1 for r in req.results if r.correct)
    events = grant_rewards(session, player, n_correct, today)
    xp_earned = n_correct * XP_PER_CORRECT

    session.commit()
```

Keep the `WordStat` loop above it unchanged, keep the final `progress, needed = xp_into_level(...)` return block unchanged, and add `grant_rewards` to the existing `from ..game import (...)` import. Remove now-unused imports only if they become unused (`roll_species`, `OwnedDino`, `ALL_SPECIES_BY_ID`, `week_start_of` may still be referenced elsewhere — leave `roll_week` which is still used; verify with a grep before deleting any import).

- [ ] **Step 4: Run tests + smoke-check the spelling flow still works**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: `ok: test_grant_rewards` and `ALL PASSED`.

Then smoke test `post_result` end-to-end with the TestClient:

```bash
cd backend && .venv/bin/python -c "
import os, tempfile
os.environ['DATABASE_URL']='sqlite:///'+tempfile.mkdtemp()+'/t.db'
from fastapi.testclient import TestClient
from app.main import app
c=TestClient(app)
r=c.post('/api/v1/play/result', json={'results':[{'word_id':None,'correct':True},{'word_id':None,'correct':False}]}, headers={'X-Player-Id':'1'})
print(r.status_code, r.json()['xp_earned'], 'events:', len(r.json()['events']))
assert r.status_code==200 and r.json()['xp_earned']==10
print('spelling result OK')
"
```
Expected: `200 10 events: ...` then `spelling result OK`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/game.py backend/app/routers/play.py backend/tests/check_testprep.py
git commit -m "refactor: share reward economy via game.grant_rewards

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `/test` router + seeding + wiring

**Files:**
- Create: `backend/app/routers/testprep.py`
- Modify: `backend/app/db.py` (add `seed_testprep(session)` call in `init_db`, first-run only)
- Modify: `backend/app/main.py` (import + `include_router(testprep.router, prefix="/api/v1")`)
- Test: `backend/tests/check_testprep.py` (add `test_endpoints`)

**Interfaces:**
- Consumes: `TestItem`, `assemble_paper`, `serialize_item`, `TOPICS`, `PAPER_COUNTS`, `grant_rewards`, `get_session`, `check_pin`, `get_player`, `player_id_header`.
- Produces HTTP:
  - `GET /test/topics` → `[{"topic": str, "title": str, "items": int}]` (active items count, topics with >0 items).
  - `GET /test/paper?topic=unit4` → `{"topic", "title", "sections": [{"section", "items": [...]}]}`. 404 if topic unknown/empty.
  - `POST /test/result` (body `TestResultRequest`) → `{"xp_earned", "events", "player": {...}, "report": {...}}`.
  - `POST /test/seed` (PIN) → `{"topic", "seeded": int}` (replace topic's items from `TOPICS`).
- Produces Python: `seed_testprep(session) -> None` (idempotent first-run seed of every topic that currently has zero items).

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/check_testprep.py` (and call in `__main__`). Builds an app on a temp DB so startup seeding runs:

```python
def test_endpoints():
    import os, tempfile, importlib
    os.environ["DATABASE_URL"] = "sqlite:///" + tempfile.mkdtemp() + "/t.db"
    import app.config as cfg
    importlib.reload(cfg)
    import app.db as dbmod
    importlib.reload(dbmod)
    import app.main as mainmod
    importlib.reload(mainmod)
    from fastapi.testclient import TestClient

    with TestClient(mainmod.app) as c:  # context triggers startup (seeding)
        topics = c.get("/api/v1/test/topics").json()
        assert any(t["topic"] == "unit4" and t["items"] > 0 for t in topics), topics

        paper = c.get("/api/v1/test/paper", params={"topic": "unit4"}).json()
        assert paper["title"] == "Unit 4 · Family & Homes"
        assert [s["section"] for s in paper["sections"]] == [
            "listening", "vocabulary", "grammar", "reading", "writing"]
        assert len(paper["sections"][0]["items"]) == 3  # listening count

        res = c.post("/api/v1/test/result", headers={"X-Player-Id": "1"}, json={
            "topic": "unit4", "correct": 12, "total": 16,
            "sections": [{"section": "grammar", "correct": 4, "total": 4}]})
        body = res.json()
        assert res.status_code == 200, body
        assert body["xp_earned"] == 120  # 12 * 10
        assert body["report"]["total"] == 16 and body["report"]["correct"] == 12
    print("ok: test_endpoints")
```

Note: set `PARENT_PIN` is not needed here (seed endpoint tested manually). Ensure this test runs **last** in `__main__` since it reloads modules.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: FAIL (404 or import error — `/test/topics` route does not exist yet).

- [ ] **Step 3: Implement router, seeding, and wiring**

Create `backend/app/routers/testprep.py`:

```python
import json

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..game import XP_PER_CORRECT, grant_rewards, xp_into_level
from ..models import TestItem
from ..routers.units import check_pin
from ..testprep_builder import assemble_paper
from ..testprep_content import PAPER_COUNTS, TOPICS
from datetime import date

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
            out.append({"topic": topic, "title": meta["title"], "items": n})
    return out


@router.get("/paper")
def get_paper(topic: str = "unit4", session: Session = Depends(get_session)):
    items = session.exec(select(TestItem).where(TestItem.topic == topic)).all()
    if not items:
        raise HTTPException(status_code=404, detail="No hay preguntas para este tema")
    title = TOPICS.get(topic, {}).get("title", topic)
    return {"topic": topic, "title": title, "sections": assemble_paper(items, PAPER_COUNTS)}


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
```

Add seeding to `backend/app/db.py` — inside `init_db()`, after the default-player seed block (within the same `with Session(engine) as session:` or a new one), add:

```python
    # First-run seed of test-practice content (only topics with no items yet)
    from .models import TestItem
    from .testprep_content import TOPICS
    from .routers.testprep import _load_topic

    with Session(engine) as session:
        for topic in TOPICS:
            exists = session.exec(select(TestItem).where(TestItem.topic == topic)).first()
            if not exists:
                _load_topic(session, topic)
        session.commit()
```

(`select` is already imported in `db.py` via `from sqlmodel import Session, select` inside `init_db`; if that local import is scoped, reuse it — it is imported at line 57. Import `TestItem`/helpers lazily as shown to avoid circular imports, since `routers.testprep` imports from `db`.)

Wire the router in `backend/app/main.py`:

```python
from .routers import play, player, testprep, units
...
app.include_router(testprep.router, prefix="/api/v1")
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/python tests/check_testprep.py`
Expected: all `ok:` lines including `ok: test_endpoints`, then `ALL PASSED`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/testprep.py backend/app/db.py backend/app/main.py backend/tests/check_testprep.py
git commit -m "feat(testprep): /test router + first-run seeding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Frontend types + i18n strings

**Files:**
- Modify: `frontend/src/types.ts` (append test types)
- Modify: `frontend/src/i18n.tsx` (add keys to both `es` and `en`)

**Interfaces:**
- Produces TS types: `TestSection`, `TestFormat`, `TestItem`, `TestPaper`, `TestReport`, `TestRendererProps`.
- Produces i18n keys (both languages): `test_practice`, `test_intro`, `test_start`, `test_part`, `test_of`, `sec_listening`, `sec_vocabulary`, `sec_grammar`, `sec_reading`, `sec_writing`, `test_next`, `test_report_title`, `test_your_score`, `test_play_again`, `match_help`, `order_help`, `gap_help`, `reading_help`, `listen_help`.

- [ ] **Step 1: Add the types**

Append to `frontend/src/types.ts`:

```typescript
export type TestSection = 'listening' | 'vocabulary' | 'grammar' | 'reading' | 'writing'
export type TestFormat = 'listen_pick' | 'mcq' | 'gap_bank' | 'match' | 'order' | 'reading'

export interface TestItem {
  id: number
  format: TestFormat
  prompt: string
  // format-specific (flattened payload)
  audio?: string
  options?: string[]
  answer?: string
  bank?: string[]
  sentences?: { text: string; answer: string }[]
  pairs?: { left: string; right: string }[]
  tokens?: string[]
  passage?: string
  questions?: { q: string; options: string[]; answer: string }[]
  emoji?: string
}

export interface TestPaper {
  topic: string
  title: string
  sections: { section: TestSection; items: TestItem[] }[]
}

export interface TestReport {
  topic: string
  correct: number
  total: number
  sections: { section: TestSection; correct: number; total: number }[]
}

export interface TestRendererProps {
  item: TestItem
  onGraded: (correct: number, total: number) => void
}
```

- [ ] **Step 2: Add i18n strings**

In `frontend/src/i18n.tsx`, add to the `es` object:

```typescript
    test_practice: 'Practicar prueba',
    test_intro: '5 partes · unos 6 minutos',
    test_start: '¡Empezar la prueba!',
    test_part: 'Parte',
    test_of: 'de',
    sec_listening: 'Escuchar',
    sec_vocabulary: 'Vocabulario',
    sec_grammar: 'Gramática',
    sec_reading: 'Lectura',
    sec_writing: 'Escritura',
    test_next: 'Siguiente',
    test_report_title: '¡Prueba terminada!',
    test_your_score: 'Tu puntaje',
    test_play_again: 'Otra prueba',
    listen_help: 'Escuchá y tocá la respuesta correcta',
    match_help: 'Uní cada palabra con su significado',
    order_help: 'Tocá las palabras en el orden correcto',
    gap_help: 'Completá con las palabras del recuadro',
    reading_help: 'Leé y tocá la respuesta correcta',
```

And the matching keys to the `en` object:

```typescript
    test_practice: 'Practice Test',
    test_intro: '5 parts · about 6 minutes',
    test_start: 'Start the test!',
    test_part: 'Part',
    test_of: 'of',
    sec_listening: 'Listening',
    sec_vocabulary: 'Vocabulary',
    sec_grammar: 'Grammar',
    sec_reading: 'Reading',
    sec_writing: 'Writing',
    test_next: 'Next',
    test_report_title: 'Test finished!',
    test_your_score: 'Your score',
    test_play_again: 'Another test',
    listen_help: 'Listen and tap the correct answer',
    match_help: 'Match each word to its meaning',
    order_help: 'Tap the words in the correct order',
    gap_help: 'Complete with the words in the box',
    reading_help: 'Read and tap the correct answer',
```

- [ ] **Step 3: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types.ts frontend/src/i18n.tsx
git commit -m "feat(testprep): frontend types + i18n strings

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Format renderer components

Six small components, each taking `TestRendererProps`, letting the child answer once, showing feedback via the existing `FeedbackBanner`, and calling `onGraded(correct, total)` once answered. The parent page owns the Next button.

**Files:**
- Create: `frontend/src/test/ListenPick.tsx`
- Create: `frontend/src/test/Mcq.tsx`
- Create: `frontend/src/test/GapBank.tsx`
- Create: `frontend/src/test/Match.tsx`
- Create: `frontend/src/test/Order.tsx`
- Create: `frontend/src/test/Reading.tsx`

**Interfaces:**
- Consumes: `TestRendererProps`, `TestItem` (Task 6); `speak` from `../tts`; `sfx` from `../sounds`; `FeedbackBanner`, `shuffle` from `../activities/shared`; `useLang` from `../i18n`.
- Produces: default-exported React components `ListenPick`, `Mcq`, `GapBank`, `Match`, `Order`, `Reading`. Each calls `onGraded` exactly once.

- [ ] **Step 1: Mcq + ListenPick (single-answer tap)**

Create `frontend/src/test/Mcq.tsx`:

```tsx
import { useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner } from '../activities/shared'

export function Mcq({ item, onGraded }: TestRendererProps) {
  const [picked, setPicked] = useState<string | null>(null)
  const answer = item.answer ?? ''

  const choose = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const correct = opt === answer
    correct ? sfx.correct() : sfx.wrong()
    onGraded(correct ? 1 : 0, 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-display text-2xl font-extrabold text-ink">{item.prompt}</p>
      <div className="flex flex-col gap-3">
        {(item.options ?? []).map((opt) => {
          const state = picked === null ? 'idle' : opt === answer ? 'good' : opt === picked ? 'bad' : 'idle'
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={picked !== null}
              className={`btn-chunky text-xl px-6 py-3 ${
                state === 'good' ? 'bg-jungle border-jungle-deep text-white'
                : state === 'bad' ? 'bg-coral border-coral-deep text-white'
                : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 5px' }}
            >
              {opt}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={picked === null ? 'idle' : picked === answer ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}
```

Create `frontend/src/test/ListenPick.tsx` — same as `Mcq` but with a prominent 🔊 button that speaks `item.audio` (auto-speak once on mount), and the options are the choices:

```tsx
import { useEffect, useState } from 'react'
import type { TestRendererProps } from '../types'
import { speak } from '../tts'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner } from '../activities/shared'

export function ListenPick({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const [picked, setPicked] = useState<string | null>(null)
  const answer = item.answer ?? ''
  const audio = item.audio ?? ''

  useEffect(() => { if (audio) speak(audio) }, [audio])

  const choose = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const correct = opt === answer
    correct ? sfx.correct() : sfx.wrong()
    onGraded(correct ? 1 : 0, 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.listen_help}</p>
      <button
        onClick={() => speak(audio)}
        className="btn-chunky mx-auto bg-sky border-sky-deep text-white text-3xl px-10 py-4"
      >
        🔊
      </button>
      <div className="flex flex-col gap-3">
        {(item.options ?? []).map((opt) => {
          const state = picked === null ? 'idle' : opt === answer ? 'good' : opt === picked ? 'bad' : 'idle'
          return (
            <button key={opt} onClick={() => choose(opt)} disabled={picked !== null}
              className={`btn-chunky text-xl px-6 py-3 ${
                state === 'good' ? 'bg-jungle border-jungle-deep text-white'
                : state === 'bad' ? 'bg-coral border-coral-deep text-white'
                : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 5px' }}>
              {opt}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={picked === null ? 'idle' : picked === answer ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}
```

- [ ] **Step 2: GapBank (tap a bank word into each blank)**

Create `frontend/src/test/GapBank.tsx`:

```tsx
import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { shuffle } from '../activities/shared'

export function GapBank({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const sentences = item.sentences ?? []
  const bankWords = useMemo(() => shuffle(item.bank ?? []), [item])
  const [fills, setFills] = useState<(string | null)[]>(sentences.map(() => null))
  const [done, setDone] = useState(false)

  const activeBlank = fills.findIndex((f) => f === null)
  const used = new Set(fills.filter(Boolean) as string[])

  const place = (word: string) => {
    if (done || activeBlank === -1 || used.has(word)) return
    const next = [...fills]
    next[activeBlank] = word
    setFills(next)
    if (next.every((f) => f !== null)) {
      setDone(true)
      const correct = next.filter((f, i) => f === sentences[i].answer).length
      correct === sentences.length ? sfx.correct() : sfx.wrong()
      onGraded(correct, sentences.length)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.gap_help}</p>
      <div className="flex flex-col gap-2">
        {sentences.map((s, i) => {
          const fill = fills[i]
          const state = !done ? 'idle' : fill === s.answer ? 'good' : 'bad'
          const [before, after] = s.text.split('___')
          return (
            <p key={i} className="font-display text-lg text-ink">
              {before}
              <span className={`inline-block min-w-16 rounded-lg border-2 px-2 text-center ${
                state === 'good' ? 'border-jungle bg-jungle-pale'
                : state === 'bad' ? 'border-coral bg-coral-pale'
                : i === activeBlank ? 'border-sky bg-sky/10' : 'border-sand-deep bg-white'}`}>
                {fill ?? ' '}
              </span>
              {after}
              {done && state === 'bad' && <span className="ml-2 font-bold text-jungle-deep">({s.answer})</span>}
            </p>
          )
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {bankWords.map((w) => (
          <button key={w} onClick={() => place(w)} disabled={done || used.has(w)}
            className={`btn-chunky px-4 py-2 text-lg ${used.has(w) ? 'opacity-30' : 'bg-sun border-sun-deep text-white'}`}
            style={{ borderWidth: '2px 2px 4px' }}>
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Match (tap left, then its meaning)**

Create `frontend/src/test/Match.tsx`:

```tsx
import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { shuffle } from '../activities/shared'

export function Match({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const pairs = item.pairs ?? []
  const rights = useMemo(() => shuffle(pairs.map((p) => p.right)), [item])
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matched, setMatched] = useState<Record<string, string>>({}) // left -> right
  const [wrongFlash, setWrongFlash] = useState<string | null>(null)

  const finish = (m: Record<string, string>) => {
    const correct = pairs.filter((p) => m[p.left] === p.right).length
    correct === pairs.length ? sfx.correct() : sfx.wrong()
    onGraded(correct, pairs.length)
  }

  const pickRight = (right: string) => {
    if (!selectedLeft || matched[selectedLeft]) return
    const expected = pairs.find((p) => p.left === selectedLeft)?.right
    if (right === expected) {
      const m = { ...matched, [selectedLeft]: right }
      setMatched(m)
      setSelectedLeft(null)
      if (Object.keys(m).length === pairs.length) finish(m)
    } else {
      setWrongFlash(right)
      sfx.wrong()
      setTimeout(() => setWrongFlash(null), 500)
    }
  }

  const usedRights = new Set(Object.values(matched))

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.match_help}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {pairs.map((p) => (
            <button key={p.left} onClick={() => !matched[p.left] && setSelectedLeft(p.left)}
              disabled={!!matched[p.left]}
              className={`btn-chunky px-3 py-2 ${matched[p.left] ? 'bg-jungle border-jungle-deep text-white'
                : selectedLeft === p.left ? 'bg-sky border-sky-deep text-white' : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 4px' }}>
              {p.left}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rights.map((r) => (
            <button key={r} onClick={() => pickRight(r)} disabled={usedRights.has(r)}
              className={`btn-chunky px-3 py-2 text-sm ${usedRights.has(r) ? 'bg-jungle-pale border-jungle text-jungle-deep opacity-70'
                : wrongFlash === r ? 'bg-coral border-coral-deep text-white' : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 4px' }}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Order (tap tokens into a sentence)**

Create `frontend/src/test/Order.tsx`:

```tsx
import { useMemo, useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { shuffle } from '../activities/shared'
import { FeedbackBanner } from '../activities/shared'

export function Order({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const tokens = item.tokens ?? []
  const answer = item.answer ?? ''
  const pool = useMemo(() => shuffle(tokens.map((tok, i) => ({ tok, i }))), [item])
  const [built, setBuilt] = useState<number[]>([]) // indices into pool
  const [done, setDone] = useState(false)

  const add = (poolIdx: number) => {
    if (done || built.includes(poolIdx)) return
    const next = [...built, poolIdx]
    setBuilt(next)
    if (next.length === pool.length) {
      setDone(true)
      const sentence = next.map((p) => pool[p].tok).join(' ')
      const correct = sentence === answer
      correct ? sfx.correct() : sfx.wrong()
      onGraded(correct ? 1 : 0, 1)
    }
  }

  const sentence = built.map((p) => pool[p].tok).join(' ')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.order_help}</p>
      <div className="min-h-12 rounded-xl border-2 border-sand-deep bg-white px-3 py-2 text-center font-display text-xl font-extrabold text-ink">
        {sentence || ' '}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pool.map((p, idx) => (
          <button key={idx} onClick={() => add(idx)} disabled={done || built.includes(idx)}
            className={`btn-chunky px-4 py-2 text-lg ${built.includes(idx) ? 'opacity-30' : 'bg-berry border-berry-deep text-white'}`}
            style={{ borderWidth: '2px 2px 4px' }}>
            {p.tok}
          </button>
        ))}
      </div>
      <FeedbackBanner status={!done ? 'idle' : sentence === answer ? 'correct' : 'reveal'} answer={answer} />
    </div>
  )
}
```

- [ ] **Step 5: Reading (passage + sequential MCQs)**

Create `frontend/src/test/Reading.tsx`:

```tsx
import { useState } from 'react'
import type { TestRendererProps } from '../types'
import { sfx } from '../sounds'
import { useLang } from '../i18n'
import { FeedbackBanner } from '../activities/shared'

export function Reading({ item, onGraded }: TestRendererProps) {
  const { t } = useLang()
  const questions = item.questions ?? []
  const [qIndex, setQIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const q = questions[qIndex]

  const choose = (opt: string) => {
    if (picked !== null) return
    setPicked(opt)
    const right = opt === q.answer
    right ? sfx.correct() : sfx.wrong()
    const newScore = score + (right ? 1 : 0)
    setScore(newScore)
    setTimeout(() => {
      if (qIndex + 1 < questions.length) {
        setQIndex(qIndex + 1)
        setPicked(null)
      } else {
        onGraded(newScore, questions.length)
      }
    }, 1200)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-bold text-ink-soft">{t.reading_help}</p>
      <div className="rounded-xl border-2 border-sand-deep bg-sand/40 p-4 font-bold text-ink">
        {item.passage}
      </div>
      <p className="font-display text-xl font-extrabold text-ink">
        {qIndex + 1}. {q.q}
      </p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt) => {
          const state = picked === null ? 'idle' : opt === q.answer ? 'good' : opt === picked ? 'bad' : 'idle'
          return (
            <button key={opt} onClick={() => choose(opt)} disabled={picked !== null}
              className={`btn-chunky px-5 py-2 text-left text-lg ${
                state === 'good' ? 'bg-jungle border-jungle-deep text-white'
                : state === 'bad' ? 'bg-coral border-coral-deep text-white'
                : 'bg-white border-sand-deep text-ink'}`}
              style={{ borderWidth: '2px 2px 4px' }}>
              {opt}
            </button>
          )
        })}
      </div>
      <FeedbackBanner status={picked === null ? 'idle' : picked === q.answer ? 'correct' : 'reveal'} answer={q.answer} />
    </div>
  )
}
```

- [ ] **Step 6: Type-check and commit**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors. (If `shuffle`/`FeedbackBanner` signatures differ, open `frontend/src/activities/shared.tsx` and match them.)

```bash
git add frontend/src/test/
git commit -m "feat(testprep): six format renderer components

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: TestPractice page + route + Home button + report

**Files:**
- Create: `frontend/src/pages/TestPractice.tsx`
- Modify: `frontend/src/App.tsx` (add `/test` route)
- Modify: `frontend/src/pages/Home.tsx` (add Practice Test button)

**Interfaces:**
- Consumes: `api` from `../api`; `TestPaper`, `TestItem`, `TestSection`, `TestReport`, `RoundResultResponse`, `GameEvent` from `../types`; the six renderers from `../test/*`; `useLang`; `Companion`, `RewardOverlay`; `confetti`.
- Produces: default route component `TestPractice` at `/test`.

- [ ] **Step 1: Build the page**

Create `frontend/src/pages/TestPractice.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { api } from '../api'
import { useLang } from '../i18n'
import type { GameEvent, PlayerState, Species, TestItem, TestPaper, TestSection } from '../types'
import { Companion } from '../components/Companion'
import { RewardOverlay } from '../components/RewardOverlay'
import { ListenPick } from '../test/ListenPick'
import { Mcq } from '../test/Mcq'
import { GapBank } from '../test/GapBank'
import { Match } from '../test/Match'
import { Order } from '../test/Order'
import { Reading } from '../test/Reading'

type Phase = 'intro' | 'running' | 'report' | 'empty'
type Screen = { section: TestSection; item: TestItem }

const RENDERERS = { listen_pick: ListenPick, mcq: Mcq, gap_bank: GapBank, match: Match, order: Order, reading: Reading }

export function TestPractice() {
  const { t } = useLang()
  const [phase, setPhase] = useState<Phase>('intro')
  const [paper, setPaper] = useState<TestPaper | null>(null)
  const [screens, setScreens] = useState<Screen[]>([])
  const [idx, setIdx] = useState(0)
  const [graded, setGraded] = useState<{ c: number; tot: number } | null>(null)
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({})
  const [player, setPlayer] = useState<PlayerState | null>(null)
  const [species, setSpecies] = useState<Species[]>([])
  const [xpEarned, setXpEarned] = useState(0)
  const [events, setEvents] = useState<GameEvent[]>([])

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([api.get('/player'), api.get('/player/species')])
    setPlayer(p.data); setSpecies(s.data)
  }, [])
  useEffect(() => { load() }, [load])

  const companion = player?.dinos.find((d) => d.id === player.companion_id) ?? null

  const start = async () => {
    try {
      const res = await api.get('/test/paper', { params: { topic: 'unit4' } })
      const data: TestPaper = res.data
      const flat: Screen[] = data.sections.flatMap((sec) => sec.items.map((item) => ({ section: sec.section, item })))
      if (flat.length === 0) { setPhase('empty'); return }
      setPaper(data); setScreens(flat); setIdx(0); setScores({}); setGraded(null); setPhase('running')
    } catch { setPhase('empty') }
  }

  const onGraded = (c: number, tot: number) => setGraded({ c, tot })

  const next = async () => {
    if (!graded) return
    const cur = screens[idx]
    setScores((prev) => {
      const s = prev[cur.section] ?? { correct: 0, total: 0 }
      return { ...prev, [cur.section]: { correct: s.correct + graded.c, total: s.total + graded.tot } }
    })
    setGraded(null)
    if (idx + 1 < screens.length) { setIdx(idx + 1); return }
    // Finished — compute totals and submit
    const finalScores: Record<string, { correct: number; total: number }> = { ...scores }
    const s = finalScores[cur.section] ?? { correct: 0, total: 0 }
    finalScores[cur.section] = { correct: s.correct + graded.c, total: s.total + graded.tot }
    const correct = Object.values(finalScores).reduce((a, b) => a + b.correct, 0)
    const total = Object.values(finalScores).reduce((a, b) => a + b.total, 0)
    const sections = Object.entries(finalScores).map(([section, v]) => ({ section, ...v }))
    const res = await api.post('/test/result', { topic: 'unit4', correct, total, sections })
    setScores(finalScores)
    setXpEarned(res.data.xp_earned)
    setEvents(res.data.events ?? [])
    setPlayer((p) => (p ? { ...p, ...res.data.player } : p))
    setPhase('report')
    if (correct === total && total > 0) confetti({ particleCount: 90, spread: 80, origin: { y: 0.7 } })
  }

  const totals = useMemo(() => {
    const correct = Object.values(scores).reduce((a, b) => a + b.correct, 0)
    const total = Object.values(scores).reduce((a, b) => a + b.total, 0)
    return { correct, total }
  }, [scores])

  const stars = totals.total ? (totals.correct / totals.total >= 0.9 ? 3 : totals.correct / totals.total >= 0.7 ? 2 : totals.correct / totals.total >= 0.5 ? 1 : 0) : 0
  const sectionLabel = (s: string) => (t as Record<string, string>)[`sec_${s}`] ?? s

  const cur = screens[idx]
  const Renderer = cur ? RENDERERS[cur.item.format] : null
  const partNumber = cur ? paper!.sections.findIndex((x) => x.section === cur.section) + 1 : 0

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4 pb-8">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn-chunky bg-white border-sand-deep px-3 py-1.5 text-lg" style={{ borderWidth: '2px 2px 5px' }}>←</Link>
        <h1 className="font-display text-2xl font-extrabold text-jungle-deep">📝 {t.test_practice}</h1>
      </div>

      {phase === 'intro' && (
        <div className="card-toy mx-auto mt-8 max-w-sm p-8 text-center">
          <div className="text-6xl mb-2">📝</div>
          <h2 className="font-display text-2xl font-extrabold">Unit 4 · Family &amp; Homes</h2>
          <p className="mt-2 font-bold text-ink-soft">{t.test_intro}</p>
          <button onClick={start} className="btn-chunky mt-6 bg-jungle border-jungle-deep text-white text-xl px-8 py-3">
            {t.test_start}
          </button>
        </div>
      )}

      {phase === 'empty' && (
        <div className="card-toy mx-auto mt-8 max-w-sm p-8 text-center">
          <div className="text-5xl mb-3">🦕</div>
          <p className="font-bold text-ink-soft">—</p>
          <Link to="/" className="btn-chunky mt-5 inline-block bg-white border-sand-deep px-6 py-2" style={{ borderWidth: '2px 2px 6px' }}>{t.back}</Link>
        </div>
      )}

      {phase === 'running' && cur && Renderer && (
        <>
          <div className="text-center font-display font-extrabold text-ink-soft">
            {t.test_part} {partNumber} {t.test_of} 5 · {sectionLabel(cur.section)}
          </div>
          <div className="card-toy p-5 sm:p-8">
            <Renderer key={idx} item={cur.item} onGraded={onGraded} />
          </div>
          <button onClick={next} disabled={!graded}
            className="btn-chunky mx-auto bg-sun border-sun-deep text-white text-xl px-10 py-3 disabled:opacity-40">
            {t.test_next} →
          </button>
        </>
      )}

      {phase === 'report' && (
        <div className="card-toy animate-pop mx-auto mt-6 max-w-sm p-8 text-center">
          <div className="text-5xl">{'⭐'.repeat(stars) || '🦕'}</div>
          <h2 className="mt-2 font-display text-2xl font-extrabold">{t.test_report_title}</h2>
          <p className="mt-1 font-display text-4xl font-extrabold text-jungle">{totals.correct}/{totals.total}</p>
          <p className="font-bold text-jungle-deep">+{xpEarned} XP</p>
          <div className="mt-4 flex flex-col gap-1 text-left">
            {Object.entries(scores).map(([section, v]) => (
              <div key={section} className="flex justify-between rounded-lg bg-sand px-3 py-1 font-bold">
                <span>{sectionLabel(section)}</span><span>{v.correct}/{v.total}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={start} className="btn-chunky bg-jungle border-jungle-deep text-white text-xl px-8 py-3">🔁 {t.test_play_again}</button>
            <Link to="/" className="btn-chunky bg-white border-sand-deep text-ink text-lg px-8 py-3" style={{ borderWidth: '2px 2px 6px' }}>{t.finish}</Link>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4"><Companion dino={companion} mood="idle" /></div>

      {events.length > 0 && (
        <RewardOverlay events={events} species={species} onDone={() => { setEvents([]); load() }} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add the route**

In `frontend/src/App.tsx`, import and register:

```tsx
import { TestPractice } from './pages/TestPractice'
// ...inside <Routes>:
          <Route path="/test" element={<TestPractice />} />
```

- [ ] **Step 3: Add the Home button**

In `frontend/src/pages/Home.tsx`, add below the `🆕 Latest words` link (around `Home.tsx:160`):

```tsx
      <Link
        to="/test"
        className="btn-chunky flex flex-col items-center bg-berry border-berry-deep text-white w-full max-w-xs px-8 py-3 text-center"
      >
        <span className="text-2xl">📝 {t.test_practice}</span>
      </Link>
```

- [ ] **Step 4: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors. Confirm `Companion` accepts `mood="idle"` and `dino={null}` (see `frontend/src/components/Companion.tsx`); adjust the prop if its signature differs.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/TestPractice.tsx frontend/src/App.tsx frontend/src/pages/Home.tsx
git commit -m "feat(testprep): Practice Test page, route, and Home entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: End-to-end verification in the browser preview

**Files:** none (verification only). Uses `.claude/launch.json` dev servers.

- [ ] **Step 1: Start backend + frontend dev servers**

Ensure `.claude/launch.json` has a backend entry (uvicorn, port 8000) and frontend (Vite, port 5173). Start both with `preview_start` by name. Confirm `GET http://localhost:8000/api/v1/test/topics` returns `unit4` with a non-zero count (first-run seeding populated the local DB).

- [ ] **Step 2: Walk one full paper**

In the preview at `http://localhost:5173`: pick/confirm a player profile, from Home tap **📝 Practice Test → Start**. Go through all five parts. Verify with `read_page` / `read_console_messages` that: the 🔊 listening plays, each renderer grades (green/red), the Next button enables only after answering, the part header counts 1–5, and the report shows per-section scores + total + XP. Capture a screenshot of the report card.

- [ ] **Step 3: Verify rewards persisted**

After finishing, confirm `GET /api/v1/player` (X-Player-Id header matching the chosen profile) shows increased `xp`/`weekly_xp`. Check `read_console_messages` for no errors.

- [ ] **Step 4: Commit any fixes found, then stop servers**

If verification surfaced bugs, fix the relevant source file, re-verify from Step 2, and commit each fix with the co-author trailer.

---

### Task 10: Deploy + seed production

**Files:** none (deploy only).

- [ ] **Step 1: Merge the feature branch to `main`**

```bash
git checkout main && git merge --no-ff feature/test-practice-mode
```

- [ ] **Step 2: Deploy both Railway services**

Use the established deploy flow (rsync service subdir → temp stage → `railway link --project dinoquest-english --environment production` → `railway up --service <svc> --detach`) for backend and frontend. First-run seeding runs automatically on backend startup (the production `testitem` table is new → empty → seeded).

- [ ] **Step 3: Verify production**

`GET https://backend-production-d0ed.up.railway.app/api/v1/test/topics` → `unit4` with items > 0. Open `https://english-newton.up.railway.app`, run one paper, confirm the report card.

- [ ] **Step 4: (If content is edited later) reseed**

To push updated `testprep_content.py` without a schema change:
```bash
curl -X POST "https://backend-production-d0ed.up.railway.app/api/v1/test/seed?topic=unit4" -H "x-parent-pin: 0351"
```

---

## Self-Review Notes

- **Spec coverage:** UX/flow (Tasks 8–9), 5 parts & formats (Tasks 2, 7), data model (Task 1), API incl. topics/paper/result/seed (Task 5), content-as-code + seeding (Tasks 2, 5), frontend renderers + page + types + i18n (Tasks 6–8), game tie-in (Task 4 + 5), report card (Task 8), testing (plain-assert scripts + preview). ✓
- **Formats** are consistent across content payloads (Task 2), the integrity check (Task 2), TS types (Task 6), and renderers/`RENDERERS` map (Tasks 7–8): `listen_pick, mcq, gap_bank, match, order, reading`.
- **`onGraded(correct: number, total: number)`** signature is identical across all six renderers and the page.
- **Out of scope** respected: no other units, no parent-zone authoring UI, no free-text grading.
