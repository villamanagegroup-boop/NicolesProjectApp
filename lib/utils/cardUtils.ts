import { DailyCard } from '@/types'

export function getDayNumber(signupDate: Date): number {
  const now = new Date()
  const diff = now.getTime() - signupDate.getTime()
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1)
}

export function getTodayCard(cards: DailyCard[], dayNumber: number): DailyCard | null {
  return cards.find(c => c.dayNumber === dayNumber) ?? null
}

export function getPastCards(cards: DailyCard[], dayNumber: number): DailyCard[] {
  return cards.filter(c => c.dayNumber < dayNumber && c.dayNumber >= dayNumber - 30)
}

export function getVaultCards(cards: DailyCard[], dayNumber: number): DailyCard[] {
  return cards.filter(c => c.dayNumber < dayNumber - 30)
}

export function isUnlocked(card: DailyCard, dayNumber: number): boolean {
  return card.dayNumber <= dayNumber
}
