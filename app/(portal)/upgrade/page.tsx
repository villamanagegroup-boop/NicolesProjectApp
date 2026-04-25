'use client'
import { useApp } from '@/context/AppContext'
import { PATHS, PATH_ORDER, type PathId } from '@/data/paths'

const STRIPE_PATH_A = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? ''
const STRIPE_PATH_B = process.env.NEXT_PUBLIC_STRIPE_PATH_B_LINK ?? ''
const STRIPE_PATH_C = process.env.NEXT_PUBLIC_STRIPE_PATH_C_LINK ?? ''

function stripeLinkFor(id: PathId): string {
  if (id === 'A') return STRIPE_PATH_A
  if (id === 'B') return STRIPE_PATH_B
  return STRIPE_PATH_C
}

export default function UpgradePage() {
  const { user } = useApp()
  const owned: PathId | null = user.selectedPath
  const available = PATH_ORDER.filter((id) => id !== owned)

  function startUpgrade(id: PathId) {
    const link = stripeLinkFor(id)
    if (link) {
      window.location.href = link
    } else {
      alert(`Stripe checkout for ${PATHS[id].title} — coming soon.`)
    }
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--green)',
          margin: '0 0 10px',
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
        }}>
          Expand your journey
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          fontWeight: 300,
          color: 'var(--ink)',
          margin: '0 0 10px',
          lineHeight: 1.15,
        }}>
          Add another path.
        </h1>
        <p style={{
          fontSize: 14,
          color: 'var(--text-soft)',
          fontFamily: 'var(--font-body)',
          margin: 0,
          lineHeight: 1.7,
          maxWidth: 560,
        }}>
          {owned
            ? `You're on ${PATHS[owned].title}. Here's what's still available — pick the next step when you're ready.`
            : "Pick a path to begin."}
        </p>
      </div>

      {available.length === 0 ? (
        <div style={{
          padding: 32,
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-soft)',
          fontSize: 14,
        }}>
          You&apos;re in every path already. Nothing more to add.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {available.map((pathId) => {
            const p = PATHS[pathId]
            return (
              <div
                key={pathId}
                style={{
                  background: 'white',
                  border: '1px solid var(--line-md)',
                  borderRadius: 14,
                  padding: '24px 22px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 3, background: p.accent, borderRadius: '14px 14px 0 0',
                }} />

                <span style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: p.accent,
                  fontWeight: 600,
                }}>
                  {p.tierLabel}
                </span>

                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 400,
                  color: 'var(--ink)',
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {p.icon} {p.title}
                </h3>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 26,
                    fontWeight: 400,
                    color: 'var(--ink)',
                  }}>
                    {p.price}
                  </span>
                  {p.priceNote && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      {p.priceNote}
                    </p>
                  )}
                </div>

                <p style={{
                  fontSize: 12,
                  color: 'var(--text-soft)',
                  margin: 0,
                  lineHeight: 1.65,
                  flex: 1,
                }}>
                  {p.description}
                </p>

                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.includes.map((item) => (
                    <li key={item} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: 12,
                      color: 'var(--ink)',
                    }}>
                      <span style={{ color: p.accent, flexShrink: 0, fontWeight: 600 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => startUpgrade(pathId)}
                  style={{
                    marginTop: 8,
                    padding: '11px 16px',
                    background: p.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                  }}
                >
                  {p.billing === 'call' ? 'Book a discovery call →' : `Upgrade — ${p.price} →`}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
