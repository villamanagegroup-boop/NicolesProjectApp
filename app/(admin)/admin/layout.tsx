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

// Sidebar IA: program-centric. Top-level items + collapsible groups, where
// "Programs" nests one level deeper — each program (Cards / Seal / Circle)
// has People · Curriculum · Messages. Leaves deep-link into shared admin
// pages with a ?path= scope so the destination opens pre-filtered to that
// program. Labels read like English — Nicole isn't a developer.
type NavLeaf = { href: string; icon?: string; label: string; sub?: string }
type NavGroup = { groupKey: string; label: string; icon: string; items: NavEntry[] }
type NavEntry = NavLeaf | NavGroup

function isGroup(e: NavEntry): e is NavGroup {
  return (e as NavGroup).items !== undefined
}

// Does this entry (or any descendant) match the current path? Compares against
// the pathname only (query strings scope the page but don't change the route).
function entryIsActive(e: NavEntry, pathname: string | null): boolean {
  if (isGroup(e)) return e.items.some(i => entryIsActive(i, pathname))
  const base = e.href.split('?')[0]
  return base === '/admin' ? pathname === '/admin' : !!pathname?.startsWith(base)
}

const NAV_ITEMS: NavEntry[] = [
  { href: '/admin', icon: '◎', label: 'Dashboard', sub: 'Overview' },
  {
    groupKey: 'programs', label: 'Programs', icon: '◫',
    items: [
      {
        groupKey: 'prog-cards', label: '365 Cards', icon: '·',
        items: [
          { href: '/admin/users?path=B',   label: 'People',     sub: 'Cards members' },
          { href: '/admin/cards',          label: 'Curriculum', sub: 'The daily deck' },
          { href: '/admin/comms?path=B',   label: 'Messages',   sub: 'Announce + DM' },
        ],
      },
      {
        groupKey: 'prog-seal', label: 'Seal the Leak', icon: '·',
        items: [
          { href: '/admin/users?path=A',          label: 'People',     sub: 'Seal members' },
          { href: '/admin/content?program=seal',  label: 'Curriculum', sub: 'Seal media + program' },
          { href: '/admin/comms?path=A',          label: 'Messages',   sub: 'Announce + DM' },
        ],
      },
      {
        groupKey: 'prog-circle', label: 'The Circle', icon: '·',
        items: [
          { href: '/admin/members',        label: 'People',     sub: 'Cohort members' },
          { href: '/admin/cohorts',        label: 'Cohorts',    sub: 'Create + manage cohorts' },
          { href: '/admin/content',        label: 'Curriculum', sub: '12 weeks + calls' },
          { href: '/admin/comms?path=C',   label: 'Messages',   sub: 'Broadcast + post' },
          { href: '/admin/pairs',          label: 'Pairs',      sub: 'Accountability map' },
        ],
      },
    ],
  },
  { href: '/admin/money',   icon: '$', label: 'Finances', sub: 'Payments by program' },
  { href: '/admin/reports', icon: '⬡', label: 'Reports',  sub: 'Exports + analytics' },
  {
    groupKey: 'tools', label: 'Tools', icon: '⬡',
    items: [
      { href: '/admin/preview', label: 'Preview as user', sub: 'Walk in their shoes' },
      { href: '/admin/sitemap', label: 'Site map',        sub: 'Open any page directly' },
      { href: '/admin/support', label: 'Bug reports',     sub: 'Member-submitted issues' },
      { href: '/admin/audit',   label: 'History',         sub: 'Admin action log' },
    ],
  },
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
  // Which collapsible nav groups are expanded. Auto-expand the group
  // containing the current page on mount so the active page is visible.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  useEffect(() => {
    const next: Record<string, boolean> = {}
    const walk = (entries: NavEntry[]) => {
      for (const e of entries) {
        if (!isGroup(e)) continue
        next[e.groupKey] = entryIsActive(e, pathname)
        walk(e.items)
      }
    }
    walk(NAV_ITEMS)
    setOpenGroups(prev => ({ ...next, ...prev }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch admin name once on mount — it doesn't change during a session.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user || cancelled) return
      const { data: profile } = await supabaseClient
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      const fallback = user.email?.split('@')[0] ?? 'Coach'
      setAdminName(profile?.name?.trim() || fallback)
    })()
    return () => { cancelled = true }
  }, [])

  // Sidebar badge counts: fetch on mount and when the window regains focus.
  // Previously this ran on every navigation (deps: [pathname]), causing
  // a visible "blink" on every admin click while the counts re-fetched.
  useEffect(() => {
    let cancelled = false
    function refreshCounts() {
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
    }
    refreshCounts()
    window.addEventListener('focus', refreshCounts)
    return () => {
      cancelled = true
      window.removeEventListener('focus', refreshCounts)
    }
  }, [])

  // Close the mobile drawer on route change so a tap on a nav link
  // dismisses the overlay before the page swap.
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Walk the nav tree (nested groups + leaves) to find the current page's label.
  const currentLabel = (() => {
    let label = 'Admin'
    const walk = (entries: NavEntry[]) => {
      for (const e of entries) {
        if (isGroup(e)) { walk(e.items); continue }
        const base = e.href.split('?')[0]
        const active = base === '/admin' ? pathname === '/admin' : pathname?.startsWith(base)
        if (active) label = e.label
      }
    }
    walk(NAV_ITEMS)
    return label
  })()

  // Recursive nav renderer — handles arbitrarily nested groups. depth 0 leaves
  // get the full icon+label+sub treatment; nested leaves render compact.
  function renderEntry(entry: NavEntry, depth: number): React.ReactNode {
    if (isGroup(entry)) {
      const expanded = openGroups[entry.groupKey] ?? false
      const groupActive = entryIsActive(entry, pathname)
      return (
        <div key={entry.groupKey} style={{ marginBottom: 2 }}>
          <button
            type="button"
            onClick={() => setOpenGroups(g => ({ ...g, [entry.groupKey]: !expanded }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: depth === 0 ? '9px 10px' : '7px 10px', borderRadius: 8,
              background: groupActive && !expanded ? 'var(--green-pale)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <span style={{
              fontSize: depth === 0 ? 16 : 12, color: groupActive ? 'var(--green)' : 'var(--text-muted)',
              flexShrink: 0, width: 20, textAlign: 'center',
            }}>{entry.icon}</span>
            {sidebarOpen && (
              <>
                <span style={{
                  flex: 1, fontSize: depth === 0 ? 13 : 12.5, fontWeight: groupActive ? 600 : 500,
                  color: groupActive ? 'var(--ink)' : 'var(--text-soft)',
                }}>{entry.label}</span>
                <span style={{
                  fontSize: 10, color: 'var(--text-muted)',
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .15s',
                }}>▶</span>
              </>
            )}
          </button>
          {sidebarOpen && expanded && (
            <div style={{ marginLeft: 14, paddingLeft: 8, borderLeft: '1px solid var(--line)' }}>
              {entry.items.map(i => renderEntry(i, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    const item = entry
    const base = item.href.split('?')[0]
    const isActive = base === '/admin' ? pathname === '/admin' : pathname?.startsWith(base)
    const showAlertBadge   = base === '/admin/members'
    const showSupportBadge = base === '/admin/support'

    const badges = (
      <>
        {showAlertBadge && alertCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--red-pale)', color: 'var(--red)', padding: '1px 6px', borderRadius: 10 }}>{alertCount}</span>
        )}
        {showSupportBadge && supportCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--gold-pale)', color: 'var(--gold)', padding: '1px 6px', borderRadius: 10, border: '1px solid var(--gold-line)' }}>{supportCount}</span>
        )}
      </>
    )

    // Nested (depth > 0) leaf — compact.
    if (depth > 0) {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 6,
            textDecoration: 'none', fontSize: 12, fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--ink)' : 'var(--text-soft)',
            background: isActive ? 'var(--green-pale)' : 'transparent',
          }}
        >
          <span>{item.label}</span>
          {badges}
        </Link>
      )
    }

    // Top-level leaf — full treatment.
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 8, marginBottom: 2, textDecoration: 'none',
          background: isActive ? 'var(--green-pale)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
          transition: 'all .15s',
        }}
      >
        <span style={{ fontSize: 16, color: isActive ? 'var(--green)' : 'var(--text-muted)', flexShrink: 0, width: 20, textAlign: 'center' }}>{item.icon}</span>
        {sidebarOpen && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? 'var(--ink)' : 'var(--text-soft)', whiteSpace: 'nowrap' }}>{item.label}</span>
              {badges}
            </div>
            {item.sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>}
          </div>
        )}
      </Link>
    )
  }

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
          {NAV_ITEMS.map(entry => renderEntry(entry, 0))}
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
