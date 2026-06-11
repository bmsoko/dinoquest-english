"""Turns a pasted school notice (Spanish) into structured unit content via Claude."""

from typing import List, Literal, Optional

import anthropic
from pydantic import BaseModel, Field

from .config import settings


class GeneratedWord(BaseModel):
    text: str = Field(description="English word or phrase, lowercase")
    translation: str = Field(description="Spanish translation")
    example_sentence: str = Field(description="Simple English example sentence a 7-year-old understands")
    emoji: str = Field(description="Single emoji that represents the word")
    category: str = Field(description="Category in Spanish, e.g. 'Rutinas diarias'")


class GeneratedExercise(BaseModel):
    type: Literal["listen_choose", "dictation", "unscramble", "fill_in"]
    word_text: Optional[str] = Field(
        default=None, description="The vocabulary word this exercise practices, if any"
    )
    text: Optional[str] = Field(
        default=None, description="dictation: the word or short sentence to dictate"
    )
    answer: Optional[str] = Field(
        default=None, description="listen_choose/fill_in: the correct answer"
    )
    options: Optional[List[str]] = Field(
        default=None,
        description="listen_choose/fill_in: 3-4 options including the answer",
    )
    sentence: Optional[str] = Field(
        default=None,
        description="unscramble: the full correct sentence; fill_in: sentence with ___ for the blank",
    )
    hint: Optional[str] = Field(default=None, description="Short hint in Spanish")
    difficulty: int = Field(default=1, description="1 easy, 2 medium, 3 hard")


class GeneratedUnit(BaseModel):
    title: str = Field(description="Short unit title in Spanish, e.g. 'Unidad 2 — Rutinas y tiempo libre'")
    words: List[GeneratedWord]
    exercises: List[GeneratedExercise]


SYSTEM_PROMPT = """You create English practice content for a 7-year-old Spanish-speaking child \
(2nd grade, beginner English, studying with the Cambridge Power Up book).

You receive a school notice (usually in Spanish) describing vocabulary and grammar to review. Extract and generate:

1. words: every vocabulary item mentioned (split lists like "helmet, goggles" into separate words). \
Phrases like "play basketball" count as one item. Include translation, a very simple example sentence, \
one fitting emoji, and a Spanish category name. Every word must get a UNIQUE emoji (no repeats across \
the unit — they are used as memory-game cards). For days of the week use these icons: \
Monday 🚌, Tuesday 🌮, Wednesday 🐫, Thursday ⚡, Friday 🎉, Saturday 🏖️, Sunday ☀️.

2. exercises: a generous pool covering ALL four types:
- listen_choose: the child hears the word and picks it among 4 written options. Options must be plausible \
(similar spelling/sound, drawn from the same unit when possible). answer must be in options.
- dictation: the child hears and types. Mix single words (difficulty 1-2) and very short sentences from \
the grammar patterns (difficulty 3), e.g. "He wakes up at 6 am." Set text to what is dictated.
- unscramble: short sentences (4-8 words) practicing the grammar patterns in the notice \
(e.g. third person questions, must/mustn't, adverbs of frequency). Set sentence to the correct sentence.
- fill_in: grammar gaps with options, e.g. "He ___ like chocolate." options ["don't","doesn't","isn't"], \
answer "doesn't". Use ___ for the blank in sentence.

Rules:
- Aim for: one listen_choose and one dictation per word, plus 8-15 unscramble and 8-15 fill_in from the grammar section.
- English content only in the exercises; hints in Spanish, short and encouraging.
- Keep everything age-appropriate, concrete and simple. No punctuation traps; sentences end with a period or question mark.
- word_text links the exercise to a vocabulary word when one clearly applies; otherwise omit it."""


def generate_unit(source_prompt: str) -> GeneratedUnit:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured")
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.parse(
        model=settings.generation_model,
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": source_prompt}],
        output_format=GeneratedUnit,
    )
    if response.parsed_output is None:
        raise RuntimeError("Claude returned no parseable unit content")
    return response.parsed_output
