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


if __name__ == "__main__":
    test_testitem_model_fields()
    test_content_integrity()
    test_assemble_paper()
    test_grant_rewards()
    test_endpoints()  # must be last: reloads modules
    print("ALL PASSED")
