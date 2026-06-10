"""Seeds the Unidad 2 Power Up unit through the public save endpoint.

Use this when you want test content without calling the Claude API.
Run: .venv/bin/python seed_unidad2.py
"""

import requests

W = [
    ("play basketball", "jugar al básquet", "I play basketball with my friends.", "🏀", "Tiempo libre"),
    ("go shopping", "ir de compras", "We go shopping on Saturdays.", "🛍️", "Tiempo libre"),
    ("go skating", "ir a patinar", "She goes skating in the park.", "⛸️", "Tiempo libre"),
    ("listen to music", "escuchar música", "He listens to music every day.", "🎧", "Tiempo libre"),
    ("play video games", "jugar videojuegos", "They play video games at home.", "🎮", "Tiempo libre"),
    ("read a comic", "leer una historieta", "I read a comic before bed.", "📖", "Tiempo libre"),
    ("write an e-mail", "escribir un correo", "She writes an e-mail to her friend.", "📧", "Tiempo libre"),
    ("helmet", "casco", "You must wear a helmet.", "🪖", "Equipo de seguridad"),
    ("goggles", "antiparras", "He wears goggles in the pool.", "🥽", "Equipo de seguridad"),
    ("gloves", "guantes", "I wear gloves in winter.", "🧤", "Equipo de seguridad"),
    ("wake up", "despertarse", "I wake up at 7 o'clock.", "⏰", "Rutinas diarias"),
    ("get up", "levantarse", "He gets up early.", "🛏️", "Rutinas diarias"),
    ("have a shower", "ducharse", "She has a shower in the morning.", "🚿", "Rutinas diarias"),
    ("get dressed", "vestirse", "I get dressed for school.", "👕", "Rutinas diarias"),
    ("have breakfast", "desayunar", "We have breakfast together.", "🥣", "Rutinas diarias"),
    ("go to bed", "irse a dormir", "I go to bed at 9 pm.", "🌙", "Rutinas diarias"),
    ("watch TV", "mirar televisión", "They watch TV after dinner.", "📺", "Rutinas diarias"),
    ("Monday", "lunes", "I play basketball on Monday.", "📅", "Días de la semana"),
    ("Saturday", "sábado", "We go shopping on Saturday.", "🎈", "Días de la semana"),
]

words = [
    {"text": t, "translation": tr, "example_sentence": ex, "emoji": e, "category": c}
    for t, tr, ex, e, c in W
]

exercises = []
all_texts = [w["text"] for w in words]
for i, w in enumerate(words):
    others = [t for t in all_texts if t != w["text"]]
    opts = [w["text"]] + others[i % max(1, len(others) - 3):][:3]
    exercises.append({"type": "listen_choose", "word_text": w["text"], "answer": w["text"], "options": opts[:4], "difficulty": 1})
    exercises.append({"type": "dictation", "word_text": w["text"], "text": w["text"], "hint": w["translation"], "difficulty": 1})

sentences = [
    "He plays in the school team.",
    "He wakes up at 6 am.",
    "She has lunch at 12 o'clock.",
    "Does he play video games?",
    "He doesn't like chocolate.",
    "We must listen to the teacher.",
    "You mustn't wear skates in the house.",
    "I always have breakfast at home.",
    "She never watches TV at night.",
    "Does she go skating on Monday?",
]
for s in sentences:
    exercises.append({"type": "unscramble", "sentence": s, "hint": "Ordená la frase", "difficulty": 2})
    exercises.append({"type": "dictation", "text": s, "hint": "Frase corta", "difficulty": 3})

fill_ins = [
    ("He ___ like chocolate.", "doesn't", ["don't", "doesn't", "isn't"]),
    ("___ he play in the school team?", "Does", ["Do", "Does", "Is"]),
    ("We ___ listen to the teacher.", "must", ["must", "mustn't", "don't"]),
    ("You ___ wear skates in the house.", "mustn't", ["must", "mustn't", "does"]),
    ("She ___ up at 6 am.", "wakes", ["wake", "wakes", "waking"]),
    ("I ___ have breakfast at home.", "always", ["always", "yesterday", "tomorrow"]),
    ("How often ___ you play video games?", "do", ["do", "does", "is"]),
    ("He ___ TV every night.", "watches", ["watch", "watches", "watching"]),
]
for sentence, answer, options in fill_ins:
    exercises.append({"type": "fill_in", "sentence": sentence, "answer": answer, "options": options, "hint": "Pensá en la tercera persona", "difficulty": 2})

unit = {
    "title": "Unidad 2 — Rutinas y tiempo libre",
    "words": words,
    "exercises": exercises,
}

r = requests.post(
    "http://localhost:8000/api/v1/units",
    json={"source_prompt": "Seed manual: Unidad 2 Power Up", "unit": unit},
)
r.raise_for_status()
print("Seeded:", r.json())
