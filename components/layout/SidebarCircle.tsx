'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase/auth'
import AdminPortalLink from './AdminPortalLink'

// Pale orange accent — distinguishes Circle from cards (green) and work (purple).
const ORANGE      = '#C97D3A'
const ORANGE_PALE = 'rgba(201,125,58,0.08)'
const ORANGE_DIM  = 'rgba(201,125,58,0.55)'

// ── Icons ────────────────────────────────────────────────────────────────────
function CircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  )
}

function CommunityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2" />
      <circle cx="11" cy="6" r="2" />
      <path d="M2 14c0-2 1.5-3 3-3s3 1 3 3" />
      <path d="M8 14c0-2 1.5-3 3-3s3 1 3 3" />
    </svg>
  )
}

function PartnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12V6a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-4 2z" />
    </svg>
  )
}

function CallsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h10v7H8l-3 3v-3H3V3z" />
    </svg>
  )
}

function CoachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1l5 2v5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V3l5-2z" />
      <path d="M6 8h4M8 6v4" />
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

interface NavItem {
  href: string
  icon: React.ComponentType
  label: string
  subtitle: string
  exact?: boolean
}

const circleNavItems: NavItem[] = [
  { href: '/circle',           icon: CircleIcon,    label: 'Your Circle',    subtitle: 'Week + progress',         exact: true },
  { href: '/circle/community', icon: CommunityIcon, label: 'Community',      subtitle: 'Wins + conversations',    exact: true },
  { href: '/circle/partner',   icon: PartnerIcon,   label: 'Partner',        subtitle: 'Accountability thread',   exact: true },
  { href: '/circle/coach',     icon: CoachIcon,     label: 'Coach chat',     subtitle: 'Direct line to your coach', exact: true },
  { href: '/circle/calls',     icon: CallsIcon,     label: 'Live Streams',   subtitle: 'Schedule + recordings',   exact: true },
]

function isItemActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export default function SidebarCircle() {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <aside
      style={{
        width: 'var(--sidebar)',
        minWidth: 'var(--sidebar)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#fdf6f2',
        borderRight: '1px solid var(--line)',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Wordmark */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 500,
          color: 'var(--ink)',
        }}>
          <span style={{ color: ORANGE }}>✦</span> The Circle
        </div>
        <p style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          margin: '4px 0 0 0',
        }}>
          90-Day Cohort
        </p>
        <div style={{ borderTop: '1px solid var(--line)', marginTop: '16px', marginBottom: '8px' }} />
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1 }}>
        {circleNavItems.map((item) => {
          const active = isItemActive(item.href, pathname, item.exact)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  margin: '1px 8px',
                  backgroundColor: active ? ORANGE_PALE : 'transparent',
                  color: active ? ORANGE : 'var(--text-soft)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(201,125,58,0.04)'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                <span style={{ flexShrink: 0 }}><Icon /></span>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.2,
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: active ? ORANGE_DIM : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.3,
                    marginTop: '2px',
                  }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

      </nav>

      {/* Bottom — Settings + Sign Out */}
      <div style={{ padding: '12px 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Admin shortcut — only renders when the user is in admin_roles */}
        <AdminPortalLink />

        <Link
          href="/settings"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 4px',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-soft)',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-soft)' }}
        >
          <GearIcon />
          Settings
        </Link>

        <button
          onClick={async () => { await signOut(); router.push('/') }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '0',
            textAlign: 'left',
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--red)' }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
