"""Seeds the 'Prueba Unidad 2' EXAM unit (Prepare for Exam mode) from the real
school notice, without needing the Claude API.

Run: .venv/bin/python seed_exam_unidad2.py
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
    ("elbow pads", "coderas", "Put on your elbow pads.", "💪", "Equipo de seguridad"),
    ("knee pads", "rodilleras", "She wears knee pads to skate.", "🦵", "Equipo de seguridad"),
    ("gloves", "guantes", "I wear gloves in winter.", "🧤", "Equipo de seguridad"),
    ("wake up", "despertarse", "I wake up at 7 o'clock.", "⏰", "Rutinas diarias"),
    ("get up", "levantarse", "He gets up early.", "🛏️", "Rutinas diarias"),
    ("have a shower", "ducharse", "She has a shower in the morning.", "🚿", "Rutinas diarias"),
    ("get dressed", "vestirse", "I get dressed for school.", "👕", "Rutinas diarias"),
    ("have breakfast", "desayunar", "We have breakfast together.", "🥣", "Rutinas diarias"),
    ("have lunch", "almorzar", "He has lunch at 12 o'clock.", "🍝", "Rutinas diarias"),
    ("have dinner", "cenar", "They have dinner at 8 pm.", "🍽️", "Rutinas diarias"),
    ("go to bed", "irse a dormir", "I go to bed at 9 pm.", "🌙", "Rutinas diarias"),
    ("watch TV", "mirar televisión", "They watch TV after dinner.", "📺", "Rutinas diarias"),
    ("Monday", "lunes", "I play basketball on Monday.", "1️⃣", "Días de la semana"),
    ("Tuesday", "martes", "We have English on Tuesday.", "2️⃣", "Días de la semana"),
    ("Wednesday", "miércoles", "He goes skating on Wednesday.", "3️⃣", "Días de la semana"),
    ("Thursday", "jueves", "She reads a comic on Thursday.", "4️⃣", "Días de la semana"),
    ("Friday", "viernes", "They watch TV on Friday.", "5️⃣", "Días de la semana"),
    ("Saturday", "sábado", "We go shopping on Saturday.", "6️⃣", "Días de la semana"),
    ("Sunday", "domingo", "I get up late on Sunday.", "7️⃣", "Días de la semana"),
]

words = [
    {"text": t, "translation": tr, "example_sentence": ex, "emoji": e, "category": c}
    for t, tr, ex, e, c in W
]

exercises = []
all_texts = [w["text"] for w in words]
for i, w in enumerate(words):
    same_cat = [x["text"] for x in words if x["category"] == w["category"] and x["text"] != w["text"]]
    others = same_cat if len(same_cat) >= 3 else [t for t in all_texts if t != w["text"]]
    opts = [w["text"]] + others[:3]
    exercises.append({"type": "listen_choose", "word_text": w["text"], "answer": w["text"], "options": opts, "difficulty": 1})
    exercises.append({"type": "dictation", "word_text": w["text"], "text": w["text"], "hint": w["translation"], "difficulty": 1})

# Grammar from the notice: 3rd person simple present (aff/neg/question),
# adverbs of frequency, must/mustn't
sentences = [
    "He plays in the Argentina National Team.",
    "He wakes up at 6 am.",
    "He doesn't like chocolate.",
    "He doesn't wake up early.",
    "Does he play in the school team?",
    "What time does Julian have lunch?",
    "He has lunch at 12 o'clock.",
    "How often do you play video games?",
    "I always have breakfast at home.",
    "She never watches TV at night.",
    "We must listen to the teacher.",
    "We mustn't wear skates in the house.",
]
for s in sentences:
    exercises.append({"type": "unscramble", "sentence": s, "hint": "Ordená la frase", "difficulty": 2})
    exercises.append({"type": "dictation", "text": s, "hint": "Frase del examen", "difficulty": 3})

fill_ins = [
    ("He ___ in the Argentina National Team.", "plays", ["play", "plays", "playing"]),
    ("He ___ like chocolate.", "doesn't", ["don't", "doesn't", "isn't"]),
    ("___ he play in the school team?", "Does", ["Do", "Does", "Is"]),
    ("Yes, he ___.", "does", ["do", "does", "is"]),
    ("What time ___ Julian have lunch?", "does", ["do", "does", "is"]),
    ("He ___ up at 6 am.", "wakes", ["wake", "wakes", "waking"]),
    ("We ___ listen to the teacher.", "must", ["must", "mustn't", "don't"]),
    ("We ___ wear skates in the house.", "mustn't", ["must", "mustn't", "do"]),
    ("How often ___ you play video games?", "do", ["do", "does", "is"]),
    ("I ___ have breakfast at home. (siempre)", "always", ["always", "never", "sometimes"]),
    ("She ___ watches TV at night. (nunca)", "never", ["always", "never", "often"]),
    ("He ___ a shower every morning.", "has", ["have", "has", "is"]),
]
for sentence, answer, options in fill_ins:
    exercises.append({"type": "fill_in", "sentence": sentence, "answer": answer, "options": options, "hint": "Gramática del examen", "difficulty": 2})

NOTICE = """Se evaluarán los contenidos presentados en la Unidad 2 del libro Power Up y vocabulario de Daily Routine ya visto en unidad 1.
Vocabulario: free time activities, helmet/goggles/elbow and knee pads/gloves, daily routines, days of the week.
Gramática: presente simple 3ra persona (afirmativa, negativa, pregunta), adverbs of frequency, must/mustn't."""

unit = {
    "title": "🎯 Prueba — Unidad 2 Power Up",
    "words": words,
    "exercises": exercises,
}

r = requests.post(
    "http://localhost:8000/api/v1/units",
    json={"source_prompt": NOTICE, "unit": unit, "kind": "exam"},
)
r.raise_for_status()
print("Seeded exam:", r.json())
