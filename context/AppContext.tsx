'use client'
import { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react'
import type { User as AuthUser } from '@supabase/supabase-js'
import { supabaseClient } from '@/lib/supabase/client'
import { User, DailyCard, JournalEntry, DailyQuote, Win, QuizResultId, Path } from '@/types'
import { mockCards } from '@/data/mockCards'
import { mockQuotes } from '@/data/mockQuotes'
import { getDayNumber, getTodayCard, getPastCards, getVaultCards } from '@/lib/utils/cardUtils'
import { computeCardsAccess, type CardsAccess } from '@/lib/utils/pathAccess'

// ── Mock fallback (used only when the viewer is not signed in) ───────────────
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
  isAdmin: true,
  onboardingComplete: true,
  skipPathChooser: true,
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

// ── Supabase row → domain model transforms ───────────────────────────────────

interface UserRow {
  id: string
  name: string | null
  email: string | null
  quiz_result: QuizResultId | null
  selected_path: Path | null
  signup_date: string | null
  stripe_customer_id: string | null
  has_paid: boolean | null
  is_admin: boolean | null
  avatar_url: string | null
  onboarding_complete: boolean | null
  skip_path_chooser: boolean | null
}

function userFromRow(row: UserRow, fallbackEmail: string): User {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? fallbackEmail,
    quizResult: row.quiz_result,
    selectedPath: row.selected_path,
    signupDate: row.signup_date ? new Date(row.signup_date) : new Date(),
    stripeCustomerId: row.stripe_customer_id,
    hasPaid: row.has_paid ?? false,
    isAdmin: row.is_admin ?? false,
    onboardingComplete: row.onboarding_complete ?? false,
    skipPathChooser:    row.skip_path_chooser ?? false,
  }
}

interface CardRow {
  id: string
  day_number: number
  theme: string
  title: string
  body_text: string | null
  affirmation: string | null
  journal_prompt: string | null
  image_url: string | null
  card_color: string | null
  emoji: string | null
}

function cardFromRow(row: CardRow): DailyCard {
  return {
    id: row.id,
    dayNumber: row.day_number,
    theme: row.theme,
    title: row.title,
    bodyText: row.body_text ?? '',
    affirmation: row.affirmation ?? '',
    journalPrompt: row.journal_prompt ?? '',
    imageUrl: row.image_url,
    cardColor: row.card_color ?? '#1a2e20',
    emoji: row.emoji ?? '✦',
  }
}

interface JournalRow {
  id: string
  user_id: string
  card_id: string | null
  day_number: number | null
  content: string | null
  created_at: string
}

function journalFromRow(row: JournalRow): JournalEntry {
  return {
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id ?? '',
    dayNumber: row.day_number ?? 0,
    content: row.content ?? '',
    createdAt: new Date(row.created_at),
  }
}

interface WinRow {
  id: string
  user_id: string
  category: 'boundary' | 'choice' | 'moment' | 'growth'
  title: string
  description: string | null
  created_at: string
}

