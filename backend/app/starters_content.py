"""Practice papers in the *format* of Cambridge Pre A1 Starters.

All questions here are original. The real exam papers in Estani's folder were
used only as a reference for task types, and his marked mistakes for what to
target (spelled-out names, yes/no about a picture, word-box gaps, and the
spelling words he got wrong). This is NOT official Cambridge material.

Pictures are emoji. Audio is read by the browser's text-to-speech.
"""

# ---------------------------------------------------------------- helpers

def _yn(*statements):
    return [{"text": t, "answer": a} for t, a in statements]


COLOURS = ["red", "blue", "green", "yellow", "pink", "purple", "orange", "brown", "grey", "black"]

# =================================================================
# LISTENING  (4 parts, 5 questions each = 20, like the real paper)
# =================================================================

_L1_NAMES = [  # Listen and find the person (real paper: draw lines)
    ("Tom", "Who's that boy? The boy with the ball? No, not him. The boy with the kite. That's Tom.",
     ["👦🪁", "👦⚽", "👧🪁"], "👦🪁"),
    ("Sue", "And the girl reading a book? Yes, that's Sue. She loves books.",
     ["👧📖", "👦📖", "👧🎸"], "👧📖"),
    ("Dan", "Look at the man with the dog. His name is Dan.",
     ["👨🐕", "👨🐈", "👩🐕"], "👨🐕"),
    ("Kim", "Who is the girl eating an apple? Oh, that's Kim.",
     ["👧🍎", "👧🍌", "👦🍎"], "👧🍎"),
    ("Ben", "Can you see the boy with the guitar? That's my friend Ben.",
     ["👦🎸", "👦⚽", "👧🎸"], "👦🎸"),
    ("Anna", "Which woman is Anna? Anna is the woman with the flowers.",
     ["👩💐", "👩📖", "👧💐"], "👩💐"),
    ("Bill", "The old man with the fish? Yes. His name is Bill.",
     ["👴🐟", "👴🐕", "👨🐟"], "👴🐟"),
    ("May", "And the girl on the bike? That's May. She's my cousin.",
     ["👧🚲", "👦🚲", "👧🛴"], "👧🚲"),
    ("Hugo", "Hugo is the boy who is swimming. He's very happy.",
     ["👦🏊", "👦🚲", "👧🏊"], "👦🏊"),
]

_L2_WRITE = [  # Listen and write a name or a number (his weakest part)
    ("What's the girl's name?", "What's your name? My name is Jill. How do you spell that? J, I, L, L.",
     "Jill", []),
    ("What's the boy's name?", "And what's your friend's name? It's Nick. N, I, C, K.",
     "Nick", []),
    ("What's the dog's name?", "Your dog is very funny! What's its name? It's Spot. S, P, O, T.",
     "Spot", []),
    ("What's the teacher's name?", "Who is your teacher? Miss Grey. Grey? Yes, G, R, E, Y.",
     "Grey", ["Miss Grey"]),
    ("What's the name of the street?", "Where do you live? In Shell Street. S, H, E, L, L.",
     "Shell", ["Shell Street"]),
    ("What's the cat's name?", "I've got a cat. Her name is Lucy. L, U, C, Y.",
     "Lucy", []),
    ("What's the name of the farm?", "We are going to Cross Farm today. Cross is C, R, O, S, S.",
     "Cross", ["Cross Farm"]),
    ("What's the horse's name?", "This is my horse. He's called Bob. B, O, B.",
     "Bob", []),
    ("How old is Grace?", "How old is your sister Grace? She's seven.",
     "7", ["seven"]),
    ("How many cows are there?", "How many cows are there on the farm? There are twelve cows.",
     "12", ["twelve"]),
    ("How many pencils has Matt got?", "Matt, how many pencils have you got? I've got fifteen.",
     "15", ["fifteen"]),
    ("What number is the house?", "What number is your house? It's number nineteen.",
     "19", ["nineteen"]),
]

