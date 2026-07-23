"""Collectible themes. Each profile picks one; eggs hatch into that theme's
characters. Authored as data so adding a pack is content, not code.

A theme = id, names (ES/EN), a hero emoji, a collection label, and a list of
species. Each species has 3 evolution stages (same shape as the original dinos).
"""

from .species import SPECIES as DINO_SPECIES


def _build(prefix: str, rows: list) -> list:
    """rows = [(suffix, rarity, color, [(name, emoji) x3]), ...]"""
    out = []
    for suffix, rarity, color, stages in rows:
        out.append(
            {
                "id": f"{prefix}_{suffix}",
                "rarity": rarity,
                "color": color,
                "stages": [{"name": n, "emoji": e} for n, e in stages],
            }
        )
    return out


FAIRIES = _build("fairy", [
    ("sparkle", "common", "#CECBF6", [("Chispa", "✨"), ("Brillo", "🌟"), ("Destella", "💫")]),
    ("petal", "common", "#F4C0D1", [("Pétalo", "🌷"), ("Flor", "🌸"), ("Floralia", "🌺")]),
    ("leaf", "common", "#9FE1CB", [("Hojita", "🍃"), ("Verdina", "🌿"), ("Trébol", "🍀")]),
    ("bee", "common", "#FAC775", [("Abejita", "🐝"), ("Mariposa", "🦋"), ("Hadita", "🧚")]),
    ("dew", "common", "#B5D4F4", [("Rocío", "💧"), ("Gotita", "💦"), ("Marea", "🌊")]),
    ("moon", "rare", "#AFA9EC", [("Luna", "🌙"), ("Lunaria", "🌛"), ("Luna Llena", "🌝")]),
    ("star", "rare", "#7F77DD", [("Estrellita", "⭐"), ("Estela", "🌟"), ("Constelia", "✨")]),
    ("crystal", "epic", "#85B7EB", [("Cristalia", "🔮"), ("Gema", "💎"), ("Corona Mágica", "👑")]),
    ("queen", "legendary", "#EF9F27", [("Hadita Real", "🧚"), ("Reina Hada", "👸"), ("Reina del Reino", "🏰")]),
])

CARS = _build("car", [
    ("mini", "common", "#85B7EB", [("Mini", "🚗"), ("Mini Turbo", "🏎️"), ("Mini Campeón", "🏁")]),
    ("van", "common", "#9FE1CB", [("Vancito", "🚐"), ("Camioneta", "🚚"), ("Camionón", "🚛")]),
    ("taxi", "common", "#FAC775", [("Taxi", "🚕"), ("Taxi Veloz", "🚖"), ("Taxi Estrella", "🏆")]),
    ("jeep", "common", "#C0DD97", [("Jeepito", "🚙"), ("Todoterreno", "🛻"), ("Montañero", "🏔️")]),
    ("bug", "common", "#F0997B", [("Escarabajo", "🐞"), ("Bochito", "🚗"), ("Bólido", "💨")]),
    ("police", "rare", "#378ADD", [("Patrullita", "🚓"), ("Patrulla", "🚨"), ("Guardián", "🛡️")]),
    ("race", "rare", "#E24B4A", [("Carrerito", "🏎️"), ("Veloz", "🏁"), ("Campeón", "🏆")]),
    ("rocket", "epic", "#9B6DDB", [("Cohetito", "🚗"), ("Auto Cohete", "🚀"), ("Estrella Veloz", "🌟")]),
    ("legend", "legendary", "#EF9F27", [("Leyenda", "🏎️"), ("Súper Auto", "👑"), ("Arcoíris Veloz", "🌈")]),
])

PLANES = _build("air", [
    ("paper", "common", "#B5D4F4", [("Avión de Papel", "📄"), ("Planeadorcito", "🛩️"), ("Aviador", "✈️")]),
    ("prop", "common", "#9FE1CB", [("Hélice", "🛩️"), ("Avioncito", "✈️"), ("Despegue", "🛫")]),
    ("heli", "common", "#FAC775", [("Helicóptero", "🚁"), ("Girador", "🌀"), ("Tornado", "💨")]),
    ("glider", "common", "#C0DD97", [("Barrilete", "🪁"), ("Planeador", "🛩️"), ("Nubecito", "☁️")]),
    ("balloon", "common", "#F4C0D1", [("Globito", "🎈"), ("Globo Aero", "🎈"), ("Cielo", "🌤️")]),
    ("jet", "rare", "#378ADD", [("Jet", "✈️"), ("Jet Veloz", "🛫"), ("Vuela Mundo", "🌍")]),
    ("sea", "rare", "#1D9E75", [("Hidroavión", "🛩️"), ("Acuático", "🌊"), ("Isleño", "🏝️")]),
    ("rocket", "epic", "#9B6DDB", [("Cohetito", "🚀"), ("Satélite", "🛰️"), ("Planeta", "🪐")]),
    ("ufo", "legendary", "#534AB7", [("Platillo", "🛸"), ("Visitante", "👽"), ("Galaxia", "🌌")]),
])

