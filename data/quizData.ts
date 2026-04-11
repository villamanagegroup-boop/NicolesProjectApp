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

export const quizResults: QuizResult[] = [
  {
    id: 'seeker',
    title: 'The Seeker',
    emoji: '🌿',
    description:
      'You are driven by an insatiable hunger for truth and meaning. You do not settle for surface answers — you dig until you find the root. Your inner world is rich and complex, and you are most alive when you are learning, questioning, and uncovering layers others miss.',
    strengths: ['Deep curiosity', 'Intellectual courage', 'Visionary thinking'],
  },
  {
    id: 'builder',
    title: 'The Builder',
    emoji: '⚡',
    description:
      'You turn vision into reality. Where others see obstacles, you see blueprints. You are energized by progress, driven by discipline, and you do not stop until something is made. Your growth comes through action — through building the life you can see clearly in your mind.',
    strengths: ['Discipline', 'Strategic thinking', 'Resilience'],
  },
  {
    id: 'healer',
    title: 'The Healer',
    emoji: '🌸',
    description:
      'You carry a gift for restoration — of self, of relationships, of community. You feel deeply, love generously, and often know what others need before they do. Your path to growth moves through the heart, and your greatest power lies in your ability to hold space for transformation.',
    strengths: ['Deep empathy', 'Intuitive wisdom', 'Generosity of spirit'],
  },
  {
    id: 'visionary',
    title: 'The Visionary',
    emoji: '✨',
    description:
      'You see what does not yet exist and believe it into being. You are drawn to purpose, legacy, and the bigger picture. Your growth unfolds when you align your daily life with your deepest calling — when every action becomes an act of creation rather than just survival.',
    strengths: ['Creative vision', 'Spiritual depth', 'Purpose clarity'],
  },
]
