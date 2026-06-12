"""Seeds the '🎯 Spelling Test' EXAM unit with the teacher's word list.

Run: .venv/bin/python seed_spelling_test.py [BASE_URL]
"""

import os
import sys

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
HEADERS = {"X-Parent-Pin": os.environ.get("PARENT_PIN", "")}

# (word, translation, example sentence, emoji, category)
W = [
    ("jobs", "trabajos", "People have different jobs.", "💼", "Trabajos"),
    ("teacher", "maestra", "The teacher is in the classroom.", "👩‍🏫", "Trabajos"),
    ("doctor", "doctor", "The doctor helps sick people.", "🩺", "Trabajos"),
    ("nurse", "enfermera", "The nurse works in a hospital.", "💉", "Trabajos"),
    ("dentist", "dentista", "The dentist looks at my teeth.", "😬", "Trabajos"),
    ("actor", "actor", "The actor is on TV.", "🎭", "Trabajos"),
    ("farmer", "granjero", "The farmer has a tractor.", "👨‍🌾", "Trabajos"),
    ("footballer", "futbolista", "The footballer kicks the ball.", "⚽", "Trabajos"),
    ("baker", "panadero", "The baker makes bread.", "🥐", "Trabajos"),
    ("cook", "cocinero", "The cook makes lunch.", "🍳", "Trabajos"),
    ("pilot", "piloto", "The pilot flies a plane.", "✈️", "Trabajos"),
    ("police officer", "policía", "The police officer helps people.", "👮", "Trabajos"),
    ("firefighter", "bombero", "The firefighter is very brave.", "🚒", "Trabajos"),
    ("mail carrier", "cartero", "The mail carrier brings letters.", "📬", "Trabajos"),
    ("goalkeeper", "arquero", "The goalkeeper catches the ball.", "🥅", "Trabajos"),
    ("helmet", "casco", "You must wear a helmet.", "🪖", "Salud y seguridad"),
    ("towel", "toalla", "I dry my hands with a towel.", "🛀", "Salud y seguridad"),
    ("toothpaste", "pasta de dientes", "I put toothpaste on my toothbrush.", "🦷", "Salud y seguridad"),
    ("toothbrush", "cepillo de dientes", "My toothbrush is blue.", "🪥", "Salud y seguridad"),
    ("shower", "ducha", "I have a shower in the morning.", "🚿", "Salud y seguridad"),
    ("healthy", "saludable", "Fruit is healthy.", "🍎", "Salud y seguridad"),
    ("warm-up", "precalentamiento", "We do a warm-up before sport.", "🤸", "Salud y seguridad"),
    ("gloves", "guantes", "I wear gloves in winter.", "🧤", "Salud y seguridad"),
    ("goggles", "antiparras", "He wears goggles in the pool.", "🥽", "Salud y seguridad"),
    ("elbow", "codo", "I hurt my elbow.", "💪", "Salud y seguridad"),
    ("knee", "rodilla", "My knee is OK.", "🦵", "Salud y seguridad"),
    ("mouth", "boca", "Open your mouth, please.", "👄", "Salud y seguridad"),
    ("mask", "máscara", "He wears a mask at the party.", "😷", "Salud y seguridad"),
    ("oxygen", "oxígeno", "We need oxygen to live.", "🫧", "Naturaleza"),
    ("water", "agua", "We must drink water.", "💧", "Naturaleza"),
    ("field", "campo", "The tractor is in the field.", "🌾", "Naturaleza"),
    ("mountain", "montaña", "The mountain is very big.", "⛰️", "Naturaleza"),
    ("river", "río", "We swim in the river.", "🏞️", "Naturaleza"),
    ("lake", "lago", "There are fish in the lake.", "🚣", "Naturaleza"),
    ("leaf", "hoja", "The leaf is green.", "🍂", "Naturaleza"),
    ("leaves", "hojas", "Leaves fall from the trees.", "🍃", "Naturaleza"),
    ("grass", "pasto", "We sit on the grass.", "🌱", "Naturaleza"),
    ("rock", "roca", "There is a big rock in the garden.", "🪨", "Naturaleza"),
    ("sunny", "soleado", "Today is a sunny day.", "🌞", "Naturaleza"),
    ("coconuts", "cocos", "Monkeys like coconuts.", "🥥", "Naturaleza"),
    ("puppy", "cachorro", "The puppy is very small.", "🐶", "Animales"),
    ("kitten", "gatito", "The kitten plays with a ball.", "🐱", "Animales"),
    ("snake", "serpiente", "The snake is long.", "🐍", "Animales"),
    ("monkey", "mono", "The monkey is in the tree.", "🐒", "Animales"),
    ("cows", "vacas", "The cows are on the farm.", "🐄", "Animales"),
    ("horse", "caballo", "The horse runs fast.", "🐴", "Animales"),
    ("lizard", "lagartija", "The lizard is on the rock.", "🦎", "Animales"),
    ("elephant", "elefante", "The elephant is very big.", "🐘", "Animales"),
    ("giraffe", "jirafa", "The giraffe has a long neck.", "🦒", "Animales"),
    ("eating", "comiendo", "The boy is eating an apple.", "🍴", "Acciones"),
    ("playing", "jugando", "They are playing in the park.", "🪀", "Acciones"),
    ("writing", "escribiendo", "She is writing an email.", "✍️", "Acciones"),
    ("washing", "lavando", "He is washing his face.", "🧼", "Acciones"),
    ("holding", "sosteniendo", "She is holding a balloon.", "🤲", "Acciones"),
    ("pointing", "señalando", "He is pointing at the dog.", "👉", "Acciones"),
    ("standing", "parado", "Ray is standing under a tree.", "🧍", "Acciones"),
    ("whistling", "silbando", "The bird is whistling.", "😗", "Acciones"),
    ("laying", "acostado", "The cat is laying on the sofa.", "🛌", "Acciones"),
    ("swimming", "nadando", "I am swimming in a river.", "🏊", "Acciones"),
    ("getting up", "levantándose", "She is getting up now.", "🛏️", "Rutinas y escuela"),
    ("wake up", "despertarse", "I wake up at 7 o'clock.", "⏰", "Rutinas y escuela"),
    ("breakfast", "desayuno", "Most people eat breakfast in the morning.", "🥞", "Rutinas y escuela"),
    ("dinner", "cena", "We have dinner at 8 pm.", "🍽️", "Rutinas y escuela"),
    ("daily routine", "rutina diaria", "My daily routine starts at 7.", "🔁", "Rutinas y escuela"),
    ("timetable", "horario", "Look at your timetable.", "📅", "Rutinas y escuela"),
    ("playground", "patio de juegos", "We play in the playground.", "🛝", "Rutinas y escuela"),
    ("eraser", "goma de borrar", "Can I use your eraser?", "🧽", "Rutinas y escuela"),
    ("math", "matemática", "We have math on Monday.", "➕", "Rutinas y escuela"),
    ("book", "libro", "I read a book at night.", "📕", "Objetos"),
    ("hat", "sombrero", "He's wearing a hat.", "🎩", "Objetos"),
    ("guitar", "guitarra", "Pat is playing the guitar.", "🎸", "Objetos"),
    ("grapes", "uvas", "I eat grapes after lunch.", "🍇", "Objetos"),
    ("armchair", "sillón", "Grandpa sits in the armchair.", "🛋️", "Objetos"),
    ("balloon", "globo", "The balloon is red.", "🎈", "Objetos"),
]

words = [
    {"text": t, "translation": tr, "example_sentence": ex, "emoji": e, "category": c}
    for t, tr, ex, e, c in W
]

exercises = []
for w in words:
    same_cat = [x["text"] for x in words if x["category"] == w["category"] and x["text"] != w["text"]]
    others = same_cat if len(same_cat) >= 3 else [x["text"] for x in words if x["text"] != w["text"]]
    opts = [w["text"]] + others[:3]
    exercises.append(
        {"type": "listen_choose", "word_text": w["text"], "answer": w["text"], "options": opts, "difficulty": 1}
    )
    exercises.append(
        {"type": "dictation", "word_text": w["text"], "text": w["text"], "hint": w["translation"],
         "difficulty": 2 if len(w["text"]) > 8 else 1}
    )

unit = {
    "title": "🎯 Spelling Test",
    "words": words,
    "exercises": exercises,
}

r = requests.post(
    f"{BASE}/api/v1/units",
    json={"source_prompt": "Lista de spelling test de la maestra", "unit": unit, "kind": "exam"},
    headers=HEADERS,
)
r.raise_for_status()
print("Seeded spelling test:", r.json(), f"({len(words)} words, {len(exercises)} exercises)")
