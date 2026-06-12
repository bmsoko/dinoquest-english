"""Seeds 'Unidad 2 — My week (libro)' with ALL the remaining Power Up book
content: class rules (must/mustn't), How often + frequency adverbs, time
questions, Beth's daily-routine story, healthy habits, and present continuous.

Run: PARENT_PIN=... .venv/bin/python seed_unidad2_libro.py [BASE_URL]
"""

import os
import sys

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
HEADERS = {"X-Parent-Pin": os.environ.get("PARENT_PIN", "")}

W = [
    ("watch films", "mirar películas", "Every Saturday, she watches films with her friends.", "🎬", "Free time"),
    ("practise basketball", "practicar básquet", "Yasmin often practises basketball.", "⛹️", "Free time"),
    ("play football", "jugar al fútbol", "I always play football on Tuesdays.", "🏟️", "Free time"),
    ("play tennis", "jugar al tenis", "She plays tennis in the park.", "🎾", "Free time"),
    ("go swimming", "ir a nadar", "Peter often goes swimming.", "🩱", "Free time"),
    ("ride a bike", "andar en bicicleta", "We must wear a helmet when riding bikes.", "🚲", "Free time"),
    ("horse riding", "andar a caballo", "We wear boots and a helmet when horse riding.", "🏇", "Free time"),
    ("book club", "club de lectura", "Friday is book club day.", "📚", "My week"),
    ("sport", "deporte", "We have sport on Tuesday and Thursday.", "🏸", "My week"),
    ("classroom", "aula", "We are in the classroom on Monday.", "🏫", "My week"),
    ("homework", "tarea", "We must do our homework.", "📝", "My week"),
    ("weekend", "fin de semana", "Saturday and Sunday are the weekend.", "🎡", "My week"),
    ("o'clock", "en punto", "School starts at nine o'clock.", "🕐", "My week"),
    ("feed the fish", "dar de comer al pez", "They feed the fish twice a day.", "🐟", "My week"),
    ("once", "una vez", "They feed it once a day.", "☝️", "My week"),
    ("twice", "dos veces", "They feed us twice a day.", "✌️", "My week"),
    ("clean your teeth", "lavarse los dientes", "Then she cleans her teeth and goes to school.", "😁", "Daily routine"),
    ("walk to school", "caminar a la escuela", "She walks to school with her mum.", "🚶", "Daily routine"),
    ("go home", "ir a casa", "I go home at 4 o'clock.", "🏠", "Daily routine"),
    ("drink water", "tomar agua", "We must drink water when we exercise.", "🚰", "Healthy habits"),
    ("sun cream", "protector solar", "We must use sun cream when it's sunny.", "🧴", "Healthy habits"),
    ("swimming pool", "pileta", "We mustn't run near the swimming pool.", "💦", "Healthy habits"),
    ("boots", "botas", "We must wear boots when horse riding.", "🥾", "Healthy habits"),
    ("skates", "patines", "You mustn't wear skates in the house.", "🛼", "Healthy habits"),
    ("tractor", "tractor", "On a farm, you can sometimes see a big tractor.", "🚜", "Words"),
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
    exercises.append({"type": "listen_choose", "word_text": w["text"], "answer": w["text"], "options": opts, "difficulty": 1})
    exercises.append({"type": "dictation", "word_text": w["text"], "text": w["text"], "hint": w["translation"], "difficulty": 1})

sentences = [
    # Class rules (Gracie's Grammar, must/mustn't)
    ("We must do our homework.", "Class rules"),
    ("We mustn't talk when the teacher is talking.", "Class rules"),
    ("We mustn't put our feet on the chairs.", "Class rules"),
    ("You must put them in the cupboard.", "Class rules"),
    # Healthy habits (Stay safe, have fun!)
    ("We must wear a helmet when riding bikes.", "Stay safe!"),
    ("We must drink water.", "Stay safe!"),
    ("We mustn't run near the swimming pool.", "Stay safe!"),
    ("We must use sun cream when it's sunny.", "Stay safe!"),
    ("We must warm up before doing exercise.", "Stay safe!"),
    ("We mustn't eat while running.", "Stay safe!"),
    ("You must throw a ball.", "The guessing game"),
    ("You mustn't kick it.", "The guessing game"),
    ("We must always wear helmets when we skate.", "Stay safe!"),
    # Time questions
    ("What time do you get up?", "Time"),
    ("I get up at 8 o'clock.", "Time"),
    ("What time does Jack wake up?", "Time"),
    ("What time do you go to bed?", "Time"),
    ("School starts at nine o'clock.", "Beth's day"),
    ("Beth wakes up at seven o'clock every day.", "Beth's day"),
    # How often + frequency (Gracie's Grammar Rap)
    ("How often do you play basketball?", "How often?"),
    ("Do you ever play on Sundays?", "How often?"),
    ("I always play on Mondays.", "How often?"),
    ("No, I never play it then.", "How often?"),
    ("They feed us twice a day.", "How often?"),
    ("How often do you skate?", "How often?"),
    ("I skate on Mondays and Wednesdays.", "How often?"),
    # Days of the week order
    ("Friday comes after Thursday.", "Days"),
    ("Sunday comes between Saturday and Monday.", "Days"),
    ("On Friday and Saturday, I play all day.", "Days"),
    # Present continuous (from the class test)
    ("I'm riding my bike in the countryside.", "What are they doing?"),
    ("I'm flying my kite in a field.", "What are they doing?"),
    ("I'm swimming in a river.", "What are they doing?"),
    ("Is the bird singing?", "What are they doing?"),
    ("Lucy and Max are playing football.", "What are they doing?"),
    ("Pat is sitting under a tree.", "What are they doing?"),
    ("He's wearing a hat.", "What are they doing?"),
]
for s, hint in sentences:
    exercises.append({"type": "unscramble", "sentence": s, "hint": hint, "difficulty": 2})
    exercises.append({"type": "dictation", "text": s, "hint": hint, "difficulty": 3})

fill_ins = [
    # must / mustn't
    ("We ___ talk when the teacher is talking.", "mustn't", ["must", "mustn't", "do"], "Class rules"),
    ("We ___ do our homework.", "must", ["must", "mustn't", "don't"], "Class rules"),
    ("We ___ put our feet on the chairs.", "mustn't", ["must", "mustn't", "are"], "Class rules"),
    ("We must ___ water.", "drink", ["drink", "drinks", "drinking"], "Stay safe!"),
    ("I protect my skin with sun ___.", "cream", ["cream", "water", "soap"], "Stay safe!"),
    ("Before I run, I must warm ___.", "up", ["up", "on", "in"], "Stay safe!"),
    ("When I ride my bike, I always wear a ___.", "helmet", ["helmet", "towel", "hat"], "Stay safe!"),
    # Beth's daily routine story
    ("Beth ___ up at seven o'clock every day.", "wakes", ["wake", "wakes", "waking"], "Beth's day"),
    ("She ___ to school with her mum.", "walks", ["walk", "walks", "walking"], "Beth's day"),
    ("Then she ___ her teeth.", "cleans", ["clean", "cleans", "cleaning"], "Beth's day"),
    ("School ___ at nine o'clock.", "starts", ["start", "starts", "starting"], "Beth's day"),
    ("What ___ does Jack wake up?", "time", ["time", "day", "hour"], "Time"),
    # How often + frequency adverbs
    ("How often ___ you skate?", "do", ["do", "does", "is"], "How often?"),
    ("Do you ___ play on Sundays?", "ever", ["ever", "never", "always"], "How often?"),
    ("I ___ play on Mondays. (✓✓✓)", "always", ["always", "never", "sometimes"], "How often?"),
    ("No, I ___ play it then. (✗)", "never", ["never", "always", "often"], "How often?"),
    ("Vicky ___ plays with Simba before school. (✓✓)", "often", ["often", "ever", "once"], "How often?"),
    ("They feed us ___ a day.", "twice", ["twice", "two", "second"], "How often?"),
    # Days order
    ("Friday comes after ___.", "Thursday", ["Thursday", "Wednesday", "Saturday"], "Days"),
    ("Tuesday comes before ___.", "Wednesday", ["Wednesday", "Monday", "Sunday"], "Days"),
    ("Saturday and Sunday are the ___.", "weekend", ["weekend", "week", "holiday"], "Days"),
    # Present continuous
    ("Is the bird ___?", "singing", ["singing", "sing", "sings"], "What are they doing?"),
    ("Are the children ___ in the forest?", "walking", ["walking", "walk", "walks"], "What are they doing?"),
    ("Is the boy ___ his face?", "washing", ["washing", "wash", "washes"], "What are they doing?"),
    ("Lucy and Max are ___ football.", "playing", ["playing", "play", "plays"], "What are they doing?"),
    ("Ray is ___ a helmet.", "wearing", ["wearing", "wear", "wears"], "What are they doing?"),
    ("I'm ___ my bike in the countryside.", "riding", ["riding", "ride", "rides"], "What are they doing?"),
]
for sentence, answer, options, hint in fill_ins:
    exercises.append({"type": "fill_in", "sentence": sentence, "answer": answer, "options": options, "hint": hint, "difficulty": 2})

unit = {
    "title": "Unidad 2 — My week (libro)",
    "words": words,
    "exercises": exercises,
}

r = requests.post(
    f"{BASE}/api/v1/units",
    json={"source_prompt": "Power Up book pages: My week, class rules, healthy habits, Beth's routine, The Friendly Farm", "unit": unit},
    headers=HEADERS,
)
r.raise_for_status()
print("Seeded:", r.json(), f"({len(words)} words, {len(exercises)} exercises)")
