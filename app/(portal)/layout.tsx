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
import { SkeletonStyles } from '@/components/ui/Skeleton'
import { useApp } from '@/context/AppContext'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { loading, isAuthed, user, setSidebarMode } = useApp()
  const router = useRouter()
  const pathname = usePathname()

  // sidebarMode (used by MobileNav + MobileDrawer) follows the URL only
  // when the URL is program-specific. Cross-cutting routes (Home,
  // journal, wins, inbox, settings, profile, upgrade) DO NOT change
  // the mode — the sidebar stays on whichever program the user was
  // last looking at. Home is the user's universal landing; it should
  // never silently switch programs out from under them.
  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/circle'))  { setSidebarMode('circle'); return }
    if (pathname.startsWith('/program')) { setSidebarMode('work');   return }
    if (pathname === '/cards' || pathname.startsWith('/cards') ||
        pathname === '/card'  || pathname.startsWith('/card')  ||
        pathname === '/past'  || pathname.startsWith('/past')  ||
        pathname === '/vault' || pathname.startsWith('/vault')) {
      setSidebarMode('cards'); return
    }
    // Anything else — leave sidebarMode alone (sticky).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // First-load seed: if the user lands on a cross-cutting route directly
  // (e.g. signs in and gets dropped on /dashboard), use their selected_path
  // to pick a reasonable starting program for the sidebar. Runs once when
  // user.selectedPath becomes known.
  const [sidebarSeeded, setSidebarSeeded] = useState(false)
  useEffect(() => {
    if (sidebarSeeded || !user.selectedPath || !pathname) return
    const onProgramRoute =
      pathname.startsWith('/circle') || pathname.startsWith('/program') ||
      pathname.startsWith('/cards')  || pathname.startsWith('/card')    ||
      pathname.startsWith('/past')   || pathname.startsWith('/vault')
    if (onProgramRoute) { setSidebarSeeded(true); return }
    if      (user.selectedPath === 'A') setSidebarMode('work')
    else if (user.selectedPath === 'C') setSidebarMode('circle')
    else                                setSidebarMode('cards')
    setSidebarSeeded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.selectedPath, pathname, sidebarSeeded])

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
    <>
    <SkeletonStyles />
    <div className="portal-shell" style={{ display: 'flex', minHeight: '100vh' }}>
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
    </>
  )
}
