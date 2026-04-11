import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import MobileNav from '@/components/layout/MobileNav'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div className="sidebar">
        <Sidebar />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main
          className="portal-main"
          style={{
            flex: 1,
            padding: '32px 40px',
            width: '100%',
            // No maxWidth — fill the space
          }}
        >
          <div className="fade-in">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
