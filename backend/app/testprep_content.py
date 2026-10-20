"""Hand-authored Cambridge-style Unit 4 test items (family, homes,
comparatives, possessive pronouns). Objective formats only, auto-graded.
Source: the three Unit 4 practice papers. This is the version-controlled
source of truth; it is seeded into the TestItem table."""

SECTION_ORDER = ["listening", "vocabulary", "grammar", "reading", "writing"]
PAPER_COUNTS = {"listening": 3, "vocabulary": 4, "grammar": 4, "reading": 1, "writing": 2}

_UNIT4_ITEMS = [
    # ---- 1. LISTENING (listen_pick): TTS reads `audio`, tap the match ----
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "The flat is on the second floor.",
                 "options": ["first floor", "second floor", "third floor"],
                 "answer": "second floor"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "Mia is happier than Ben.",
                 "options": ["Mia is happier", "Ben is happier", "they are the same"],
                 "answer": "Mia is happier"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "Their grandparents live in a village.",
                 "options": ["a village", "a town centre", "a flat"],
                 "answer": "a village"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "The lift is outside the house.",
                 "options": ["inside", "outside", "upstairs"],
                 "answer": "outside"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "My cousin has curly hair.",
                 "options": ["curly hair", "short hair", "long hair"],
                 "answer": "curly hair"}},
    {"section": "listening", "format": "listen_pick",
     "prompt": "Listen and choose.",
     "payload": {"audio": "The garden is behind the house.",
                 "options": ["behind the house", "inside the house", "on the roof"],
                 "answer": "behind the house"}},

    # ---- 2. VOCABULARY (mcq / gap_bank / match) ----
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My mum's sister is my ___.",
     "payload": {"options": ["aunt", "cousin", "grandmother"], "answer": "aunt"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My uncle's son is my ___.",
     "payload": {"options": ["cousin", "grandson", "nephew"], "answer": "cousin"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My parents' parents are my ___.",
     "payload": {"options": ["grandparents", "cousins", "aunts"], "answer": "grandparents"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "The top covering of a house is the ___.",
     "payload": {"options": ["roof", "basement", "balcony"], "answer": "roof"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "You go up to another floor in a ___.",
     "payload": {"options": ["lift", "garden", "roof"], "answer": "lift"}},
    {"section": "vocabulary", "format": "mcq",
     "prompt": "My dad's brother is my ___.",
     "payload": {"options": ["uncle", "cousin", "grandfather"], "answer": "uncle"}},
    {"section": "vocabulary", "format": "gap_bank",
     "prompt": "Complete with the words in the box.",
     "payload": {"bank": ["upstairs", "outside", "inside", "town centre", "village", "balcony"],
                 "sentences": [
                     {"text": "My bedroom is on the first floor. It is ___.", "answer": "upstairs"},
                     {"text": "Let's play in the garden, ___ the house.", "answer": "outside"},
                     {"text": "It is raining. Let's stay ___.", "answer": "inside"},
                     {"text": "Shops and cafés are often in the ___.", "answer": "town centre"},
                     {"text": "My grandparents live in a small ___.", "answer": "village"},
                     {"text": "You can stand on the ___ and look at the street.", "answer": "balcony"}]}},
    {"section": "vocabulary", "format": "match",
     "prompt": "Match each word to its meaning.",
     "payload": {"pairs": [
         {"left": "lift", "right": "takes you to another floor"},
         {"left": "basement", "right": "a place below the ground floor"},
         {"left": "roof", "right": "the top of a house"},
         {"left": "balcony", "right": "a place outside an upstairs room"}]}},

    # ---- 3. GRAMMAR (mcq): comparatives + possessives ----
    {"section": "grammar", "format": "mcq", "prompt": "old → ___",
     "payload": {"options": ["older", "olderer", "more old"], "answer": "older"}},
    {"section": "grammar", "format": "mcq", "prompt": "young → ___",
     "payload": {"options": ["younger", "youngerer", "more young"], "answer": "younger"}},
    {"section": "grammar", "format": "mcq", "prompt": "pretty → ___",
     "payload": {"options": ["prettier", "prettyer", "more pretty"], "answer": "prettier"}},
    {"section": "grammar", "format": "mcq", "prompt": "curly → ___",
     "payload": {"options": ["curlier", "curlyer", "more curly"], "answer": "curlier"}},
    {"section": "grammar", "format": "mcq", "prompt": "happy → ___",
     "payload": {"options": ["happier", "happyer", "more happy"], "answer": "happier"}},
    {"section": "grammar", "format": "mcq", "prompt": "big → ___",
     "payload": {"options": ["bigger", "biger", "more big"], "answer": "bigger"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "The red bag belongs to me. It is ___.",
     "payload": {"options": ["mine", "hers", "yours"], "answer": "mine"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "This is Emma's room. It is ___.",
     "payload": {"options": ["hers", "his", "theirs"], "answer": "hers"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "Mum and I live here. The house is ___.",
     "payload": {"options": ["ours", "theirs", "mine"], "answer": "ours"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "The cousins have bikes. The bikes are ___.",
     "payload": {"options": ["theirs", "ours", "yours"], "answer": "theirs"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "This is your coat. It is ___.",
     "payload": {"options": ["yours", "his", "mine"], "answer": "yours"}},
    {"section": "grammar", "format": "mcq",
     "prompt": "This is his bedroom. It is ___.",
     "payload": {"options": ["his", "hers", "ours"], "answer": "his"}},

    # ---- 4. READING (reading): passage + comprehension MCQs ----
    {"section": "reading", "format": "reading", "prompt": "Read and answer.",
     "payload": {"passage": "Hello! I'm Oliver. I live with my parents and my younger "
                            "sister, Lily. We live in a house in a village. My aunt lives "
                            "in a flat in the town centre. Her flat is on the second floor, "
                            "and she uses the lift. Lily's hair is curlier than mine.",
                 "questions": [
                     {"q": "Where does Oliver live?",
                      "options": ["In a house in a village", "In a flat in the town centre", "In a basement"],
                      "answer": "In a house in a village"},
                     {"q": "Where does his aunt live?",
                      "options": ["In a flat in the town centre", "In a village", "In a house"],
                      "answer": "In a flat in the town centre"},
                     {"q": "Whose hair is curlier?",
                      "options": ["Lily's", "Oliver's", "the aunt's"],
                      "answer": "Lily's"}]}},
    {"section": "reading", "format": "reading", "prompt": "Read and answer.",
     "payload": {"passage": "I am Sam. I live with my parents, my sister and my "
                            "grandparents. Our house is in a village. My grandparents sleep "
                            "downstairs. My sister and I sleep upstairs. My bedroom is "
                            "smaller than hers. The garden is outside the house.",
                 "questions": [
                     {"q": "Does Sam live in a flat?",
                      "options": ["No, he lives in a house", "Yes, in the town centre", "Yes, on the third floor"],
                      "answer": "No, he lives in a house"},
                     {"q": "Where do the grandparents sleep?",
                      "options": ["Downstairs", "Upstairs", "In the garden"],
                      "answer": "Downstairs"},
                     {"q": "Whose bedroom is bigger?",
                      "options": ["His sister's", "Sam's", "the grandparents'"],
                      "answer": "His sister's"}]}},
    {"section": "reading", "format": "reading", "prompt": "Read and answer.",
     "payload": {"passage": "I am Rosie. My family lives in the town centre. Our flat is on "
                            "the third floor. We take the lift. It has a balcony, but it has "
                            "no garden. My cousin Mia lives in a house in a village. Her "
                            "house is older than our flat.",
                 "questions": [
                     {"q": "Which floor is Rosie's flat on?",
                      "options": ["The third floor", "The first floor", "The second floor"],
                      "answer": "The third floor"},
                     {"q": "Does her flat have a garden?",
                      "options": ["No, it doesn't", "Yes, it does", "Yes, a big one"],
                      "answer": "No, it doesn't"},
                     {"q": "Which home is older?",
                      "options": ["Mia's house", "Rosie's flat", "they are the same"],
                      "answer": "Mia's house"}]}},

    # ---- 5. WRITING (order / gap_bank): controlled writing ----
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["Mia", "is", "happier", "than", "Ben"],
                 "answer": "Mia is happier than Ben"}},
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["My", "flat", "is", "on", "the", "third", "floor"],
                 "answer": "My flat is on the third floor"}},
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["The", "red", "bag", "is", "mine"],
                 "answer": "The red bag is mine"}},
    {"section": "writing", "format": "order", "prompt": "Put the words in order.",
     "payload": {"tokens": ["Her", "house", "is", "older", "than", "our", "flat"],
                 "answer": "Her house is older than our flat"}},
    {"section": "writing", "format": "gap_bank",
     "prompt": "Complete with the words in the box.",
     "payload": {"bank": ["younger", "mine", "outside"],
                 "sentences": [
                     {"text": "My sister is ___ than my dad.", "answer": "younger"},
                     {"text": "This book is ___.", "answer": "mine"},
                     {"text": "The garden is ___ the house.", "answer": "outside"}]}},
]

TOPICS = {
    "unit4": {"title": "Unit 4 · Family & Homes", "items": _UNIT4_ITEMS},
}
