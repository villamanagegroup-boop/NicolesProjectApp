'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import MobileNav from '@/components/layout/MobileNav'
import MobileDrawer from '@/components/layout/MobileDrawer'
import PageTransition from '@/components/layout/PageTransition'
import PreviewBanner from '@/components/admin/PreviewBanner'
import NicoleBannerStrip from '@/components/layout/NicoleBannerStrip'
import WelcomeModal from '@/components/portal/WelcomeModal'
import { useApp } from '@/context/AppContext'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { loading, isAuthed, user, setSidebarMode } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  // Keep mobile nav/drawer themed correctly. The desktop sidebar is now
  // unified and ignores sidebarMode, but MobileNav and MobileDrawer still
  // use it to swap their per-program nav lists. Update mode based on
  // the current route — shared routes don't change it.
  useEffect(() => {
    if (!pathname) return
    const isShared =
      pathname === '/settings' || pathname.startsWith('/settings/') ||
      pathname === '/profile'  || pathname.startsWith('/profile/')  ||
      pathname === '/upgrade'
    if (isShared) return
    if (pathname.startsWith('/circle'))      setSidebarMode('circle')
    else if (pathname.startsWith('/program')) setSidebarMode('work')
    else                                       setSidebarMode('cards')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Route-level path isolation: each persona only sees their own content.
  // A: /program + (when unlocked) /card·/dashboard·... — no /circle.
  // B: cards routes only — no /program, no /circle.
  // C: /circle only — no cards routes, no /program.
  // Locked paths now route to /upgrade so the user sees what to buy next.
  // Admins bypass.
  useEffect(() => {
    if (loading || !isAuthed || user.isAdmin || !pathname) return
    const CARDS_PREFIXES = ['/dashboard', '/cards', '/card', '/past', '/vault', '/wins', '/journal']
    const inCards  = CARDS_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
    const inWork   = pathname.startsWith('/program')
    const inCircle = pathname.startsWith('/circle')
    if (user.selectedPath === 'A' && inCircle)             { router.replace('/upgrade'); return }
    if (user.selectedPath === 'B' && (inWork || inCircle)) { router.replace('/upgrade'); return }
    if (user.selectedPath === 'C' && (inWork || inCards))  { router.replace('/upgrade'); return }
  }, [loading, isAuthed, user.isAdmin, user.selectedPath, pathname, router])

  // Flow guard: signed-in users who haven't finished setup get bounced back.
  // Onboarding (Enneagram quiz) is only required for Path C — A/B skip it.
  // Admins always skip this guard, even when previewing as a user — the
  // path-isolation guard above already gates them to the previewed path's
  // routes, so we don't also want to push them through the quiz/path-chooser
  // flow they may not have personally completed.
  //
  // Note: we deliberately do NOT auto-redirect users without a quiz_result
  // to /take-the-quiz. Some users took the quiz before signing up and the
  // result didn't get persisted (sessionStorage cleared, fresh tab from
  // Stripe, etc.) — bouncing them out of the dashboard turned the welcome
  // experience into a maze. The welcome pages now expose an optional
  // "Take the quiz →" button so anyone who actually missed it can do it
  // on their own terms; otherwise they just land in the portal.
  useEffect(() => {
    if (loading || !isAuthed || user.isAdmin) return
    if (!user.selectedPath) { router.replace('/quiz/paths'); return }
    if (user.selectedPath === 'C' && !user.onboardingComplete) {
      router.replace('/onboarding'); return
    }
  }, [loading, isAuthed, user.isAdmin, user.selectedPath, user.onboardingComplete, router])

  return (
    <div className="portal-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div className="sidebar">
        <Sidebar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Admin preview banner — only renders when an admin has activated
            "View as member" from /admin/preview or a cohort detail page. */}
        <PreviewBanner />
        <NicoleBannerStrip />
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
          <WelcomeModal />
        </main>
      </div>
      <MobileNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
