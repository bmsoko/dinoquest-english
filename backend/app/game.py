"""Game rules: XP curve, egg hatching, streaks, companion evolution."""

import random
from datetime import date, timedelta

from .models import OwnedDino, Player  # noqa: F401
from .species import RARITY_WEIGHTS, STAGE_THRESHOLDS
from .themes import ALL_SPECIES_BY_ID, theme_species

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


def roll_species(theme_id: str = "dinos") -> dict:
    pool = theme_species(theme_id)
    rarity = random.choices(
        list(RARITY_WEIGHTS), weights=list(RARITY_WEIGHTS.values())
    )[0]
    candidates = [s for s in pool if s["rarity"] == rarity] or pool
    return random.choice(candidates)


def stage_for_companion_xp(xp: int) -> int:
    stage = 1
    for i, threshold in enumerate(STAGE_THRESHOLDS):
        if xp >= threshold:
            stage = i + 1
    return stage


def week_start_of(d: date) -> date:
    """Monday of the week containing d — the weekly score resets here."""
    return d - timedelta(days=d.weekday())


def updated_streak(streak: int, last_played: date | None, today: date) -> int:
    if last_played == today:
        return max(streak, 1)
    if last_played == today - timedelta(days=1):
        return streak + 1
    return 1


MAX_CORRECT_PER_CALL = 100


def grant_rewards(session, player, n_correct: int, today) -> list[dict]:
    """Shared reward economy: XP, level-up, weekly XP, streak, egg hatching and
    companion evolution. Caller handles the final commit. Returns game events."""
    events: list[dict] = []
    # Defensive cap: callers pass client-reported counts; never let one call
    # mint unbounded XP or loop over thousands of egg hatches.
    n_correct = max(0, min(int(n_correct), MAX_CORRECT_PER_CALL))
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
