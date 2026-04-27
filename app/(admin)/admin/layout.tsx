// app/(admin)/admin/layout.tsx
// Admin panel shell — dark sidebar + nav. Route-level access is enforced
// in proxy.ts (only users with a row in admin_roles can reach /admin/*).
//
// Responsive behavior is in globals.css under the .admin-* classes:
// desktop renders the sidebar inline; mobile slides it in from the left
// behind a hamburger + backdrop.

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/supabase/auth'
import RoleBadge from '@/components/layout/RoleBadge'

const NAV_ITEMS = [
  { href: '/admin',         icon: '◎', label: 'Overview', sub: 'Dashboard' },
  { href: '/admin/cohorts', icon: '⬡', label: 'Cohorts',  sub: 'Manage programs' },
  { href: '/admin/users',   icon: '⬡', label: 'Users',    sub: 'All paths · 365 + Seal + Circle' },
  { href: '/admin/members', icon: '⬡', label: 'Members',  sub: 'Cohort roster + profiles' },
  { href: '/admin/pairs',   icon: '⬡', label: 'Pairs',    sub: 'Accountability map' },
  { href: '/admin/cards',   icon: '⬡', label: 'Daily cards', sub: 'Edit the 365 deck' },
  { href: '/admin/content', icon: '⬡', label: 'Content',  sub: 'Curriculum + calls' },
  { href: '/admin/comms',   icon: '⬡', label: 'Messages', sub: 'Announce + DM' },
  { href: '/admin/preview', icon: '⬡', label: 'View as',  sub: 'Preview the user portal' },
  { href: '/admin/revenue', icon: '⬡', label: 'Revenue',  sub: 'Tracking + access' },
  { href: '/admin/support', icon: '⬡', label: 'Support',  sub: 'Bug reports + help' },
]

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h16M3 11h16M3 16h16" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [adminName, setAdminName] = useState<string>('Coach')
  const [alertCount, setAlertCount] = useState(0)
  const [supportCount, setSupportCount] = useState(0)
  // Desktop: collapse the sidebar to icon-only
  const [sidebarOpen, setSidebarOpen] = useState(true)
  // Mobile: show/hide the slide-in drawer
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user || cancelled) return
      // Prefer the saved name from public.users; fall back to email prefix
      // so empty saved names don't blank the avatar / label.
      const { data: profile } = await supabaseClient
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      const fallback = user.email?.split('@')[0] ?? 'Coach'
      setAdminName(profile?.name?.trim() || fallback)
    })()

    supabaseClient
      .from('circle_engagement_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false)
      .then(({ count }) => { if (!cancelled) setAlertCount(count ?? 0) })

    supabaseClient
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'resolved')
      .then(({ count }) => { if (!cancelled) setSupportCount(count ?? 0) })

    return () => { cancelled = true }
  }, [pathname])

  // Close the mobile drawer on route change so a tap on a nav link
  // dismisses the overlay before the page swap.
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const currentLabel = NAV_ITEMS.find(i => i.href === '/admin'
    ? pathname === '/admin'
    : pathname?.startsWith(i.href))?.label ?? 'Admin'

  return (
    <div
      className="admin-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--paper)',
        fontFamily: 'var(--font-body)',
        color: 'var(--ink)',
      }}
    >
      {/* Mobile topbar — visible only on small screens */}
      <header
        className="admin-mobile-topbar"
        style={{
          display: 'none',  // overridden to flex on mobile via CSS
          position: 'sticky', top: 0, zIndex: 40,
          height: '56px', padding: '0 16px',
          background: '#ffffff', borderBottom: '1px solid var(--line)',
          alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink)', padding: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <HamburgerIcon />
        </button>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
          {currentLabel}
        </div>
        <div style={{ width: 32 }} />
      </header>

      {/* Backdrop — visible only when mobile drawer is open */}
      {mobileOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(12,12,10,0.4)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${mobileOpen ? 'admin-sidebar-open' : ''}`}
        style={{
          width: sidebarOpen ? '220px' : '64px',
          minHeight: '100vh',
          background: '#ffffff',
          borderRight: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width .2s ease, transform .2s ease',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          zIndex: 70,
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--green), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>◎</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
                The Circle
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                Admin
              </div>
            </div>
          )}
          <button
            onClick={() => {
              // On mobile this button doubles as the close-drawer control.
              if (mobileOpen) setMobileOpen(false)
              else setSidebarOpen(o => !o)
            }}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', flexShrink: 0,
            }}
          >
            {mobileOpen ? '×' : sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname?.startsWith(item.href)
            const showAlertBadge   = item.href === '/admin/members'
            const showSupportBadge = item.href === '/admin/support'

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  textDecoration: 'none',
                  background: isActive ? 'var(--green-pale)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                  transition: 'all .15s',
                }}
              >
                <span style={{
                  fontSize: '16px',
                  color: isActive ? 'var(--green)' : 'var(--text-muted)',
                  flexShrink: 0, width: '20px', textAlign: 'center',
                }}>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--ink)' : 'var(--text-soft)',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.label}
                      </span>
                      {showAlertBadge && alertCount > 0 && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          background: 'var(--red-pale)', color: 'var(--red)',
                          padding: '1px 6px', borderRadius: '10px',
                        }}>
                          {alertCount}
                        </span>
                      )}
                      {showSupportBadge && supportCount > 0 && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          background: 'var(--gold-pale)', color: 'var(--gold)',
                          padding: '1px 6px', borderRadius: '10px',
                          border: '1px solid var(--gold-line)',
                        }}>
                          {supportCount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {item.sub}
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom — settings + admin user + member-app shortcut + sign out */}
        {sidebarOpen && (
          <div style={{ padding: '12px 16px 14px', borderTop: '1px solid var(--line)' }}>
            <Link
              href="/admin/settings"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 4px', marginBottom: '10px',
                fontSize: '12px', color: pathname === '/admin/settings' ? 'var(--gold)' : 'var(--text-soft)',
                fontFamily: 'var(--font-body)', fontWeight: pathname === '/admin/settings' ? 600 : 500,
                textDecoration: 'none',
              }}
            >
              <GearIcon />
              Settings
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--green), var(--green-dim))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#fff',
              }}>
                {adminName.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>{adminName}</div>
                <RoleBadge role="admin" />
              </div>
            </div>
            <Link
              href="/circle"
              style={{
                display: 'block', textAlign: 'center', padding: '6px 8px',
                background: 'var(--green-pale)', color: 'var(--green)', borderRadius: '6px',
                fontSize: '11px', fontWeight: 600, textDecoration: 'none', marginBottom: '6px',
                border: '1px solid rgba(31,92,58,0.2)',
              }}
            >
              Open user portal →
            </Link>
            <button
              onClick={async () => { await signOut(); router.push('/') }}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'inherit', padding: '4px',
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="admin-main" style={{ flex: 1, overflow: 'auto', padding: '28px 32px', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}
