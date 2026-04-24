'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import SidebarWork from '@/components/layout/SidebarWork'
import Topbar from '@/components/layout/Topbar'
import MobileNav from '@/components/layout/MobileNav'
import MobileDrawer from '@/components/layout/MobileDrawer'
import PageTransition from '@/components/layout/PageTransition'
import { useApp } from '@/context/AppContext'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { sidebarMode, loading, isAuthed, user } = useApp()
  const router = useRouter()

  // Flow guard: signed-in users who haven't finished setup get bounced back.
  // Unauthenticated viewers fall through so the /login admin bypass keeps working.
  useEffect(() => {
    if (loading || !isAuthed) return
    if (!user.quizResult)        { router.replace('/quiz'); return }
    if (!user.selectedPath)      { router.replace('/quiz/paths'); return }
    if (!user.onboardingComplete) { router.replace('/onboarding'); return }
  }, [loading, isAuthed, user.quizResult, user.selectedPath, user.onboardingComplete, router])

  return (
    <div className="portal-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div className="sidebar">
        {sidebarMode === 'work' ? <SidebarWork /> : <Sidebar />}
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
