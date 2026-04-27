'use client'

// components/support/ReportBugButton.tsx
// Sidebar-anchored "Report a bug" button. Opens a right-side slide-in panel
// where the user describes what went wrong; submission writes to
// public.support_messages. Visible to all signed-in users.
//
// The panel is portaled to document.body so it escapes the sidebar's
// position:sticky stacking context — otherwise the topbar (which has its
// own sibling sticky context with z-index:30) renders on top of the panel.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { submitSupportMessage } from '@/lib/admin/hooks'

interface Props {
  /** Optional callback so parent surfaces (e.g. mobile drawer) can close
   *  themselves once the panel opens. */
  onOpenChange?: (open: boolean) => void
}

export default function ReportBugButton({ onOpenChange }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false) // controls render after exit anim
  const [hasDocument, setHasDocument] = useState(false) // SSR guard for createPortal
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)

  // Hydration-safe browser check — createPortal needs document, which doesn't
  // exist during SSR. Flipping this on the client triggers a re-render so the
  // portal can mount.
  useEffect(() => { setHasDocument(true) }, [])

  // Slide-in / slide-out animation. Kept in lockstep with `mounted` so the
  // panel stays in the DOM long enough to play the exit transition.
  useEffect(() => {
    onOpenChange?.(open)
    if (open) {
      setMounted(true)
      // Two RAFs: ensure the panel renders at translateX(100%) before we
      // animate it to 0, otherwise the transition gets skipped.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = panelRef.current
          if (!el) return
          el.style.transform = 'translateX(0)'
        })
      })
    } else if (mounted) {
      const el = panelRef.current
      if (el) el.style.transform = 'translateX(100%)'
      const t = setTimeout(() => setMounted(false), 260)
      return () => clearTimeout(t)
    }
  }, [open, onOpenChange, mounted])

  // Lock background scroll while the panel is up.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  function reset() {
    setBody('')
    setError(null)
    setSubmittedAt(null)
  }

  async function handleSubmit() {
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    const result = await submitSupportMessage({
      body: body.trim(),
      page_path: pathname ?? null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    })
    setSubmitting(false)
    if (result?.error) {
      setError(result.error.message)
      return
    }
    setSubmittedAt(new Date())
    setBody('')
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true) }}
        style={{
          background: 'none',
          border: '1px solid var(--line-md)',
          borderRadius: '6px',
          color: 'var(--text-soft)',
          fontSize: '11px',
          fontFamily: 'var(--font-body)',
          padding: '6px 10px',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'center',
          transition: 'color 0.15s ease, border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-muted)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line-md)'
        }}
      >
        🐞 Report a bug
      </button>

      {mounted && hasDocument && createPortal(
        <>
          {/* Opaque-enough backdrop, layered above every sidebar/topbar. */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 9000,
              background: 'rgba(12,12,10,0.55)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              opacity: open ? 1 : 0,
              transition: 'opacity 0.22s ease',
              pointerEvents: open ? 'auto' : 'none',
            }}
          />

          {/* Right-side slide-in panel. Starts off-screen, slides in. */}
          <aside
            ref={panelRef}
            role="dialog"
            aria-label="Report a bug"
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: 'min(440px, 100vw)',
              zIndex: 9001,
              background: '#fff',
              borderLeft: '1px solid var(--line)',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.12)',
              transform: 'translateX(100%)',
              transition: 'transform 0.26s cubic-bezier(0.32, 0, 0.15, 1)',
              willChange: 'transform',
              display: 'flex', flexDirection: 'column',
              fontFamily: 'var(--font-body)',
            }}
          >
            <header style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--paper)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)' }}>
                  Report a bug
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  We&apos;ll read every one. Reply may come through your Coach chat.
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 4,
                }}
              >
                ×
              </button>
            </header>

            <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
              {submittedAt ? (
                <div style={{
                  padding: '20px', borderRadius: 10,
                  background: 'var(--green-pale)',
                  border: '1px solid rgba(31,92,58,0.2)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>Thanks — we got it.</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Submitted at {submittedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
                    <button
                      onClick={() => { reset() }}
                      style={{
                        fontSize: 12, fontWeight: 500,
                        padding: '6px 14px', borderRadius: 6,
                        border: '1px solid var(--line-md)', background: '#fff',
                        color: 'var(--text-soft)', cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Report another
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      style={{
                        fontSize: 12, fontWeight: 500,
                        padding: '6px 14px', borderRadius: 6,
                        border: 'none', background: 'var(--green)', color: '#fff',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label style={{
                    display: 'block', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--text-muted)', marginBottom: 6,
                  }}>
                    What went wrong?
                  </label>
                  <textarea
                    autoFocus
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Walk us through what you were trying to do and what happened instead."
                    rows={8}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: '1px solid var(--line-md)', borderRadius: 8,
                      background: 'var(--paper)',
                      fontFamily: 'inherit', fontSize: 13, color: 'var(--ink)',
                      lineHeight: 1.6, outline: 'none', resize: 'vertical',
                    }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    We&apos;ll attach the page you&apos;re on ({pathname ?? '—'}) automatically.
                  </div>
                  {error && (
                    <p style={{ fontSize: 12, color: 'var(--red)', margin: '8px 0 0' }}>{error}</p>
                  )}
                </>
              )}
            </div>

            {!submittedAt && (
              <footer style={{
                padding: '14px 22px',
                borderTop: '1px solid var(--line)',
                background: 'var(--paper)',
                display: 'flex', justifyContent: 'flex-end', gap: 8,
                flexShrink: 0,
              }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    fontSize: 12, padding: '8px 14px', borderRadius: 6,
                    border: '1px solid var(--line-md)', background: '#fff',
                    color: 'var(--text-soft)', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!body.trim() || submitting}
                  style={{
                    fontSize: 12, fontWeight: 600,
                    padding: '8px 16px', borderRadius: 6,
                    border: 'none',
                    background: 'var(--green)', color: '#fff',
                    cursor: !body.trim() || submitting ? 'not-allowed' : 'pointer',
                    opacity: !body.trim() || submitting ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {submitting ? 'Sending…' : 'Send report'}
                </button>
              </footer>
            )}
          </aside>
        </>,
        document.body,
      )}
    </>
  )
}
