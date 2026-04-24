'use client'
import { useEffect, useState } from 'react'
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
  const { sidebarMode, setSidebarMode, loading, isAuthed, user, effectiveIsAdmin } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  // Flow guard: signed-in users who haven't finished setup get bounced back.
  // Admins skip the guard (unless they're previewing as a user via the
  // top-right dropdown — then effectiveIsAdmin goes false and the real
  // flow applies so they see exactly what a user would).
  useEffect(() => {
    if (loading || !isAuthed || effectiveIsAdmin) return
    if (!user.quizResult)         { router.replace('/quiz'); return }
    if (!user.selectedPath)       { router.replace('/quiz/paths'); return }
    if (!user.onboardingComplete) { router.replace('/onboarding'); return }
    // First pageview of this browser session → welcome/path-chooser,
    // unless the user has turned it off in settings.
    if (!user.skipPathChooser) {
      const welcomed = typeof window !== 'undefined' && sessionStorage.getItem('welcomed_this_session') === '1'
      if (!welcomed) { router.replace('/welcome'); return }
    }
  }, [loading, isAuthed, effectiveIsAdmin, user.quizResult, user.selectedPath, user.onboardingComplete, user.skipPathChooser, router])

  // Auto-switch sidebar mode based on the route the user is on.
  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/circle')) {
      if (sidebarMode !== 'circle') setSidebarMode('circle')
    } else if (pathname.startsWith('/program')) {
      if (sidebarMode !== 'work') setSidebarMode('work')
    } else {
      // cards-side routes: dashboard, card, past, journal, wins, profile, vault, settings
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
