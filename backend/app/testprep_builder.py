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
