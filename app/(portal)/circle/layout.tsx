'use client'

// app/(portal)/circle/layout.tsx
// Mounts the universal Circle top menu above every Circle page so members
// can jump between Your Circle, Community, Weeks, Live calls, and Partner
// without going back to the sidebar.
//
// Hidden on the focused single-screen flows where extraneous nav would
// distract from the task:
//   • /circle/welcome — 3-screen onboarding tour
//   • /circle/intake  — Enneagram / attachment / goal capture

import { usePathname } from 'next/navigation'
import CircleTopMenu from '@/components/circle/CircleTopMenu'

const HIDDEN_ON: string[] = ['/circle/welcome', '/circle/intake']

export default function CircleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ''
  const showMenu = !HIDDEN_ON.some(p => pathname === p || pathname.startsWith(p + '/'))
  return (
    <>
      {showMenu && (
        // Centered wrapper so the menu aligns with the page content below
        // (which typically caps around 760–1200px) instead of stretching
        // across the full main panel and reading as off-center.
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <CircleTopMenu />
        </div>
      )}
      {children}
    </>
  )
}
