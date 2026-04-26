'use client'
import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import ProgramSwitcher from './ProgramSwitcher'

interface TopbarProps {
  onMenuOpen?: () => void
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M4.22 15.78l1.06-1.06M14.72 5.28l1.06-1.06" />
    </svg>
  )
}

export default function Topbar({ onMenuOpen }: TopbarProps) {
  const { user, avatarUrl } = useApp()
  const [showNotifications, setShowNotifications] = useState(false)
  const firstInitial = user.name.charAt(0).toUpperCase()
  const photoSrc = avatarUrl ?? null

  return (
    <header
      className="topbar"
      style={{
        height: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(247, 244, 239, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="hamburger-btn"
        onClick={onMenuOpen}
        style={{
          display: 'none', // overridden to flex on mobile via CSS
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          color: 'var(--ink)',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
        }}
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h16M3 11h16M3 16h16" />
        </svg>
      </button>

      {/* Spacer */}
      <div />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Program switcher — shows for anyone with 2+ accessible programs */}
        <ProgramSwitcher />
        {/* Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              color: showNotifications ? 'var(--ink)' : 'var(--text-soft)',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {showNotifications && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setShowNotifications(false)}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 280,
                background: 'white',
                border: '1px solid var(--line-md)',
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(12,12,10,0.08)',
                zIndex: 50,
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 400, color: 'var(--ink)' }}>
                    Notifications
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    All clear
                  </span>
                </div>

                {/* Empty state */}
                <div style={{
                  padding: '32px 18px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🔔</div>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 16,
                    color: 'var(--text-muted)',
                    margin: '0 0 6px',
                  }}>
                    No notifications right now.
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                    We'll let you know when something needs your attention.
                  </p>
                </div>

                {/* Footer */}
                <div style={{
                  padding: '12px 18px',
                  borderTop: '1px solid var(--line)',
                  background: 'var(--paper)',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    Notification settings →
                  </span>
                  <a href="/settings" style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-body)', textDecoration: 'none', marginLeft: 4 }}>
                    Settings
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Gear */}
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--text-soft)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)' }}
          aria-label="Settings"
        >
          <GearIcon />
        </button>

        {/* Separator */}
        <div
          style={{
            width: '1px',
            height: '20px',
            backgroundColor: 'var(--line)',
          }}
        />

        {/* Avatar */}
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green), var(--gold))',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          {photoSrc ? (
            <img src={photoSrc} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, color: 'white', fontSize: '14px' }}>
              {firstInitial}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
