'use client'
import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import SidebarWork from '@/components/layout/SidebarWork'
import Topbar from '@/components/layout/Topbar'
import MobileNav from '@/components/layout/MobileNav'
import MobileDrawer from '@/components/layout/MobileDrawer'
import PageTransition from '@/components/layout/PageTransition'
import { useApp } from '@/context/AppContext'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { sidebarMode } = useApp()

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