_L3_PICK = [  # Listen and choose the right picture
    ("What is Grace eating?",
     "Grace, are you eating an apple? No, Mum. It's a pear. I love pears!",
     ["🍎", "🍐", "🍌"], "🍐"),
    ("Where is the cat?",
     "Where's the cat? Is it under the bed? No, it's in the box.",
     ["🐱📦", "🐱🛏️", "🐱🌳"], "🐱📦"),
    ("What is Alex doing?",
     "What's Alex doing? Is he swimming? No, he's riding his bike.",
     ["🚲", "🏊", "⚽"], "🚲"),
    ("What has Pat got?",
     "Pat, have you got a pet? Yes, I've got a fish. It's orange.",
     ["🐟", "🐕", "🐢"], "🐟"),
    ("What is on the farm?",
     "Look at the farm! There's a tractor next to the river.",
     ["🚜", "🚌", "🚗"], "🚜"),
    ("What day is football?",
     "When do you play football, Sam? On Tuesday. Not on Monday.",
     ["Monday", "Tuesday", "Friday"], "Tuesday"),
    ("What time does Kim get up?",
     "What time do you get up, Kim? At seven o'clock. My brother gets up at eight.",
     ["🕖", "🕗", "🕘"], "🕖"),
    ("What does Tony want?",
     "Do you want peas, Tony? No, thank you. I want carrots, please.",
     ["🥕", "🫛", "🥔"], "🥕"),
    ("Where are Eva's shoes?",
     "Eva, where are your shoes? Are they on the chair? No, they're under the table.",
     ["👟⬇️🪑", "👟⬇️🛏️", "👟⬆️🪑"], "👟⬇️🪑"),
]

_L4_COLOUR = [  # Listen and colour
    ("Can you see the ball? It's next to the box. Colour the ball green.",
     ["⚽", "📦", "🪁", "🐦", "🌳"], "⚽", "green"),
    ("Now look at the kite. Colour the kite purple, please.",
     ["⚽", "📦", "🪁", "🐦", "🌳"], "🪁", "purple"),
    ("There's a bird in the tree. Can you colour the bird yellow?",
     ["⚽", "📦", "🪁", "🐦", "🌳"], "🐦", "yellow"),
    ("Look at the car. Colour the car blue.",
     ["🚗", "🚲", "🚜", "🐕", "🏠"], "🚗", "blue"),
    ("And the tractor? Make the tractor red.",
     ["🚗", "🚲", "🚜", "🐕", "🏠"], "🚜", "red"),
    ("The dog is in front of the house. Colour the dog brown.",
     ["🚗", "🚲", "🚜", "🐕", "🏠"], "🐕", "brown"),
    ("Can you see the hat? Colour the hat pink.",
     ["🎩", "👗", "👟", "🧦", "👕"], "🎩", "pink"),
    ("Now the dress. Colour the dress orange, please.",
     ["🎩", "👗", "👟", "🧦", "👕"], "👗", "orange"),
    ("Look at the socks. Colour the socks grey.",
     ["🎩", "👗", "👟", "🧦", "👕"], "🧦", "grey"),
]


def _listening_items():
    items = []
    for name, audio, options, answer in _L1_NAMES:
        items.append({"section": "st_l1", "format": "listen_picture",
                      "prompt": "Listen and find the person.",
                      "payload": {"audio": audio, "name": name, "options": options, "answer": answer}})
    for question, audio, answer, accept in _L2_WRITE:
        items.append({"section": "st_l2", "format": "listen_write",
                      "prompt": "Listen and write a name or a number.",
                      "payload": {"audio": audio, "question": question, "answer": answer,
                                  "accept": accept, "slow": True}})
    for question, audio, options, answer in _L3_PICK:
        items.append({"section": "st_l3", "format": "listen_picture",
                      "prompt": "Listen and choose the right picture.",
                      "payload": {"audio": audio, "question": question, "options": options, "answer": answer}})
    for audio, objects, target, colour in _L4_COLOUR:
        items.append({"section": "st_l4", "format": "listen_colour",
                      "prompt": "Listen and colour.",
                      "payload": {"audio": audio, "objects": objects, "target": target,
                                  "colour": colour, "colours": COLOURS}})
    return items


STARTERS_LISTENING = {
    "title": "Starters Practice · Listening",
    "emoji": "🎧",
    "minutes": 12,
    "sections": ["st_l1", "st_l2", "st_l3", "st_l4"],
    "counts": {"st_l1": 5, "st_l2": 5, "st_l3": 5, "st_l4": 5},
    "items": _listening_items(),
}

