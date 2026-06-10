"""Game rules: XP curve, egg hatching, streaks, companion evolution."""

import random
from datetime import date, timedelta

from .species import RARITY_WEIGHTS, SPECIES, STAGE_THRESHOLDS

XP_PER_CORRECT = 10
EGG_POINTS_PER_CORRECT = 4


def level_for_xp(xp: int) -> int:
    """Level n -> n+1 costs 100 + 50*(n-1) XP, so early levels come fast."""
    level, remaining = 1, xp
    while remaining >= 100 + 50 * (level - 1):
        remaining -= 100 + 50 * (level - 1)
        level += 1
    return level


def xp_into_level(xp: int) -> tuple[int, int]:
    """Returns (xp progressed within current level, xp needed for next)."""
    level, remaining = 1, xp
    while remaining >= 100 + 50 * (level - 1):
        remaining -= 100 + 50 * (level - 1)
        level += 1
    return remaining, 100 + 50 * (level - 1)


def roll_species() -> dict:
    rarity = random.choices(
        list(RARITY_WEIGHTS), weights=list(RARITY_WEIGHTS.values())
    )[0]
    return random.choice([s for s in SPECIES if s["rarity"] == rarity])


def stage_for_companion_xp(xp: int) -> int:
    stage = 1
    for i, threshold in enumerate(STAGE_THRESHOLDS):
        if xp >= threshold:
            stage = i + 1
    return stage


def updated_streak(streak: int, last_played: date | None, today: date) -> int:
    if last_played == today:
        return max(streak, 1)
    if last_played == today - timedelta(days=1):
        return streak + 1
    return 1
