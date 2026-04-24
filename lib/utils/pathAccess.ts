import type { Path } from '@/types'

/**
 * Controls Daily Cards access by path.
 *
 * Path B (365 Days):   full access from day 1.
 * Path C (Coaching):   full access from day 1.
 * Path A (Seal Leak):  cards locked during the 7-day program, with a small
 *                      teaser at the end:
 *                        - days 1–5: locked entirely ("Unlocks on Day 6")
 *                        - day 6:    Card Day 1 available
 *                        - day 7:    Cards 1–2 available
 *                        - day 8+:   still only 1–2 available + upgrade prompt
 *                                    ("Upgrade to unlock the rest")
 * Admins: treated as full access (Path B-equivalent) — the view-as dropdown
 * is the right way to preview the Path A experience.
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

export function computeCardsAccess(
  selectedPath: Path | null,
  isAdmin: boolean,
  realDay: number,
): CardsAccess {
  // Admins + Path B + Path C: full access
  if (isAdmin || selectedPath === 'B' || selectedPath === 'C') {
    return { unlocked: true, maxDay: realDay, state: 'open' }
  }

  if (selectedPath === 'A') {
    if (realDay < PATH_A_CARDS_UNLOCK_DAY) {
      return {
        unlocked: false,
        maxDay: 0,
        state: 'locked-not-yet',
        unlocksOnDay: PATH_A_CARDS_UNLOCK_DAY,
      }
    }
    // During the last two days of the 7-day program, a teaser appears.
    // After day 7 finishes, the same two cards remain visible but with
    // an upgrade prompt.
    const teaserMax = Math.min(realDay - (PATH_A_CARDS_UNLOCK_DAY - 1), PATH_A_MAX_CARDS)
    const maxDay = Math.max(0, teaserMax)
    const state: CardsAccessState =
      realDay > PATH_A_PROGRAM_LENGTH ? 'locked-upgrade' : 'open'
    return { unlocked: maxDay > 0, maxDay, state }
  }

  // No path selected yet
  return {
    unlocked: false,
    maxDay: 0,
    state: 'locked-not-yet',
    unlocksOnDay: 1,
  }
}
