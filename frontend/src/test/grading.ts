import { normalize, shuffle } from '../activities/shared'

/** Lower-case, trim, drop punctuation and a leading a/an/the. */
export function cleanAnswer(s: string): string {
  return normalize(s).replace(/^(a|an|the) /, '')
}

export function isAccepted(input: string, answer: string, accept: string[] = []): boolean {
  const got = cleanAnswer(input)
  return got !== '' && [answer, ...accept].some((a) => cleanAnswer(a) === got)
}

/** Shuffle letters, never returning the word already in order. */
export function scramble(word: string): string[] {
  const letters = word.split('')
  for (let i = 0; i < 10; i++) {
    const s = shuffle(letters)
    if (s.join('') !== word) return s
  }
  return [...letters].reverse()
}
