'use client'

// components/layout/Sidebar.tsx
// Unified portal sidebar. Renders one section per program the user has
// access to (Seal the Leak / 365 Cards / The Circle), plus a shared
// "My journey" block (journal, wins, profile) and an upsell list at the
// bottom for any programs they don't yet own.
//
// Replaces the older Sidebar + SidebarWork + SidebarCircle trio. The
// portal layout no longer needs to swap sidebars based on the route.

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { signOut } from '@/lib/supabase/auth'
import AdminPortalLink from './AdminPortalLink'
import ReportBugButton from '@/components/support/ReportBugButton'

// ── Per-program palette ──────────────────────────────────────────────────────
// Kept consistent with the legacy section sidebars so existing screens still
// feel "right" — Nicole picked these.
const SEAL   = { fg: '#3D3080', pale: 'rgba(61,48,128,0.08)',  hover: 'rgba(61,48,128,0.04)' } // Path A
const CARDS  = { fg: '#1A5230', pale: 'rgba(26,82,48,0.07)',   hover: 'rgba(26,82,48,0.04)'  } // Path B
const CIRCLE = { fg: '#C97D3A', pale: 'rgba(201,125,58,0.08)', hover: 'rgba(201,125,58,0.04)'} // Path C

// ── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  href: string
  label: string
  exact?: boolean
}

interface ProgramSection {
  key: 'seal' | 'cards' | 'circle' | 'journey'
  title: string
  subtitle: string
  icon: string
  palette: { fg: string; pale: string; hover: string }
  items: NavItem[]
}

// ── Section definitions ──────────────────────────────────────────────────────
const SEAL_SECTION: ProgramSection = {
  key: 'seal',
  title: 'Seal the Leak',
  subtitle: '7-day reset',
  icon: '✦',
  palette: SEAL,
  items: [
    { href: '/program',             label: 'The Work',          exact: true },
    { href: '/program/today',       label: "Today's session",   exact: true },
    { href: '/program/reflections', label: 'Daily journal',     exact: true },
    { href: '/program/progress',    label: 'My progress',       exact: true },
  ],
}

const CARDS_SECTION_BASE: Omit<ProgramSection, 'items'> = {
  key: 'cards',
  title: '365 Cards',
  subtitle: 'Daily alignment',
  icon: '◇',
  palette: CARDS,
}

const CIRCLE_SECTION: ProgramSection = {
  key: 'circle',
  title: 'The Circle',
  subtitle: '90-day cohort',
  icon: '○',
  palette: CIRCLE,
  items: [
    { href: '/circle',           label: 'Your Circle',  exact: true },
    { href: '/circle/community', label: 'Community',    exact: true },
    { href: '/circle/partner',   label: 'Partner',      exact: true },
    { href: '/circle/calls',     label: 'Live streams', exact: true },
  ],
}

const JOURNEY_SECTION: ProgramSection = {
  key: 'journey',
  title: 'My journey',
  subtitle: '',
  icon: '·',
  palette: { fg: 'var(--ink)', pale: 'rgba(0,0,0,0.04)', hover: 'rgba(0,0,0,0.02)' },
  items: [
    { href: '/dashboard', label: 'Home',     exact: true },
    { href: '/journal',   label: 'Journal' },
    { href: '/wins',      label: 'My wins',  exact: true },
    { href: '/profile',   label: 'Profile',  exact: true },
  ],
}

function isActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

