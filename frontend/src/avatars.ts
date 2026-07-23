/** Avatar catalog for profiles — grouped so the picker stays browsable. */

export const AVATAR_GROUPS: { id: string; label_es: string; label_en: string; emojis: string[] }[] = [
  {
    id: 'dinos',
    label_es: 'Dinos',
    label_en: 'Dinos',
    emojis: ['🦖', '🦕', '🐉', '🐲', '🦎', '🐊', '🦣', '🦴'],
  },
  {
    id: 'animals',
    label_es: 'Animales',
    label_en: 'Animals',
    emojis: [
      '🐯', '🦁', '🐼', '🐨', '🐵', '🦊', '🐶', '🐱', '🐰', '🐻',
      '🐷', '🐸', '🐧', '🦉', '🦅', '🦄', '🐴', '🐮', '🐔', '🦩',
      '🐢', '🐙', '🦈', '🐬', '🐳', '🦋', '🐝', '🦕',
    ],
  },
  {
    id: 'people',
    label_es: 'Personajes',
    label_en: 'Characters',
    emojis: [
      '🦸', '🦸‍♀️', '🥷', '🧙', '🧚', '🧜', '👸', '🤴', '🧑‍🚀', '👨‍🚒',
      '👮', '👩‍⚕️', '👨‍🍳', '👩‍🎤', '🧑‍🎨', '🤖', '👽', '🎅', '🧝', '🦹',
    ],
  },
  {
    id: 'sports',
    label_es: 'Deportes',
    label_en: 'Sports',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🥋', '🛹', '🚴', '🏊', '⛷️', '🏆', '🥇'],
  },
  {
    id: 'things',
    label_es: 'Cosas',
    label_en: 'Things',
    emojis: [
      '🚀', '✈️', '🏎️', '🚒', '🚜', '🚂', '⛵', '🛸', '🎸', '🎮',
      '🎨', '📚', '🍕', '🍦', '🍩', '🌈', '⭐', '🔥', '💎', '🎈',
    ],
  },
]

export const ALL_AVATARS = AVATAR_GROUPS.flatMap((g) => g.emojis)
