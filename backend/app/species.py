"""Dino species catalog. Art is emoji-based for v1; the frontend styles frames
by rarity. Designed as data so future creature packs are content, not code."""

RARITY_WEIGHTS = {"common": 60, "rare": 25, "epic": 12, "legendary": 3}

# Companion XP needed to reach each stage (index 0 = stage 1).
STAGE_THRESHOLDS = [0, 150, 400]

# Every stage must be an actual creature — no rocks, lightning bolts or crowns.
SPECIES = [
    {"id": "rexi", "rarity": "common", "color": "#5DCAA5",
     "stages": [{"name": "Rexi", "emoji": "🦖"}, {"name": "Rexor", "emoji": "🦖"}, {"name": "Rexodón", "emoji": "🐲"}]},
    {"id": "lola", "rarity": "common", "color": "#9FE1CB",
     "stages": [{"name": "Lola", "emoji": "🦕"}, {"name": "Lolasaurio", "emoji": "🦕"}, {"name": "Megalola", "emoji": "🐉"}]},
    {"id": "trici", "rarity": "common", "color": "#FAC775",
     "stages": [{"name": "Trici", "emoji": "🦏"}, {"name": "Tricetops", "emoji": "🦏"}, {"name": "Tricerrey", "emoji": "🐲"}]},
    {"id": "spike", "rarity": "common", "color": "#F0997B",
     "stages": [{"name": "Spike", "emoji": "🦔"}, {"name": "Spikego", "emoji": "🦔"}, {"name": "Estegorex", "emoji": "🐉"}]},
    {"id": "dakti", "rarity": "common", "color": "#B5D4F4",
     "stages": [{"name": "Dakti", "emoji": "🐤"}, {"name": "Daktilón", "emoji": "🦅"}, {"name": "Pterodáctilo Real", "emoji": "🦅"}]},
    {"id": "compi", "rarity": "common", "color": "#CECBF6",
     "stages": [{"name": "Compi", "emoji": "🦎"}, {"name": "Compirráptor", "emoji": "🦎"}, {"name": "Compi Veloz", "emoji": "🐊"}]},
    {"id": "raptora", "rarity": "rare", "color": "#7F77DD",
     "stages": [{"name": "Raptora", "emoji": "🦅"}, {"name": "Velocirraptora", "emoji": "🦖"}, {"name": "Raptora Tormenta", "emoji": "🐲"}]},
    {"id": "anki", "rarity": "rare", "color": "#1D9E75",
     "stages": [{"name": "Anki", "emoji": "🐢"}, {"name": "Ankilo", "emoji": "🐢"}, {"name": "Ankilotanque", "emoji": "🐉"}]},
    {"id": "bracho", "rarity": "rare", "color": "#378ADD",
     "stages": [{"name": "Bracho", "emoji": "🦒"}, {"name": "Brachiogiga", "emoji": "🦒"}, {"name": "Cuellocielo", "emoji": "🐉"}]},
    {"id": "dilo", "rarity": "rare", "color": "#ED93B1",
     "stages": [{"name": "Dilo", "emoji": "🦜"}, {"name": "Dilofo", "emoji": "🦜"}, {"name": "Dilofreyna", "emoji": "🦤"}]},
    {"id": "mosa", "rarity": "epic", "color": "#185FA5",
     "stages": [{"name": "Mosa", "emoji": "🐊"}, {"name": "Mosasaurio", "emoji": "🐊"}, {"name": "Rey de los Mares", "emoji": "🐲"}]},
    {"id": "spino", "rarity": "epic", "color": "#D85A30",
     "stages": [{"name": "Spino", "emoji": "🐉"}, {"name": "Spinosaurio", "emoji": "🐉"}, {"name": "Spino Volcánico", "emoji": "🐲"}]},
    {"id": "carno", "rarity": "epic", "color": "#D4537E",
     "stages": [{"name": "Carno", "emoji": "🦖"}, {"name": "Carnotauro", "emoji": "🦖"}, {"name": "Carno Embestida", "emoji": "🐲"}]},
    {"id": "fenix", "rarity": "legendary", "color": "#EF9F27",
     "stages": [{"name": "Dinofénix", "emoji": "🐤"}, {"name": "Fénix Jurásico", "emoji": "🦅"}, {"name": "Fénix Eterno", "emoji": "🐉"}]},
    {"id": "cristal", "rarity": "legendary", "color": "#AFA9EC",
     "stages": [{"name": "Cristalio", "emoji": "🦎"}, {"name": "Cristalodón", "emoji": "🐊"}, {"name": "Cristal Ancestral", "emoji": "🐲"}]},
    {"id": "galaxio", "rarity": "legendary", "color": "#534AB7",
     "stages": [{"name": "Galaxio", "emoji": "🦖"}, {"name": "Galaxiosaurio", "emoji": "🦕"}, {"name": "Devorador de Estrellas", "emoji": "🐉"}]},
]

SPECIES_BY_ID = {s["id"]: s for s in SPECIES}
