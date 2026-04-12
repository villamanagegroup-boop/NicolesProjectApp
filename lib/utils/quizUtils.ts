import { QuizResultId } from '@/types'

export interface Question {
  id: number
  text: string
  theme: string
  emoji: string
  options: string[]
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "When life starts pressing, you usually:",
    theme: "Your inner\ncompass",
    emoji: "🌿",
    options: ["Push through", "Push it to the side", "Go quiet and think", "Stay available"]
  },
  {
    id: 2,
    text: "By the end of most days, what feels the most tapped out?",
    theme: "Your energy\npattern",
    emoji: "⚡",
    options: ["Your drive / motivation", "Your mental capacity", "Your emotional patience", "Your physical energy"]
  },
  {
    id: 3,
    text: "You feel the most like yourself when:",
    theme: "Your truest\nself",
    emoji: "🌸",
    options: ["You're handling business", "Somebody needs you", "It's quiet and nobody's asking nothing", "You've already moved your body"]
  },
  {
    id: 4,
    text: "When plans fall through, your first reaction is usually:",
    theme: "How you\nprocess",
    emoji: "🧭",
    options: ["Running it back in your head later", '"It\'s cool, I\'ll adjust."', "Feeling it in your body before you can explain it", "Getting a little irritated, then doing something else"]
  },
  {
    id: 5,
    text: "You get uncomfortable when you:",
    theme: "Your edge\npattern",
    emoji: "✨",
    options: ["Slow down", "Let someone down", "Don't have clarity", "Fall behind"]
  },
  {
    id: 6,
    text: "People usually count on you for your:",
    theme: "Your natural\ngift",
    emoji: "💡",
    options: ["Heart", "Mind", "Follow-through", "Strength"]
  },
  {
    id: 7,
    text: "Which one feels the most true lately?",
    theme: "Your current\nstate",
    emoji: "🔥",
    options: ["I feel drained around people.", "My mind never really shuts off.", "I start strong, then fall off.", "I keep running on empty."]
  },
  {
    id: 8,
    text: "If you had more energy, you'd finally feel:",
    theme: "What you're\nreaching for",
    emoji: "🌙",
    options: ["Clearer", "Lighter", "More consistent", "Balanced"]
  },
  {
    id: 9,
    text: "Which sentence hits closest to home?",
    theme: "Your inner\ntruth",
    emoji: "💭",
    options: ["I spend more time in my head than in my body.", "I don't know who I am when I'm not needed.", "I don't really know how to slow down.", "I keep having to start over with myself."]
  },
  {
    id: 10,
    text: "If nothing changes, what worries you the most?",
    theme: "Your deepest\nconcern",
    emoji: "⚠️",
    options: ["Mental burnout", "Physical burnout", "Wasted potential", "Growing resentment"]
  },
  {
    id: 11,
    text: "When you picture your best version, the biggest difference is:",
    theme: "Your best\nself vision",
    emoji: "🌿",
    options: ["How balanced your life feels", "How steady you are", "How quiet your mind is", "How protected your energy feels"]
  },
  {
    id: 12,
    text: "Lately, you've been feeling a pull to:",
    theme: "Your next\nstep",
    emoji: "✦",
    options: ["Slow your thoughts down", "Create more distance", "Get more disciplined", "Rest before something forces you to"]
  }
]

const OUTCOME_MAP: string[][] = [
  // Q1
  ["You keep going past your signals.", "You keep going past your signals.", "Your mind rarely gets to rest.", "Your energy turns on for others."],
  // Q2
  ["Your energy depends on momentum.", "Your mind rarely gets to rest.", "Your energy turns on for others.", "You keep going past your signals."],
  // Q3
  ["Your energy depends on momentum.", "Your energy turns on for others.", "Your mind rarely gets to rest.", "You keep going past your signals."],
  // Q4
  ["Your mind rarely gets to rest.", "Your energy turns on for others.", "You keep going past your signals.", "Your energy depends on momentum."],
  // Q5
  ["You keep going past your signals.", "Your energy turns on for others.", "Your mind rarely gets to rest.", "Your energy depends on momentum."],
  // Q6
  ["Your energy turns on for others.", "Your mind rarely gets to rest.", "Your energy depends on momentum.", "You keep going past your signals."],
  // Q7
  ["Your energy turns on for others.", "Your mind rarely gets to rest.", "Your energy depends on momentum.", "You keep going past your signals."],
  // Q8
  ["Your mind rarely gets to rest.", "Your energy turns on for others.", "Your energy depends on momentum.", "You keep going past your signals."],
  // Q9
  ["Your mind rarely gets to rest.", "Your energy turns on for others.", "You keep going past your signals.", "Your energy depends on momentum."],
  // Q10
  ["Your mind rarely gets to rest.", "You keep going past your signals.", "Your energy depends on momentum.", "Your energy turns on for others."],
  // Q11
  ["You keep going past your signals.", "Your energy depends on momentum.", "Your mind rarely gets to rest.", "Your energy turns on for others."],
  // Q12
  ["Your mind rarely gets to rest.", "Your energy turns on for others.", "Your energy depends on momentum.", "You keep going past your signals."],
]

export function scoreQuiz(answers: Record<number, number>): QuizResultId {
  const tally: Record<string, number> = {
    "Your mind rarely gets to rest.": 0,
    "Your energy turns on for others.": 0,
    "Your energy depends on momentum.": 0,
    "You keep going past your signals.": 0,
  }

  Object.entries(answers).forEach(([qIdx, aIdx]) => {
    const outcome = OUTCOME_MAP[Number(qIdx)]?.[Number(aIdx)]
    if (outcome) tally[outcome]++
  })

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1])

  const outcomeToId: Record<string, QuizResultId> = {
    "Your mind rarely gets to rest.": "seeker",
    "Your energy turns on for others.": "healer",
    "Your energy depends on momentum.": "builder",
    "You keep going past your signals.": "visionary",
  }

  return outcomeToId[sorted[0][0]]
}
