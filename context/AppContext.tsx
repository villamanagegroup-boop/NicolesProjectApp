'use client'
import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react'
import { User, DailyCard, JournalEntry, DailyQuote, Win } from '@/types'
import { mockCards } from '@/data/mockCards'
import { mockQuotes } from '@/data/mockQuotes'
import { getDayNumber, getTodayCard, getPastCards, getVaultCards } from '@/lib/utils/cardUtils'

// Simulate a user who signed up 4 days ago, making today Day 5
const MOCK_SIGNUP = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)

const mockUser: User = {
  id: 'mock-user-1',
  name: 'Nicole',
  email: 'nicole@example.com',
  quizResult: 'seeker',
  selectedPath: 'B',
  signupDate: MOCK_SIGNUP,
  stripeCustomerId: null,
  hasPaid: false,
}

const mockWins: Win[] = [
  {
    id: 'win-1',
    category: 'boundary',
    title: 'Said no without explaining myself',
    description: "Declined a request that didn't align with my energy this week.",
    createdAt: new Date(Date.now() - 2 * 86400000),
  },
  {
    id: 'win-2',
    category: 'choice',
    title: 'Chose rest over productivity',
    description: 'Let myself recover instead of pushing through exhaustion.',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'win-3',
    category: 'moment',
    title: 'Spoke my truth in a hard conversation',
    description: 'Said what I actually felt, even though it was uncomfortable.',
    createdAt: new Date(),
  },
]

interface AppContextValue {
  user: User
  updateUser: (updates: { name?: string; email?: string }) => void
  cards: DailyCard[]
  dayNumber: number
  todayCard: DailyCard | null
  pastCards: DailyCard[]
  vaultCards: DailyCard[]
  journalEntries: JournalEntry[]
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  currentQuote: DailyQuote
  // Check-in state
  checkInToday: string | null
  setCheckIn: (mood: string) => void
  // Streak
  streakCount: number
  // Wins
  wins: Win[]
  addWin: (win: Omit<Win, 'id' | 'createdAt'>) => void
  updateWin: (id: string, updates: Partial<Omit<Win, 'id' | 'createdAt'>>) => void
  deleteWin: (id: string) => void
  // Journal edit/delete
  updateJournalEntry: (id: string, content: string) => void
  deleteJournalEntry: (id: string) => void
  // Avatar / photo
  avatarUrl: string | null
  setAvatarUrl: (url: string | null) => void
  // Notifications
  dailyReminders: boolean
  setDailyReminders: (on: boolean) => void
  // Sidebar mode
  sidebarMode: 'cards' | 'work'
  setSidebarMode: (mode: 'cards' | 'work') => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function getArchetypePlaceholder(quizResult: string | null): string {
  if (!quizResult) return '/avatars/seeker.svg'
  return `/avatars/${quizResult}.svg`
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userState, setUserState] = useState<User>(mockUser)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [checkInToday, setCheckInState] = useState<string | null>(null)
  const [wins, setWins] = useState<Win[]>(mockWins)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [dailyReminders, setDailyReminders] = useState(true)
  const [sidebarMode, setSidebarMode] = useState<'cards' | 'work'>('cards')

  // On mount, read today's check-in from localStorage
  useEffect(() => {
    const key = `clarity_checkin_${new Date().toDateString()}`
    const stored = localStorage.getItem(key)
    if (stored) {
      setCheckInState(stored)
    }
  }, [])

  const dayNumber = useMemo(() => getDayNumber(mockUser.signupDate), [])
  const todayCard = useMemo(() => getTodayCard(mockCards, dayNumber), [dayNumber])
  const pastCards = useMemo(() => getPastCards(mockCards, dayNumber), [dayNumber])
  const vaultCards = useMemo(() => getVaultCards(mockCards, dayNumber), [dayNumber])

  // Pick a stable daily quote based on day number
  const currentQuote = useMemo(
    () => mockQuotes[dayNumber % mockQuotes.length],
    [dayNumber]
  )

  function updateUser(updates: { name?: string; email?: string }) {
    setUserState(prev => ({ ...prev, ...updates }))
  }

  function addJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>) {
    const newEntry: JournalEntry = {
      ...entry,
      id: `journal-${Date.now()}`,
      createdAt: new Date(),
    }
    setJournalEntries(prev => [newEntry, ...prev])
  }

  function setCheckIn(mood: string) {
    const key = `clarity_checkin_${new Date().toDateString()}`
    localStorage.setItem(key, mood)
    setCheckInState(mood)
  }

  function addWin(win: Omit<Win, 'id' | 'createdAt'>) {
    const newWin: Win = {
      ...win,
      id: `win-${Date.now()}`,
      createdAt: new Date(),
    }
    setWins(prev => [newWin, ...prev])
  }

  function updateWin(id: string, updates: Partial<Omit<Win, 'id' | 'createdAt'>>) {
    setWins(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
  }

  function deleteWin(id: string) {
    setWins(prev => prev.filter(w => w.id !== id))
  }

  function updateJournalEntry(id: string, content: string) {
    setJournalEntries(prev => prev.map(e => e.id === id ? { ...e, content } : e))
  }

  function deleteJournalEntry(id: string) {
    setJournalEntries(prev => prev.filter(e => e.id !== id))
  }

  const value: AppContextValue = {
    user: userState,
    updateUser,
    cards: mockCards,
    dayNumber,
    todayCard,
    pastCards,
    vaultCards,
    journalEntries,
    addJournalEntry,
    currentQuote,
    checkInToday,
    setCheckIn,
    streakCount: 5,
    wins,
    addWin,
    updateWin,
    deleteWin,
    updateJournalEntry,
    deleteJournalEntry,
    avatarUrl,
    setAvatarUrl,
    dailyReminders,
    setDailyReminders,
    sidebarMode,
    setSidebarMode,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return ctx
}
