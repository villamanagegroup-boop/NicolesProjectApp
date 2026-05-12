import { DailyCard } from '@/types'

// Day rollover happens at 4 AM local time — same convention the Settings
// page advertises ("Delivery time: 4:00 AM every day") and the same boundary
// Seal the Leak uses to unlock the next day's content. Subtracting 4 hours
// and snapping each date to its local midnight gives us a calendar-day
// index whose boundary lands exactly at 4 AM.
function calendarDayIndexAtFourAm(d: Date): number {
  const shifted = new Date(d.getTime() - 4 * 60 * 60 * 1000)
  shifted.setHours(0, 0, 0, 0)
  return Math.floor(shifted.getTime() / (1000 * 60 * 60 * 24))
}

export function getDayNumber(signupDate: Date): number {
  return Math.max(
    1,
    calendarDayIndexAtFourAm(new Date()) - calendarDayIndexAtFourAm(signupDate) + 1,
  )
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
