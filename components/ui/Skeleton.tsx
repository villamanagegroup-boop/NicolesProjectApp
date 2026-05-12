'use client'

// components/ui/Skeleton.tsx
// Pulsing grey block used as a placeholder while a page is hydrating. The
// keyframes live in app/globals.css (or get injected once by the first
// instance) so multiple skeletons on one page share a single animation
// loop instead of each restarting it.

import { type CSSProperties } from 'react'

interface Props {
  width?: number | string
  height?: number | string
  radius?: number | string
  /** Inline style override for the rare edge case (margins, etc.). */
  style?: CSSProperties
}

export function Skeleton({ width = '100%', height = 16, radius = 6, style }: Props) {
  return (
    <div
      aria-hidden="true"
      style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, rgba(12,12,10,0.05) 0%, rgba(12,12,10,0.10) 50%, rgba(12,12,10,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

// Mount once at the top of the tree to inject the keyframes. Cheap; no-op
// if it ends up in the DOM more than once because keyframes is global.
export function SkeletonStyles() {
  return (
    <style>{`
      @keyframes skeleton-pulse {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  )
}
