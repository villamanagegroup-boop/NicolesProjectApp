import type { Path } from '@/types'

/**
 * Controls Daily Cards access by path.
 *
 * Path B (365 Days):    full access from day 1 (signup date = cards Day 1).
 * Path C (Coaching):    no cards (circle only).
 * Path A (Seal Leak):
 *   no add-on → 7-day teaser:
 *     days 1–5: locked  ("Unlocks on Day 6")
 *     day 6:    Card Day 1 available
 *     day 7:    Cards 1–2 available
 *     day 8+:   same 2 cards + upgrade prompt
 *   with add-on → full access starting the day they added it.
 *     That day becomes their Cards Day 1; the Day-6 teaser gate no
 *     longer applies.
 * Admins: full access regardless.
 */

export const PATH_A_CARDS_UNLOCK_DAY = 6
export const PATH_A_MAX_CARDS = 2
export const PATH_A_PROGRAM_LENGTH = 7

export type CardsAccessState = 'open' | 'locked-not-yet' | 'locked-upgrade'

export interface CardsAccess {
  unlocked: boolean            // at least one card visible
  maxDay: number               // highest day_number they can see (0 when locked)
  state: CardsAccessState
  unlocksOnDay?: number        // set only when state = 'locked-not-yet'
}

function daysSince(d: Date): number {
  const now = Date.now()
  return Math.floor((now - d.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * @param selectedPath     the user's path
 * @param isAdmin          effective admin (not previewing as a user)
 * @param sealTheLeakDay   current day of Seal the Leak (signup-based, admin-override-aware)
 * @param cardsPlanStart   date their cards-plan started. For Path B this is their signup_date.
 *                         For Path A with the add-on it's cards_addon_started_at.
 *                         Null for Path A without add-on and for Path C.
 */
export function computeCardsAccess(
  selectedPath: Path | null,
  isAdmin: boolean,
  sealTheLeakDay: number,
  cardsPlanStart: Date | null,
): CardsAccess {
  // Admin: treat as full cards access regardless of path so they can navigate freely.
  if (isAdmin) {
    return { unlocked: true, maxDay: 365, state: 'open' }
  }

  // Path C: circle only, no cards.
  if (selectedPath === 'C') {
    return { unlocked: false, maxDay: 0, state: 'locked-not-yet' }
  }

  // Any user with a cards-plan start date (Path B always, Path A with add-on):
  // full access. Cards Day 1 = plan start date.
  if (cardsPlanStart) {
    const cardsDay = Math.max(1, daysSince(cardsPlanStart) + 1)
    return { unlocked: true, maxDay: cardsDay, state: 'open' }
  }

  // Path A without the add-on: teaser gate.
  if (selectedPath === 'A') {
    if (sealTheLeakDay < PATH_A_CARDS_UNLOCK_DAY) {
      return {
        unlocked: false,
        maxDay: 0,
        state: 'locked-not-yet',
        unlocksOnDay: PATH_A_CARDS_UNLOCK_DAY,
      }
    }
    const teaserMax = Math.min(sealTheLeakDay - (PATH_A_CARDS_UNLOCK_DAY - 1), PATH_A_MAX_CARDS)
    const maxDay = Math.max(0, teaserMax)
    const state: CardsAccessState =
      sealTheLeakDay > PATH_A_PROGRAM_LENGTH ? 'locked-upgrade' : 'open'
    return { unlocked: maxDay > 0, maxDay, state }
  }

  // No path yet
  return { unlocked: false, maxDay: 0, state: 'locked-not-yet', unlocksOnDay: 1 }
}
