'use client'

// components/circle/WelcomeVideoCard.tsx
// "Welcome to the program" video on the Circle home page. One program-level
// video (circle_cohorts.welcome_video_url), shown to every member regardless
// of archetype. Self-contained: owns its modal + watched state.
//
// Behavior:
//   - Auto-pops the video the first time a member enters the program
//     (initiallySeen === false). Closing stamps welcome_video_seen_at.
//   - Before first watch: renders a prominent "Start here" card (thumbnail).
//   - After first watch: collapses to a small "Welcome video" button the
//     member can click to rewatch any time, any week.
//
// Distinct from the per-archetype welcome video (ArchetypeVideoModal), which
// lives on the weekly teaching page.

import { useEffect, useState } from 'react'
import { markWelcomeVideoSeen } from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_DEEP = '#8c6520'
const ORANGE_PALE = '#fdf6f2'

// Direct video files render in <video>; everything else in an <iframe>.
const FILE_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i

interface Props {
  videoUrl: string
  /** member.welcome_video_seen_at != null — controls expanded vs minimized. */
  initiallySeen: boolean
  memberId: string
}

export default function WelcomeVideoCard({ videoUrl, initiallySeen, memberId }: Props) {
  const [seen, setSeen] = useState(initiallySeen)
  // Auto-open the popup on first program entry only.
  const [open, setOpen] = useState(!initiallySeen)

  // ESC closes the modal.
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function handleClose() {
    setOpen(false)
    if (!seen) {
      setSeen(true)
      await markWelcomeVideoSeen(memberId)
    }
  }

  const isFile = FILE_RE.test(videoUrl)

  return (
    <>
      {/* On-page entry: prominent card before first watch, small button after. */}
      {seen ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            alignSelf: 'flex-start',
            padding: '8px 14px', borderRadius: 999,
            background: ORANGE_PALE, border: `1px solid ${ORANGE}`,
            color: ORANGE_DEEP, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 600,
          }}
        >
          <PlayGlyph size={12} />
          Start here · Welcome video
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 16, width: '100%',
            textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
            background: ORANGE_PALE, border: `1px solid ${ORANGE}`,
            borderRadius: 14, padding: '16px 18px',
          }}
        >
          <span style={{
            flexShrink: 0, width: 52, height: 52, borderRadius: 12,
            background: ORANGE, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PlayGlyph size={20} />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: ORANGE_DEEP,
            }}>
              Start here
            </span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 300,
              fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.2,
            }}>
              Welcome to the program
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.4 }}>
              Watch this first — then dive into your week.
            </span>
          </span>
        </button>
      )}

      {/* Popup */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-video-title"
          style={{
            position: 'fixed', inset: 0, zIndex: 130,
            background: 'rgba(12,12,10,0.62)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={handleClose}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 720, width: '100%',
              maxHeight: '92vh', overflow: 'auto',
              background: '#ffffff', borderRadius: 18,
              boxShadow: '0 24px 60px -12px rgba(12,12,10,0.34)',
              padding: '24px 24px 22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: ORANGE,
                  margin: '0 0 6px', fontFamily: 'var(--font-body)',
                }}>
                  Start here
                </p>
                <h2 id="welcome-video-title" style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 26, fontWeight: 300, fontStyle: 'italic',
                  color: 'var(--ink)', margin: 0,
                  letterSpacing: '-0.015em', lineHeight: 1.15,
                }}>
                  Welcome to the program
                </h2>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
                  border: '1px solid var(--line-md)', background: 'transparent',
                  color: 'var(--text-soft)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, lineHeight: 1, fontFamily: 'var(--font-body)',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
              {isFile ? (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  preload="metadata"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              ) : (
                <iframe
                  src={videoUrl}
                  style={{ width: '100%', height: '100%', border: 0 }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Welcome to the program"
                />
              )}
            </div>

            <button
              onClick={handleClose}
              style={{
                width: '100%', marginTop: 16, padding: '13px 20px',
                borderRadius: 10, border: 'none',
                background: ORANGE, color: '#fff',
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Got it — let&apos;s begin →
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function PlayGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="8 5 19 12 8 19 8 5" />
    </svg>
  )
}