# =================================================================
# READING & WRITING  (5 parts, 25 questions like the real paper)
# =================================================================

_RW1_TICK = [  # Look and read. Tick or cross.
    ("🍐🍐🍐", "These are pears.", "yes"),
    ("🫛🫛🫛", "These are pears.", "no"),
    ("🫛", "These are peas.", "yes"),
    ("🦒", "This is a hippo.", "no"),
    ("🦛", "This is a hippo.", "yes"),
    ("🐌", "This is a snail.", "yes"),
    ("🍉", "This is a lemon.", "no"),
    ("🦜", "This is a parrot.", "yes"),
    ("📚", "This is a bookcase.", "no"),
    ("👗", "This is a dress.", "yes"),
    ("🎩", "This is a hat.", "yes"),
    ("🐄🐄", "These are horses.", "no"),
    ("🌸🌸", "These are flowers.", "yes"),
    ("🚜", "This is a tractor.", "yes"),
    ("🏔️", "This is a river.", "no"),
]

_RW2_SCENES = [  # Look at the picture and read. Write yes or no.
    ("🏠🌳🌳🐕🐕🐕👦⚽☀️", _yn(
        ("There are two trees.", "yes"),
        ("There are four dogs.", "no"),
        ("The boy has got a ball.", "yes"),
        ("There is a cat in the picture.", "no"),
        ("It is a sunny day.", "yes"))),
    ("🚜🐄🐄🐑🐔🐔🐔🌾🏞️", _yn(
        ("There is a tractor on the farm.", "yes"),
        ("There are three cows.", "no"),
        ("There is one sheep.", "yes"),
        ("There are two chickens.", "no"),
        ("There is a horse.", "no"))),
    ("👧🍦👦🍌🪑🪑🎈🎈🎈🎂", _yn(
        ("The girl is eating an ice cream.", "yes"),
        ("The boy is eating an apple.", "no"),
        ("There are two chairs.", "yes"),
        ("There are four balloons.", "no"),
        ("There is a cake.", "yes"))),
    ("🐟🐟🐢🦆🦆🌊⛵", _yn(
        ("There are two fish.", "yes"),
        ("There is a crocodile in the water.", "no"),
        ("There are two ducks.", "yes"),
        ("There is a boat.", "yes"),
        ("There are three turtles.", "no"))),
]

_RW3_LETTERS = [  # Look at the picture. Put the letters in order.
    # His spelling-test misses first, then Starters words
    ("⚽🦵", "kicking"), ("👋", "waving"), ("🌸", "flowers"), ("👗", "dress"),
    ("📚", "bookcase"), ("🎩", "hat"), ("🍐", "pear"), ("👥", "people"),
    ("🔤", "alphabet"), ("🐌", "snail"), ("🦛", "hippo"), ("🦜", "parrot"),
    ("🥕", "carrot"), ("🍎", "apple"), ("🛋️", "sofa"), ("🐄", "cow"),
    ("🌳", "tree"), ("🚜", "tractor"),
]

_RW4_STORIES = [  # Read the story. Choose a word from the box.
    {"title": "A day on the farm",
     "bank": ["cows", "tractor", "river", "apples", "horse", "garden"],
     "bank_emoji": {"cows": "🐄", "tractor": "🚜", "river": "🏞️", "apples": "🍎",
                    "horse": "🐴", "garden": "🌷"},
     "sentences": [
         {"text": "Grandpa lives on a farm. Every morning he drives his big red ___.", "answer": "tractor"},
         {"text": "He gives milk to the cats. The milk comes from his ___.", "answer": "cows"},
         {"text": "Grandma has got a ___ with lots of flowers.", "answer": "garden"},
         {"text": "In the afternoon we go fishing in the ___.", "answer": "river"},
         {"text": "Then I ride my favourite animal, a white ___.", "answer": "horse"}]},
    {"title": "Pets",
     "bank": ["fish", "dog", "parrot", "lizard", "bird", "cat"],
     "bank_emoji": {"fish": "🐟", "dog": "🐕", "parrot": "🦜", "lizard": "🦎",
                    "bird": "🐦", "cat": "🐈"},
     "sentences": [
         {"text": "Kim's ___ is orange and it lives in water.", "answer": "fish"},
         {"text": "Her ___ can say 'Hello!'. It is green and red.", "answer": "parrot"},
         {"text": "Her brother has got a ___. It likes to run in the park.", "answer": "dog"},
         {"text": "The ___ sleeps on the sofa and says 'meow'.", "answer": "cat"},
         {"text": "Dad's pet is a small ___. It sits on a rock in the sun.", "answer": "lizard"}]},
    {"title": "My week",
     "bank": ["Monday", "football", "swimming", "Saturday", "bed", "school"],
     "bank_emoji": {"Monday": "1️⃣", "football": "⚽", "swimming": "🏊", "Saturday": "6️⃣",
                    "bed": "🛏️", "school": "🏫"},
     "sentences": [
         {"text": "On ___ I go back to school after the weekend.", "answer": "Monday"},
         {"text": "On Tuesday I play ___ with my friends.", "answer": "football"},
         {"text": "I go ___ on Thursday. I love the water!", "answer": "swimming"},
         {"text": "I don't go to ___ on Saturday or Sunday.", "answer": "school"},
         {"text": "At eight o'clock I go to ___.", "answer": "bed"}]},
]