function winFromRow(row: WinRow): Win {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description ?? '',
    createdAt: new Date(row.created_at),
  }
}

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// ── Context shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  authUser: AuthUser | null
  isAuthed: boolean
  loading: boolean
  user: User
  refreshUser: () => Promise<void>
  updateUser: (updates: { name?: string; email?: string }) => Promise<void>
  setSkipPathChooser: (skip: boolean) => Promise<void>
  cards: DailyCard[]
  dayNumber: number
  todayCard: DailyCard | null
  pastCards: DailyCard[]
  vaultCards: DailyCard[]
  cardsAccess: CardsAccess
  journalEntries: JournalEntry[]
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => Promise<void>
  currentQuote: DailyQuote
  checkInToday: string | null
  setCheckIn: (mood: string) => Promise<void>
  streakCount: number
  wins: Win[]
  addWin: (win: Omit<Win, 'id' | 'createdAt'>) => Promise<void>
  updateWin: (id: string, updates: Partial<Omit<Win, 'id' | 'createdAt'>>) => Promise<void>
  deleteWin: (id: string) => Promise<void>
  updateJournalEntry: (id: string, content: string) => Promise<void>
  deleteJournalEntry: (id: string) => Promise<void>
  avatarUrl: string | null
  setAvatarUrl: (url: string | null) => void
  dailyReminders: boolean
  setDailyReminders: (on: boolean) => void
  sidebarMode: 'cards' | 'work' | 'circle'
  setSidebarMode: (mode: 'cards' | 'work' | 'circle') => void
  adminProgramDay: number | null
  setAdminProgramDay: (day: number | null) => void
  adminArchetype: string | null
  setAdminArchetype: (archetype: string | null) => void
  adminCardDay: number | null
  setAdminCardDay: (day: number | null) => void
  realDayNumber: number
  // Admin "view as user" preview — null means acting as admin; 'A'|'B'|'C'
  // previews the app as if the admin had chosen that path (gates behave accordingly).
  viewAsPath: Path | null
  setViewAsPath: (p: Path | null) => void
  effectivePath: Path | null
  effectiveIsAdmin: boolean
  // What the effective user is allowed to navigate into.
  // Drives sidebar swap-button visibility + portal layout redirects.
  hasWorkAccess: boolean
  hasCardsAccess: boolean
  hasCircleAccess: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function getArchetypePlaceholder(quizResult: string | null): string {
  if (!quizResult) return '/avatars/seeker.svg'
  return `/avatars/${quizResult}.svg`
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [userRow, setUserRow] = useState<UserRow | null>(null)
  const [loading, setLoading] = useState(true)

  // Domain data — start from mocks; replace with DB rows when signed in
  const [cards, setCards] = useState<DailyCard[]>(mockCards)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [wins, setWins] = useState<Win[]>(mockWins)
  const [checkInToday, setCheckInState] = useState<string | null>(null)
  const [streakCount, setStreakCount] = useState<number>(0)

  // UI / session-only state (unchanged)
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null)
  const [dailyReminders, setDailyReminders] = useState(true)
  const [sidebarMode, setSidebarMode] = useState<'cards' | 'work' | 'circle'>('cards')
  const [adminProgramDay, setAdminProgramDay] = useState<number | null>(null)
  const [adminArchetype, setAdminArchetype] = useState<string | null>(null)
  const [adminCardDay, setAdminCardDay] = useState<number | null>(null)
  const [viewAsPath, setViewAsPath] = useState<Path | null>(null)

  // ── 1. Subscribe to auth state ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setAuthUser(data.session?.user ?? null)
      if (!data.session?.user) setLoading(false)
    })
    const { data: sub } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (!session?.user) {
        // Reset to mocks when signed out
        setUserRow(null)
        setJournalEntries([])
        setWins(mockWins)
        setCheckInState(null)
        setStreakCount(0)
        setAvatarUrlState(null)
        setLoading(false)
        // Next sign-in should see the path-chooser again
        try { sessionStorage.removeItem('welcomed_this_session') } catch {}
      }
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // ── 2. Fetch everything belonging to the signed-in user ────────────────────
  useEffect(() => {
    if (!authUser) return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      const [uRes, cRes, jRes, wRes, ciRes, streakRes] = await Promise.all([
        supabaseClient.from('users').select('*').eq('id', authUser.id).maybeSingle(),
        supabaseClient.from('daily_cards').select('*').order('day_number'),
        supabaseClient.from('journal_entries').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
        supabaseClient.from('wins').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
        supabaseClient.from('daily_check_ins').select('*').eq('user_id', authUser.id).eq('check_in_date', todayISO()).maybeSingle(),
        // Pull last 60 days of check-ins to compute streak client-side
        supabaseClient.from('daily_check_ins').select('check_in_date').eq('user_id', authUser.id).gte('check_in_date', new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)).order('check_in_date', { ascending: false }),
      ])

      if (cancelled) return

      if (uRes.data) setUserRow(uRes.data as UserRow)
      if (uRes.data?.avatar_url) setAvatarUrlState(uRes.data.avatar_url)

      if (cRes.data && cRes.data.length > 0) {
        setCards((cRes.data as CardRow[]).map(cardFromRow))
      }
      if (jRes.data) setJournalEntries((jRes.data as JournalRow[]).map(journalFromRow))
      if (wRes.data) setWins((wRes.data as WinRow[]).map(winFromRow))
      if (ciRes.data) setCheckInState((ciRes.data as { mood: string }).mood)

      // Streak: count consecutive days backward from today (or yesterday if today missing)
      if (streakRes.data) {
        const dates = new Set((streakRes.data as { check_in_date: string }[]).map(r => r.check_in_date))
        let streak = 0
        const cursor = new Date()
        // If today not logged yet, still count from yesterday
        if (!dates.has(todayISO())) cursor.setDate(cursor.getDate() - 1)
        while (dates.has(cursor.toISOString().slice(0, 10))) {
          streak += 1
          cursor.setDate(cursor.getDate() - 1)
        }
        setStreakCount(streak)
      }

      setLoading(false)
    })()

    return () => { cancelled = true }
  }, [authUser])

  // ── 3. Derived values ──────────────────────────────────────────────────────
  const user: User = useMemo(() => {
    if (authUser && userRow) return userFromRow(userRow, authUser.email ?? '')
    return mockUser
  }, [authUser, userRow])

  const realDayNumber = useMemo(() => getDayNumber(user.signupDate), [user.signupDate])
  const dayNumber = adminCardDay ?? realDayNumber
  // Effective path for gating respects the admin "View as" preview.
  const effectivePathForGate = viewAsPath ?? user.selectedPath
  const effectiveIsAdminForGate = user.isAdmin && viewAsPath === null
  const cardsAccess = useMemo(
    () => computeCardsAccess(effectivePathForGate, effectiveIsAdminForGate, dayNumber),
    [effectivePathForGate, effectiveIsAdminForGate, dayNumber],
  )
  // Clamp the visible card day to what the user has access to. When locked
  // entirely (maxDay = 0) todayCard becomes null and past/vault become empty.
  const visibleDay = Math.min(dayNumber, cardsAccess.maxDay)
  const todayCard = useMemo(
    () => cardsAccess.unlocked ? getTodayCard(cards, visibleDay) : null,
    [cards, visibleDay, cardsAccess.unlocked],
  )
  const pastCards = useMemo(
    () => cardsAccess.unlocked ? getPastCards(cards, visibleDay) : [],
    [cards, visibleDay, cardsAccess.unlocked],
  )
  const vaultCards = useMemo(
    () => cardsAccess.unlocked ? getVaultCards(cards, visibleDay) : [],
    [cards, visibleDay, cardsAccess.unlocked],
  )
  const currentQuote = useMemo(() => mockQuotes[dayNumber % mockQuotes.length], [dayNumber])

  // ── 4. Mutations (DB when authed, local state otherwise) ───────────────────

  const updateUser = useCallback(async (updates: { name?: string; email?: string }) => {
    if (authUser) {
      await supabaseClient.from('users').update(updates).eq('id', authUser.id)
      setUserRow(prev => prev ? { ...prev, ...updates } : prev)
    }
  }, [authUser])

  const refreshUser = useCallback(async () => {
    if (!authUser) return
    const { data } = await supabaseClient.from('users').select('*').eq('id', authUser.id).maybeSingle()
    if (data) setUserRow(data as UserRow)
  }, [authUser])

  const setSkipPathChooser = useCallback(async (skip: boolean) => {
    if (authUser) {
      await supabaseClient.from('users').update({ skip_path_chooser: skip }).eq('id', authUser.id)
      setUserRow(prev => prev ? { ...prev, skip_path_chooser: skip } : prev)
    }
  }, [authUser])

  const addJournalEntry = useCallback(async (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    if (authUser) {
      const { data } = await supabaseClient.from('journal_entries').insert({
        user_id: authUser.id,
        card_id: entry.cardId || null,
        day_number: entry.dayNumber,
        content: entry.content,
      }).select().single()
      if (data) setJournalEntries(prev => [journalFromRow(data as JournalRow), ...prev])
    } else {
      const local: JournalEntry = { ...entry, id: `journal-${Date.now()}`, createdAt: new Date() }
      setJournalEntries(prev => [local, ...prev])
    }
  }, [authUser])

  const updateJournalEntry = useCallback(async (id: string, content: string) => {
    if (authUser) {
      await supabaseClient.from('journal_entries').update({ content }).eq('id', id)
    }
    setJournalEntries(prev => prev.map(e => e.id === id ? { ...e, content } : e))
  }, [authUser])

  const deleteJournalEntry = useCallback(async (id: string) => {
    if (authUser) {
      await supabaseClient.from('journal_entries').delete().eq('id', id)
    }
    setJournalEntries(prev => prev.filter(e => e.id !== id))
  }, [authUser])

  const setCheckIn = useCallback(async (mood: string) => {
    setCheckInState(mood)
    if (authUser) {
      await supabaseClient.from('daily_check_ins').upsert({
        user_id: authUser.id,
        check_in_date: todayISO(),
        mood,
      }, { onConflict: 'user_id,check_in_date' })
    } else {
      localStorage.setItem(`clarity_checkin_${new Date().toDateString()}`, mood)
    }
  }, [authUser])

  const addWin = useCallback(async (win: Omit<Win, 'id' | 'createdAt'>) => {
    if (authUser) {
      const { data } = await supabaseClient.from('wins').insert({
        user_id: authUser.id,
        category: win.category,
        title: win.title,
        description: win.description,
      }).select().single()
      if (data) setWins(prev => [winFromRow(data as WinRow), ...prev])
    } else {
      const local: Win = { ...win, id: `win-${Date.now()}`, createdAt: new Date() }
      setWins(prev => [local, ...prev])
    }
  }, [authUser])

  const updateWin = useCallback(async (id: string, updates: Partial<Omit<Win, 'id' | 'createdAt'>>) => {
    if (authUser) {
      await supabaseClient.from('wins').update(updates).eq('id', id)
    }
    setWins(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w))
  }, [authUser])

  const deleteWin = useCallback(async (id: string) => {
    if (authUser) {
      await supabaseClient.from('wins').delete().eq('id', id)
    }
    setWins(prev => prev.filter(w => w.id !== id))
  }, [authUser])

  const setAvatarUrl = useCallback((url: string | null) => {
    setAvatarUrlState(url)
    if (authUser) {
      // Fire-and-forget; avatar_url is low stakes
      supabaseClient.from('users').update({ avatar_url: url }).eq('id', authUser.id).then(() => {})
    }
  }, [authUser])

  // On mount, restore check-in from localStorage when NOT authed (keeps existing dev behavior)
  useEffect(() => {
    if (authUser) return
    const stored = localStorage.getItem(`clarity_checkin_${new Date().toDateString()}`)
    if (stored) setCheckInState(stored)
  }, [authUser])

  const value: AppContextValue = {
    authUser,
    isAuthed: !!authUser,
    loading,
    user,
    refreshUser,
    updateUser,
    setSkipPathChooser,
    cards,
    dayNumber,
    todayCard,
    pastCards,
    vaultCards,
    cardsAccess,
    journalEntries,
    addJournalEntry,
    currentQuote,
    checkInToday,
    setCheckIn,
    streakCount,
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
    adminProgramDay,
    setAdminProgramDay,
    adminArchetype,
    setAdminArchetype,
    adminCardDay,
    setAdminCardDay,
    realDayNumber,
    viewAsPath,
    setViewAsPath,
    effectivePath: effectivePathForGate,
    effectiveIsAdmin: effectiveIsAdminForGate,
    hasWorkAccess:   effectivePathForGate === 'A' || effectiveIsAdminForGate,
    hasCardsAccess:  effectivePathForGate === 'B' || (effectivePathForGate === 'A' && cardsAccess.unlocked) || effectiveIsAdminForGate,
    hasCircleAccess: effectivePathForGate === 'C' || effectiveIsAdminForGate,
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
