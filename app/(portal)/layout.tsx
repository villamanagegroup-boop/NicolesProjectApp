'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import SidebarWork from '@/components/layout/SidebarWork'
import SidebarCircle from '@/components/layout/SidebarCircle'
import Topbar from '@/components/layout/Topbar'
import MobileNav from '@/components/layout/MobileNav'
import MobileDrawer from '@/components/layout/MobileDrawer'
import PageTransition from '@/components/layout/PageTransition'
import { useApp } from '@/context/AppContext'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { sidebarMode, setSidebarMode, loading, isAuthed, user, effectivePath, effectiveIsAdmin } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  // Route-level path isolation: each persona only sees their own content.
  // A: /program + (when unlocked) /card·/dashboard·... — no /circle.
  // B: cards routes only — no /program, no /circle.
  // C: /circle only — no cards routes, no /program.
  // Locked paths now route to /upgrade so the user sees what to buy next.
  // Admins bypass.
  useEffect(() => {
    if (loading || !isAuthed || effectiveIsAdmin || !pathname) return
    const CARDS_PREFIXES = ['/dashboard', '/card', '/past', '/vault', '/wins', '/journal']
    const inCards  = CARDS_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
    const inWork   = pathname.startsWith('/program')
    const inCircle = pathname.startsWith('/circle')
    if (effectivePath === 'A' && inCircle)             { router.replace('/upgrade'); return }
    if (effectivePath === 'B' && (inWork || inCircle)) { router.replace('/upgrade'); return }
    if (effectivePath === 'C' && (inWork || inCards))  { router.replace('/upgrade'); return }
  }, [loading, isAuthed, effectiveIsAdmin, effectivePath, pathname, router])

  // Flow guard: signed-in users who haven't finished setup get bounced back.
  // Onboarding (Enneagram quiz) is only required for Path C — A/B skip it.
  // Admins skip the guard (unless they're previewing as a user via the
  // top-right dropdown — then effectiveIsAdmin goes false and the real
  // flow applies so they see exactly what a user would).
  useEffect(() => {
    if (loading || !isAuthed || effectiveIsAdmin) return
    if (!user.quizResult)   { router.replace('/quiz'); return }
    if (!user.selectedPath) { router.replace('/quiz/paths'); return }
    if (user.selectedPath === 'C' && !user.onboardingComplete) {
      router.replace('/onboarding'); return
    }
  }, [loading, isAuthed, effectiveIsAdmin, user.quizResult, user.selectedPath, user.onboardingComplete, router])

  // One-time init: on first load with a known path, set the sidebar mode
  // to the user's natural home so direct /settings (or any shared route)
  // opens in the right color.
  const didInitMode = useRef(false)
  useEffect(() => {
    if (didInitMode.current) return
    if (loading || !user.selectedPath) return
    const natural = user.selectedPath === 'A' ? 'work'
                  : user.selectedPath === 'C' ? 'circle'
                  : 'cards'
    setSidebarMode(natural)
    didInitMode.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user.selectedPath])

  // Auto-switch sidebar mode based on the route the user is on.
  // Shared routes (/settings, /profile, /upgrade) don't change the mode —
  // they stay in whatever mode the user last navigated to.
  useEffect(() => {
    if (!pathname) return
    const isShared =
      pathname === '/settings' || pathname.startsWith('/settings/') ||
      pathname === '/profile'  || pathname.startsWith('/profile/')  ||
      pathname === '/upgrade'
    if (isShared) return
    if (pathname.startsWith('/circle')) {
      if (sidebarMode !== 'circle') setSidebarMode('circle')
    } else if (pathname.startsWith('/program')) {
      if (sidebarMode !== 'work') setSidebarMode('work')
    } else {
      if (sidebarMode !== 'cards') setSidebarMode('cards')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  function renderSidebar() {
    if (sidebarMode === 'work')   return <SidebarWork />
    if (sidebarMode === 'circle') return <SidebarCircle />
    return <Sidebar />
  }

  return (
    <div className="portal-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div className="sidebar">
        {renderSidebar()}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar onMenuOpen={() => setDrawerOpen(true)} />
        <main
          className="portal-main"
          style={{
            flex: 1,
            padding: '32px 40px',
            width: '100%',
          }}
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <MobileNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
