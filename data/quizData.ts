import { QuizQuestion, QuizResult } from '@/types'

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'When you wake up in the morning, what\'s your first instinct?',
    options: [
      { label: 'Reflect in silence', value: 'a', archetype: 'seeker' },
      { label: 'Jump into action', value: 'b', archetype: 'builder' },
      { label: 'Connect with someone', value: 'c', archetype: 'healer' },
      { label: 'Review my goals', value: 'd', archetype: 'visionary' },
    ],
  },
  {
    id: 2,
    question: 'How do you process difficult emotions?',
    options: [
      { label: 'Journal or write', value: 'a', archetype: 'seeker' },
      { label: 'Channel into movement', value: 'b', archetype: 'builder' },
      { label: 'Talk to someone', value: 'c', archetype: 'healer' },
      { label: 'Need time alone', value: 'd', archetype: 'visionary' },
    ],
  },
  {
    id: 3,
    question: 'What does growth mean to you right now?',
    options: [
      { label: 'Healing my past', value: 'a', archetype: 'healer' },
      { label: 'Building my future', value: 'b', archetype: 'builder' },
      { label: 'Deepening who I am', value: 'c', archetype: 'seeker' },
      { label: 'Expanding my impact', value: 'd', archetype: 'visionary' },
    ],
  },
  {
    id: 4,
    question: 'Which word calls to you most?',
    options: [
      { label: 'Clarity', value: 'a', archetype: 'seeker' },
      { label: 'Strength', value: 'b', archetype: 'builder' },
      { label: 'Peace', value: 'c', archetype: 'healer' },
      { label: 'Purpose', value: 'd', archetype: 'visionary' },
    ],
  },
  {
    id: 5,
    question: 'What\'s the biggest block between you and your best self?',
    options: [
      { label: 'No clear direction', value: 'a', archetype: 'seeker' },
      { label: 'Lack of follow-through', value: 'b', archetype: 'builder' },
      { label: 'Old wounds', value: 'c', archetype: 'healer' },
      { label: 'Fear of others\' opinions', value: 'd', archetype: 'visionary' },
    ],
  },
  {
    id: 6,
    question: 'When you imagine your most aligned version, what do you see?',
    options: [
      { label: 'Calm and grounded', value: 'a', archetype: 'seeker' },
      { label: 'Focused and purposeful', value: 'b', archetype: 'builder' },
      { label: 'Deeply connected', value: 'c', archetype: 'healer' },
      { label: 'Creative and free', value: 'd', archetype: 'visionary' },
    ],
  },
  {
    id: 7,
    question: 'How consistent are you with personal practices?',
    options: [
      { label: 'Very consistent', value: 'a', archetype: 'builder' },
      { label: 'Try but fall off', value: 'b', archetype: 'healer' },
      { label: 'Just beginning', value: 'c', archetype: 'seeker' },
      { label: 'Prefer unstructured practice', value: 'd', archetype: 'visionary' },
    ],
  },
]

// IMPORTANT: titles and emojis here are the canonical archetype names used
// across the portal, emails, admin, and the Seal the Leak program. They must
// stay in sync with components/result/ArchetypeReveal.tsx and the route
// names in data/sealTheLeakProgram.ts.
//
// The id field maps the quiz score → the program route via archetypeToRoute
// in sealTheLeakProgram.ts:
//   seeker    → throne   (Overthinker's Throne)
//   healer    → door     (Open Door)
//   builder   → engine   (Interrupted Engine)
//   visionary → push     (Pushthrough)
export const quizResults: QuizResult[] = [
  {
    id: 'seeker',
    title: "The Overthinker's Throne",
    emoji: '🌿',
    description:
      "Your mind doesn't clock out. You think through things before they happen, while they're happening, and long after they're done. You catch what others miss — but it doesn't feel like rest. The exhaustion isn't from doing too much; it's from a mind that's been on surveillance mode for years.",
    strengths: ['Pattern recognition', 'Anticipation', 'Mental endurance'],
  },
  {
    id: 'builder',
    title: 'The Interrupted Engine',
    emoji: '⚡',
    description:
      "When you move, you're unstoppable. You don't lack drive or discipline — when momentum is on your side, you can outwork almost anyone. But life keeps interrupting, and every restart costs more than just time. You don't need more motivation. You need to stop bleeding energy at the breaks.",
    strengths: ['Drive', 'Strategic execution', 'Resilience under pressure'],
  },
  {
    id: 'healer',
    title: 'The Open Door',
    emoji: '🌸',
    description:
      "You don't wait to be needed — you just open. Someone walks in with a problem and your energy shows up before they finish the sentence. You hold space so naturally that most people don't even notice you had to. You're not tired because you gave too much; you're tired because no one has been holding space for you.",
    strengths: ['Deep empathy', 'Intuitive presence', 'Generosity of spirit'],
  },
  {
    id: 'visionary',
    title: 'The Pushthrough',
    emoji: '✨',
    description:
      "You don't wait for permission — you just go. Tired? You keep going. Overwhelmed? You manage it. That ability is real, and it's how you've gotten everything you have. But your body has been asking you to stop for a long time. Rest isn't a retreat for you — it's the power move you haven't let yourself make yet.",
    strengths: ['Decisive action', 'Endurance', 'Self-trust in motion'],
  },
]
