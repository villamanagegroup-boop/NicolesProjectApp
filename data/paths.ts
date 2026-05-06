export type PathId = 'A' | 'B' | 'C'

export interface PathDefinition {
  id: PathId
  tier: 1 | 2 | 3
  tierLabel: string
  icon: string
  title: string
  shortTitle: string
  /** Energetic one-liner shown above the title on tiles. */
  tagline?: string
  price: string
  priceNote: string
  description: string
  includes: string[]
  bestFor: string
  /** What unlocks the moment they pay — used as the "first move" callout. */
  firstMove?: string
  accent: string
  accentPale: string
  ctaLabel: string
  ctaHref: string
  ctaHrefAlt?: string
  billing: 'subscription' | 'one-time' | 'call'
  recommended?: boolean
}

export const PATHS: Record<PathId, PathDefinition> = {
  B: {
    id: 'B',
    tier: 1,
    tierLabel: 'Daily practice',
    icon: '🌿',
    title: '365 Days of Alignment',
    shortTitle: '365 Days',
    tagline: 'Show up for yourself, daily.',
    price: '$9/mo',
    priceNote: '$9/mo or $67/yr · Cancel anytime',
    description:
      'A new card every morning, built around your archetype. Two minutes a day, 365 days a year — the practice does the work.',
    includes: [
      'A new daily card built around your archetype',
      'Journal + win tracker that grows with you',
      'Streaks, monthly themes, and a card vault',
      'Cancel anytime — no contract, no hoops',
    ],
    bestFor: 'Best for keeping the work alive day-to-day.',
    firstMove: 'Day 1 unlocks the moment you sign up.',
    accent: '#1f5c3a',
    accentPale: 'rgba(31,92,58,0.08)',
    ctaLabel: 'Start your daily practice',
    ctaHref: process.env.NEXT_PUBLIC_STRIPE_CARDS_MONTHLY ?? '/signup?path=B',
    ctaHrefAlt: process.env.NEXT_PUBLIC_STRIPE_CARDS_YEARLY ?? '/signup?path=B',
    billing: 'subscription',
  },
  A: {
    id: 'A',
    tier: 2,
    tierLabel: 'Most popular',
    icon: '🔥',
    title: 'Seal the Leak',
    shortTitle: 'Seal the Leak',
    tagline: 'Fix the pattern in 7 days.',
    price: '$37',
    priceNote: 'One-time · Lifetime access',
    description:
      'A 7-day archetype reset that moves you through four phases — Awareness, Interruption, Reclamation, Identity — with a prompt, an action, and a seal each day. Finish Day 7 and unlock 30 days of the Alignment app so the work doesn\'t stop.',
    includes: [
      '7-day reset, paced day by day',
      'Daily prompt + action + seal',
      '4-phase shift framework built around your archetype',
      '30 days of 365 Alignment unlocked after you finish Day 7',
      'Lifetime access — keep coming back',
    ],
    bestFor: "Best if you're ready to move on this now.",
    firstMove: 'Day 1 starts the moment you sign up.',
    accent: '#b8922a',
    accentPale: 'rgba(184,146,42,0.08)',
    ctaLabel: 'Start the 7-day reset',
    ctaHref: process.env.NEXT_PUBLIC_STRIPE_LEAK ?? '/signup?path=A',
    billing: 'one-time',
    recommended: true,
  },
  C: {
    id: 'C',
    tier: 3,
    tierLabel: 'Deep work',
    icon: '👑',
    title: 'The Circle',
    shortTitle: 'The Circle',
    tagline: 'Identity-level shift work, with Nicole.',
    price: '$497',
    priceNote: 'One-time · or 3 × $197',
    description:
      "12 weeks of guided work with Nicole leading live calls, a matched accountability partner, and a tight cohort community. For when you're ready to fully change the pattern.",
    includes: [
      '12-week program (Root → Rebuild → Rise)',
      'Live group calls with Nicole + replays',
      'Matched accountability partner',
      'Cohort community feed',
      'Pay $497 in full — or 3 × $197',
    ],
    bestFor: 'Best if you want a coach in the room with you.',
    firstMove: 'Cohort onboarding starts within 48 hours.',
    accent: '#0c0c0a',
    accentPale: 'rgba(12,12,10,0.04)',
    ctaLabel: 'Join The Circle',
    ctaHref: process.env.NEXT_PUBLIC_STRIPE_CIRCLE_ONETIME ?? '/signup?path=C',
    ctaHrefAlt: process.env.NEXT_PUBLIC_STRIPE_CIRCLE_MONTHLY ?? '/signup?path=C',
    billing: 'one-time',
  },
}

// Tier order (1 → 2 → 3)
export const PATH_ORDER: PathId[] = ['B', 'A', 'C']

export function getPath(id: PathId | null | undefined): PathDefinition {
  return PATHS[id ?? 'B']
}