SPORTS = _build("sport", [
    ("soccer", "common", "#97C459", [("Pelotita", "⚽"), ("Goleador", "🥅"), ("Campeón", "🏆")]),
    ("boot", "common", "#F0997B", [("Botín", "👟"), ("Botín Veloz", "🥾"), ("Botín Rayo", "⚡")]),
    ("basket", "common", "#EF9F27", [("Básquet", "🏀"), ("Encestador", "🥅"), ("Estrella NBA", "🏆")]),
    ("tennis", "common", "#9FE1CB", [("Tenis", "🎾"), ("Raqueta", "🏸"), ("Campeón Tenis", "🏆")]),
    ("bell", "common", "#FAC775", [("Silbato", "🔔"), ("Árbitro", "📣"), ("Capitán", "🎽")]),
    ("medal", "rare", "#FAC775", [("Bronce", "🥉"), ("Plata", "🥈"), ("Oro", "🥇")]),
    ("keeper", "rare", "#378ADD", [("Arquerito", "🧤"), ("Arquero", "🥅"), ("Muralla", "🛡️")]),
    ("cup", "epic", "#D85A30", [("Trofeíto", "🏅"), ("Copa", "🏆"), ("Copa de Oro", "👑")]),
    ("goat", "legendary", "#EF9F27", [("Crack", "⭐"), ("Súper Crack", "🌟"), ("El Mejor", "🐐")]),
])

DOLLS = _build("doll", [
    ("rag", "common", "#F4C0D1", [("Muñequita", "🧸"), ("Matrioska", "🪆"), ("Muñeca Real", "👧")]),
    ("bow", "common", "#ED93B1", [("Moñito", "🎀"), ("Corazón", "💝"), ("Bolsito", "👛")]),
    ("kitty", "common", "#FAC775", [("Gatita", "🐱"), ("Gata", "🐈"), ("Gata Princesa", "👑")]),
    ("flower", "common", "#9FE1CB", [("Florcita", "🌷"), ("Ramo", "💐"), ("Jardín", "🌸")]),
    ("cake", "common", "#F0997B", [("Pastelito", "🧁"), ("Torta", "🎂"), ("Torta Real", "🍰")]),
    ("tiara", "rare", "#AFA9EC", [("Tiara", "👑"), ("Tiara de Gemas", "💎"), ("Castillo", "🏰")]),
    ("unicorn", "rare", "#CECBF6", [("Unicornio", "🦄"), ("Arcoíris", "🌈"), ("Unicornio Mágico", "✨")]),
    ("princess", "epic", "#D4537E", [("Princesita", "👸"), ("Princesa", "🏰"), ("Princesa Real", "👑")]),
    ("queen", "legendary", "#EF9F27", [("Reinita", "👸"), ("Reina", "👑"), ("Reina Estrella", "🌟")]),
])

THEMES = [
    {"id": "dinos", "name_es": "Dinosaurios", "name_en": "Dinosaurs", "emoji": "🦖",
     "collection_es": "DinoDex", "collection_en": "DinoDex", "species": DINO_SPECIES},
    {"id": "fairies", "name_es": "Hadas", "name_en": "Fairies", "emoji": "🧚",
     "collection_es": "Hadario", "collection_en": "Fairy book", "species": FAIRIES},
    {"id": "cars", "name_es": "Autos", "name_en": "Cars", "emoji": "🏎️",
     "collection_es": "Garaje", "collection_en": "Garage", "species": CARS},
    {"id": "planes", "name_es": "Aviones", "name_en": "Airplanes", "emoji": "✈️",
     "collection_es": "Hangar", "collection_en": "Hangar", "species": PLANES},
    {"id": "sports", "name_es": "Deportes", "name_en": "Sports", "emoji": "⚽",
     "collection_es": "Vitrina", "collection_en": "Trophy case", "species": SPORTS},
    {"id": "dolls", "name_es": "Muñecas", "name_en": "Dolls", "emoji": "👸",
     "collection_es": "Joyero", "collection_en": "Doll house", "species": DOLLS},
]

THEMES_BY_ID = {t["id"]: t for t in THEMES}

# Global lookup across every theme — resolves any owned character even if the
# profile later switched themes.
ALL_SPECIES_BY_ID = {s["id"]: s for t in THEMES for s in t["species"]}


def theme_or_default(theme_id: str | None) -> dict:
    return THEMES_BY_ID.get(theme_id or "dinos", THEMES_BY_ID["dinos"])


def theme_species(theme_id: str | None) -> list:
    return theme_or_default(theme_id)["species"]
