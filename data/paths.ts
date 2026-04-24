export type PathId = 'A' | 'B' | 'C'

export interface PathDefinition {
  id: PathId
  tier: 1 | 2 | 3
  tierLabel: string
  icon: string
  title: string
  shortTitle: string
  price: string
  priceNote: string
  description: string
  includes: string[]
  bestFor: string
  accent: string
  accentPale: string
  ctaLabel: string
  ctaHref: string
  billing: 'subscription' | 'one-time' | 'call'
  recommended?: boolean
}

export const PATHS: Record<PathId, PathDefinition> = {
  B: {
    id: 'B',
    tier: 1,
    tierLabel: 'Tier 1 — Entry',
    icon: '🌿',
    title: '365 Days of Alignment',
    shortTitle: '365 Days',
    price: '$9/mo',
    priceNote: 'or $67/year (save 38%)',
    description:
      'Daily support built around your archetype — prompts, wins, and monthly focus to keep you moving forward consistently.',
    includes: [
      'Daily prompt by archetype',
      'Journal + win tracker',
      'Monthly theme focus',
      'Keeps you in your pipeline',
    ],
    bestFor: 'Best if you want consistent daily support',
    accent: '#1f5c3a',
    accentPale: 'rgba(31,92,58,0.08)',
    ctaLabel: 'Start Daily Practice →',
    ctaHref: '/signup?path=B',
    billing: 'subscription',
  },
  A: {
    id: 'A',
    tier: 2,
    tierLabel: 'Tier 2 — Recommended',
    icon: '🔥',
    title: 'Seal the Leak',
    shortTitle: 'Seal the Leak',
    price: '$37',
    priceNote: 'One-time · Instant access',
    description:
      'A 7-day archetype reset with daily prompts, actions, and shifts — plus 30 days of the 365 Alignment app included. Your conversion engine.',
    includes: [
      '7-day reset by archetype',
      'Daily prompt + action + shift',
      'Includes 30-day app trial',
      'Your conversion engine',
    ],
    bestFor: "Best if you're ready to fix this now",
    accent: '#b8922a',
    accentPale: 'rgba(184,146,42,0.08)',
    ctaLabel: 'Seal the Leak →',
    ctaHref: '/signup?path=A',
    billing: 'one-time',
    recommended: true,
  },
  C: {
    id: 'C',
    tier: 3,
    tierLabel: 'Tier 3 — High Ticket',
    icon: '👑',
    title: 'Private Coaching',
    shortTitle: 'Private Coaching',
    price: '$497+',
    priceNote: 'Book a discovery call',
    description:
      "Identity-level shift work with direct access to Nicole. Group or 1:1 intensive — for when you're ready to fully change the pattern.",
    includes: [
      'Identity-level shift work',
      'Direct access to Nicole',
      'Group: $97–$197/mo',
      '1:1 intensive: $497–$997',
    ],
    bestFor: "Best if you're ready to go all the way in",
    accent: '#0c0c0a',
    accentPale: 'rgba(12,12,10,0.04)',
    ctaLabel: 'Book a Discovery Call →',
    ctaHref: '/signup?path=C',
    billing: 'call',
  },
}

// Tier order (1 → 2 → 3)
export const PATH_ORDER: PathId[] = ['B', 'A', 'C']

export function getPath(id: PathId | null | undefined): PathDefinition {
  return PATHS[id ?? 'B']
}
