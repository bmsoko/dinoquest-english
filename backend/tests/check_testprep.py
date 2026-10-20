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


if __name__ == "__main__":
    test_testitem_model_fields()
    test_content_integrity()
    print("ALL PASSED")
