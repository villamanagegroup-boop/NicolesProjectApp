export type QuizResultId = 'seeker' | 'builder' | 'healer' | 'visionary'
export type Path = 'A' | 'B'

export interface User {
  id: string
  name: string
  email: string
  quizResult: QuizResultId | null
  selectedPath: Path | null
  signupDate: Date
  stripeCustomerId: string | null
  hasPaid: boolean
}

export interface DailyCard {
  id: string
  dayNumber: number
  theme: string
  title: string
  bodyText: string
  affirmation: string
  journalPrompt: string
  imageUrl: string | null
  cardColor: string
  emoji: string
}

export interface JournalEntry {
  id: string
  userId: string
  cardId: string
  dayNumber: number
  content: string
  createdAt: Date
}

export interface QuizQuestion {
  id: number
  question: string
  subtitle?: string
  options: QuizOption[]
}

export interface QuizOption {
  label: string
  value: string
  archetype: QuizResultId
}

export interface QuizResult {
  id: QuizResultId
  title: string
  emoji: string
  description: string
  strengths: string[]
}

export interface ProgramModule {
  id: string
  title: string
  description: string
  orderIndex: number
  lessons: ProgramLesson[]
}

export interface ProgramLesson {
  id: string
  moduleId: string
  title: string
  description: string
  videoUrl: string | null
  durationMinutes: number
  orderIndex: number
}

export interface DailyQuote {
  id: string
  text: string
  source: string
}

export interface LessonProgress {
  lessonId: string
  completedAt: Date
}

export interface Win {
  id: string
  category: 'boundary' | 'choice' | 'moment' | 'growth'
  title: string
  description: string
  createdAt: Date
}