_RW5_ANSWERS = [  # Look at the pictures and answer. One word.
    ("🐸🐸🐸", "How many frogs are there?", "3", ["three"]),
    ("👦🍦", "What is the boy eating?", "ice cream", ["icecream", "ice-cream", "an ice cream"]),
    ("🐱🛏️", "Where is the cat? On the ___.", "bed", ["the bed", "on the bed"]),
    ("👧🪁", "What has the girl got?", "kite", ["a kite"]),
    ("🍎🍎🍎🍎", "How many apples are there?", "4", ["four"]),
    ("👨🚗", "What is the man driving?", "car", ["a car"]),
    ("🐕⚽", "What is the dog playing with?", "ball", ["a ball", "the ball"]),
    ("👩🎸", "What is the woman playing?", "guitar", ["the guitar", "a guitar"]),
    ("🦆🦆", "What are these birds?", "ducks", ["duck"]),
    ("👦😊", "Is the boy happy or sad?", "happy", []),
    ("🌧️☂️", "What is the weather like? It's ___.", "raining", ["rainy", "wet"]),
    ("👵🍰", "Who is eating cake? The ___.", "grandmother", ["grandma", "granny", "old woman"]),
]


def _rw_items():
    items = []
    for scene, text, answer in _RW1_TICK:
        items.append({"section": "st_rw1", "format": "yes_no",
                      "prompt": "Look and read. Tick ✓ or cross ✗.",
                      "payload": {"style": "tick", "statements": [{"emoji": scene, "text": text, "answer": answer}]}})
    for scene, statements in _RW2_SCENES:
        items.append({"section": "st_rw2", "format": "yes_no",
                      "prompt": "Look at the picture and read. Write yes or no.",
                      "payload": {"style": "word", "scene": scene, "statements": statements}})
    for emoji, word in _RW3_LETTERS:
        items.append({"section": "st_rw3", "format": "spell_letters",
                      "prompt": "Look at the picture. Put the letters in order.",
                      "payload": {"emoji": emoji, "answer": word}})
    for story in _RW4_STORIES:
        items.append({"section": "st_rw4", "format": "gap_bank",
                      "prompt": f"Read the story: {story['title']}. Choose a word from the box.",
                      "payload": {"title": story["title"], "bank": story["bank"], "bank_emoji": story["bank_emoji"],
                                  "sentences": story["sentences"]}})
    for scene, question, answer, accept in _RW5_ANSWERS:
        items.append({"section": "st_rw5", "format": "one_word",
                      "prompt": "Look at the picture and answer.",
                      "payload": {"emoji": scene, "question": question, "answer": answer, "accept": accept}})
    return items


STARTERS_READING_WRITING = {
    "title": "Starters Practice · Reading & Writing",
    "emoji": "📖",
    "minutes": 15,
    "sections": ["st_rw1", "st_rw2", "st_rw3", "st_rw4", "st_rw5"],
    "counts": {"st_rw1": 5, "st_rw2": 1, "st_rw3": 5, "st_rw4": 1, "st_rw5": 5},
    "items": _rw_items(),
}
