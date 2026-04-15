'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/context/AppContext'

const cardsNavItems: { href: string; label: string; exact?: boolean; icon: (active: boolean) => React.ReactElement }[] = [
  {
    href: '/dashboard',
    label: 'The Entry',
    exact: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--green)' : 'none'} stroke={active ? 'var(--green)' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  {
    href: '/card',
    label: 'Daily Alignment',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--green)' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    )
  },
  {
    href: '/past',
    label: 'The Becoming',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--green)' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
      </svg>
    )
  },
  {
    href: '/journal',
    label: 'Reflection',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--green)' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    )
  },
  {
    href: '/profile',
    label: 'Self',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--green)' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
]

const workNavItems: { href: string; label: string; exact?: boolean; icon: (active: boolean) => React.ReactElement }[] = [
  {
    href: '/program',
    label: 'The Work',
    exact: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3D3080' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    href: '/program/today',
    label: "Today",
    exact: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3D3080' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2s-5 3.5-5 7.5C3 14 5.5 16.5 8 16.5c1.5 2 0 4.5-1 5.5 2-1 5.5-3.5 5.5-7.5C12.5 10 10.5 7.5 8 7.5c1-1 1.5-3.5 0-5.5z"/>
      </svg>
    )
  },
  {
    href: '/journal',
    label: 'Reflection',
    exact: false,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3D3080' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    )
  },
  {
    href: '/program/progress',
    label: 'Progress',
    exact: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3D3080' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  },
  {
    href: '/profile',
    label: 'Self',
    exact: true,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3D3080' : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { sidebarMode } = useApp()

  const PURPLE = '#3D3080'
  const isWork = sidebarMode === 'work'
  const items  = isWork ? workNavItems : cardsNavItems
  const dotColor = isWork ? PURPLE : 'var(--green)'

  return (
    <nav
      className="mobile-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
            }}
            aria-label={item.label}
          >
            {item.icon(active)}
            {active && (
              <div style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: dotColor,
                marginTop: 3,
              }} />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
