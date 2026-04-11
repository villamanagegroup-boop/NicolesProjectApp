'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 016 0v2" />
    </svg>
  )
}

const navItems = [
  { href: '/dashboard', label: 'The Entry', subtitle: 'Start where you are' },
  { href: '/card', label: 'Daily Alignment', subtitle: 'Meet yourself today' },
  { href: '/past', label: 'The Becoming', subtitle: 'See your evolution' },
  { href: '/journal', label: 'Reflection', subtitle: 'Tell the truth' },
  { href: '/wins', label: 'My Wins', subtitle: 'Victories logged here' },
  { href: '/profile', label: 'Self', subtitle: 'This is who you are becoming' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, dayNumber } = useApp()

  const programUnlocked = user.selectedPath === 'A' && user.hasPaid
  const vaultUnlocked = dayNumber >= 30

  if (!open) return null

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(12,12,10,0.55)',
          zIndex: 200,
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          backgroundColor: 'var(--paper2)',
          borderRight: '1px solid var(--line)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          boxShadow: '4px 0 24px rgba(12,12,10,0.12)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--ink)' }}>
            <span style={{ color: 'var(--gold)' }}>✦</span> Clarity
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text-soft)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                  padding: '12px 20px',
                  background: isActive ? 'var(--green-pale)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--green)' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--green)' : 'var(--ink)',
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--green-dim)' : 'var(--text-muted)',
                }}>
                  {item.subtitle}
                </span>
              </button>
            )
          })}

          {/* Divider */}
          <div style={{ margin: '12px 20px', borderTop: '1px solid var(--line)' }} />
          <div style={{ padding: '0 20px 8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Unlockable
          </div>

          {/* The Work */}
          {programUnlocked ? (
            <button
              onClick={() => navigate('/program')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: pathname.startsWith('/program') ? 'var(--green-pale)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderLeft: pathname.startsWith('/program') ? '3px solid var(--green)' : '3px solid transparent',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>The Work</span>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--green)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>Unlocked</span>
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', opacity: 0.6, cursor: 'not-allowed',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--gold)' }}><LockIcon /></span>
                <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>The Work</span>
              </div>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}>Path A</span>
            </div>
          )}

          {/* Vault */}
          {vaultUnlocked ? (
            <button
              onClick={() => navigate('/vault')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderLeft: '3px solid transparent',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>The Vault</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', opacity: 0.5, cursor: 'not-allowed' }}>
              <span style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>🔒 The Vault</span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>Day 30</span>
            </div>
          )}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => navigate('/journal/new')}
            style={{
              width: '100%',
              backgroundColor: 'var(--green)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            New Journal Entry
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--text-soft)', textAlign: 'left', padding: 0 }}
          >
            Settings
          </button>
          <button
            onClick={() => { onClose(); router.push('/') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--red)', textAlign: 'left', padding: 0 }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
