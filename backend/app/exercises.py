"""Builds the exercise pool for a vocabulary word. One place so the add-words
endpoint and seeds generate the same set of activity variations per word."""

import random


def normalize(text: str) -> str:
    return " ".join(text.lower().split())


def build_word_exercises(word_text: str, pool_texts: list[str], translation: str = "") -> list[dict]:
    """Return exercise dicts (type + payload fields) for a single word.

    Generates every single-word-friendly activity: listen & choose, spelling
    (dictation), anagram, and missing-letter.
    """
    word = word_text.strip()
    letters = word.replace(" ", "")
    others = [w for w in pool_texts if normalize(w) != normalize(word)]
    distractors = random.sample(others, min(3, len(others)))
    options = [word, *distractors]

    out: list[dict] = [
        {"type": "listen_choose", "answer": word, "options": options},
        {"type": "dictation", "text": word, "hint": translation},
    ]
    # Letter-based activities only make sense for words of decent length
    if len(letters) >= 3:
        out.append({"type": "anagram", "answer": word, "hint": translation})
        out.append({"type": "missing_letter", "answer": word, "hint": translation})
    return out
