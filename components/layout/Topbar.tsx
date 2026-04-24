'use client'
import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { PATHS, type PathId } from '@/data/paths'

interface TopbarProps {
  onMenuOpen?: () => void
}

function ViewAsDropdown() {
  const { user, viewAsPath, setViewAsPath } = useApp()
  const [open, setOpen] = useState(false)
  if (!user.isAdmin) return null

  const currentLabel = viewAsPath ? `Viewing as Path ${viewAsPath}` : 'Admin view'
  const isPreviewing = viewAsPath !== null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Admin — preview the app as a user of any path"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          borderRadius: 6,
          border: `1px solid ${isPreviewing ? '#C97D3A' : 'var(--line-md)'}`,
          background: isPreviewing ? 'rgba(201,125,58,0.08)' : 'white',
          color: isPreviewing ? '#7A5800' : 'var(--text-soft)',
          fontSize: 11,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
        </svg>
        {currentLabel}
        <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 220,
            background: 'white',
            border: '1px solid var(--line-md)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(12,12,10,0.08)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 12px',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              background: 'var(--paper)',
              borderBottom: '1px solid var(--line)',
            }}>
              Preview app as
            </div>
            <DropdownItem
              label="Admin view"
              sub="Full access + no flow guard"
              active={viewAsPath === null}
              onClick={() => { setViewAsPath(null); setOpen(false) }}
            />
            {(['A','B','C'] as PathId[]).map(pathId => {
              const p = PATHS[pathId]
              return (
                <DropdownItem
                  key={pathId}
                  label={`${p.icon} ${p.title}`}
                  sub={`Tier ${p.tier} — Path ${pathId}`}
                  active={viewAsPath === pathId}
                  onClick={() => { setViewAsPath(pathId); setOpen(false) }}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function DropdownItem({ label, sub, active, onClick }: {
  label: string; sub: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '10px 14px',
        background: active ? 'rgba(201,125,58,0.08)' : 'white',
        border: 'none',
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper)' }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
    >
      <div style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: active ? '#7A5800' : 'var(--ink)' }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
    </button>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2a6 6 0 016 6v3l1.5 2.5H2.5L4 11V8a6 6 0 016-6z" />
      <path d="M8 16a2 2 0 004 0" />
    </svg>
  )
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
        {/* Admin: view-as dropdown (renders nothing for non-admins) */}
        <ViewAsDropdown />
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
