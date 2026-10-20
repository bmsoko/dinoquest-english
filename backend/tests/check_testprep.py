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
