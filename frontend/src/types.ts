export type ActivityType =
  | 'listen_choose'
  | 'dictation'
  | 'unscramble'
  | 'fill_in'
  | 'memory'
  | 'anagram'
  | 'missing_letter'
  | 'sentence_spelling'

export interface ExerciseItem {
  exercise_id?: number
  word_id: number | null
  type: ActivityType
  difficulty?: number
  emoji?: string
  // type-specific payload
  text?: string
  answer?: string
  options?: string[]
  sentence?: string
  hint?: string
  // memory
  translation?: string
}

export interface ItemResult {
  word_id: number | null
  correct: boolean
}

export interface GameEvent {
  type: 'level_up' | 'egg_hatched' | 'dino_evolved'
  level?: number
  dino?: { id: number; species_id: string; rarity: string; stage: number }
  dino_id?: number
  stage?: number
  name?: string
}

export interface PlayerSummary {
  xp: number
  level: number
  level_progress: number
  level_needed: number
  egg_progress: number
  streak: number
}

export interface RoundResultResponse {
  xp_earned: number
  events: GameEvent[]
  player: PlayerSummary
}

export interface OwnedDino {
  id: number
  species_id: string
  rarity: string
  color: string
  stage: number
  xp: number
  name: string
  emoji: string
}

export interface PlayerState extends PlayerSummary {
  id: number
  name: string
  avatar: string
  theme: string
  theme_emoji: string
  collection_es: string
  collection_en: string
  weekly_xp: number
  last_played: string | null
  companion_id: number | null
  dinos: OwnedDino[]
}

export interface PlayerListItem {
  id: number
  name: string
  avatar: string
  theme: string
  has_pin: boolean
  level: number
  xp: number
  weekly_xp: number
  streak: number
  dino_count: number
}

export interface Theme {
  id: string
  name_es: string
  name_en: string
  emoji: string
}

export interface SpeciesStage {
  name: string
  emoji: string
}

export interface Species {
  id: string
  rarity: string
  color: string
  stages: SpeciesStage[]
}

export interface GeneratedWord {
  text: string
  translation: string
  example_sentence: string
  emoji: string
  category: string
}

export interface GeneratedUnit {
  title: string
  words: GeneratedWord[]
  exercises: { type: string }[] & Record<string, unknown>[]
}

export interface UnitSummary {
  id: number
  title: string
  kind: 'unit' | 'exam'
  active: boolean
  created_at: string
  word_count: number
}

export interface ExamStatus {
  exists: boolean
  title?: string
  words_total?: number
  words_mastered?: number
}