function isSectionActive(items: NavItem[], pathname: string): boolean {
  return items.some(it => isActive(it.href, pathname, it.exact))
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname() ?? ''
  const router   = useRouter()
  const { user, dayNumber, hasWorkAccess, hasCardsAccess, hasCircleAccess } = useApp()

  const vaultUnlocked = dayNumber >= 30

  // Build the cards section dynamically so the Vault item can show its
  // unlock status inline.
  const cardsSection: ProgramSection = {
    ...CARDS_SECTION_BASE,
    items: [
      { href: '/dashboard', label: "Today's home",  exact: true },
      { href: '/card',      label: "Today's card",  exact: true },
      { href: '/past',      label: 'Past cards',    exact: true },
      ...(vaultUnlocked
        ? [{ href: '/vault', label: 'The Vault', exact: true }]
        : []),
    ],
  }

  // Which sections to show — based on access flags from AppContext.
  // A user can be in multiple programs (e.g. Path A with cards add-on),
  // so multiple of these can be true at once.
  const sections: ProgramSection[] = []
  if (hasWorkAccess)   sections.push(SEAL_SECTION)
  if (hasCardsAccess)  sections.push(cardsSection)
  if (hasCircleAccess) sections.push(CIRCLE_SECTION)

  // Locked programs (for the upsell block at the bottom).
  type Upsell = { label: string; price: string; href: string; palette: typeof SEAL }
  const upsells: Upsell[] = []
  if (!hasWorkAccess)   upsells.push({ label: 'Seal the Leak', price: '$27',     href: '/upgrade?path=A', palette: SEAL })
  if (!hasCardsAccess)  upsells.push({ label: '365 Cards',     price: '$9/mo',   href: '/upgrade?path=B', palette: CARDS })
  if (!hasCircleAccess) upsells.push({ label: 'The Circle',    price: '$497',    href: '/upgrade?path=C', palette: CIRCLE })

  return (
    <aside style={{
      width: 'var(--sidebar)', minWidth: 'var(--sidebar)',
      height: '100vh', position: 'sticky', top: 0,
      backgroundColor: '#fbfaf7',
      borderRight: '1px solid var(--line)',
      padding: '24px 0 0',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Wordmark */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500,
          color: 'var(--ink)',
        }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
        </div>
        <p style={{
          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
          margin: '4px 0 0',
        }}>
          {sections.length === 1 ? sections[0].subtitle : 'The Energy Leader'}
        </p>
      </div>

      {/* Nav body */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {/* Home / journey shared section first */}
        <SectionBlock
          section={JOURNEY_SECTION}
          pathname={pathname}
          showHeader={false}
        />

        {/* Program sections — one per program the user owns */}
        {sections.map(sec => (
          <SectionBlock
            key={sec.key}
            section={sec}
            pathname={pathname}
            showHeader
          />
        ))}

        {/* Upsell — programs the user doesn't yet own */}
        {upsells.length > 0 && !user.isAdmin && (
          <div style={{
            margin: '20px 12px 0',
            padding: '14px 12px',
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: 10,
          }}>
            <p style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--text-muted)', margin: '0 0 10px',
              fontFamily: 'var(--font-body)', fontWeight: 600,
            }}>
              Add to your journey
            </p>
            {upsells.map(u => (
              <Link
                key={u.label}
                href={u.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 4px', textDecoration: 'none',
                  fontSize: 12, color: 'var(--text-soft)',
                }}
              >
                <span style={{ color: u.palette.fg, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>+</span>
                <span style={{ flex: 1 }}>{u.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.price}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom — settings + admin shortcut + sign out */}
      <div style={{
        padding: '16px 20px 18px',
        borderTop: '1px solid var(--line)',
        marginTop: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <Link
          href="/settings"
          style={{
            textDecoration: 'none',
            fontSize: 12, color: 'var(--text-soft)',
            fontFamily: 'var(--font-body)',
            padding: '4px 0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <GearIcon /> Settings
        </Link>

        <AdminPortalLink />

        <button
          onClick={async () => { await signOut(); router.push('/') }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '4px 0', textAlign: 'left',
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Sign out
        </button>

        <ReportBugButton />
      </div>
    </aside>
  )
}

// ── Section ──────────────────────────────────────────────────────────────────
function SectionBlock({
  section, pathname, showHeader,
}: {
  section: ProgramSection
  pathname: string
  showHeader: boolean
}) {
  const sectionActive = isSectionActive(section.items, pathname)

  return (
    <div style={{ marginBottom: 12 }}>
      {showHeader && (
        <div style={{
          padding: '12px 12px 4px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            color: section.palette.fg,
            fontSize: 14, lineHeight: 1, flexShrink: 0,
            opacity: sectionActive ? 1 : 0.7,
          }}>
            {section.icon}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: sectionActive ? section.palette.fg : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.3,
            }}>
              {section.title}
            </div>
            {section.subtitle && (
              <div style={{
                fontSize: 9, color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                marginTop: 1, lineHeight: 1.3,
              }}>
                {section.subtitle}
              </div>
            )}
          </div>
        </div>
      )}

      {section.items.map(item => {
        const active = isActive(item.href, pathname, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 7,
                margin: '1px 4px',
                backgroundColor: active ? section.palette.pale : 'transparent',
                color: active ? section.palette.fg : 'var(--text-soft)',
                cursor: 'pointer',
                transition: 'background-color 0.15s, color 0.15s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = section.palette.hover
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
              }}
            >
              <span style={{
                width: 4, height: 4, borderRadius: '50%',
                background: active ? section.palette.fg : 'transparent',
                border: active ? 'none' : '1px solid var(--line-md)',
                flexShrink: 0, marginLeft: showHeader ? 12 : 0,
              }} />
              <span style={{
                fontSize: 13, fontWeight: active ? 600 : 500,
                lineHeight: 1.2,
              }}>
                {item.label}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
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
