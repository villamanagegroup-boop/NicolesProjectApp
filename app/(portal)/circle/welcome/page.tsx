'use client'

// app/(portal)/circle/welcome/page.tsx
// Three-screen onboarding tour for first-time Circle members.
//
//   1. Welcome — name, archetype, their 90-day intention
//   2. Partner intro — pre-written first message they can send in one tap
//   3. Enter the program — Week 1 CTA; stamps onboarded_at so this tour
//      never shows again
//
// Gated by /circle/page.tsx: arrives here when member.onboarded_at is null.
// Once the user clicks the final CTA, markCircleOnboarded fires and they
// land in Week 1.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import {
  getMyCircleMember,
  getMyPartner,
  sendPartnerMessage,
  markCircleOnboarded,
  type CircleMember,
} from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_DEEP = '#8c6520'
const ORANGE_PALE = '#fdf6f2'
const GREEN       = '#1F5C3A'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

type PartnerData = {
  id: string
  archetype: string
  goal_90day: string | null
  users: { name: string | null } | null
}

export default function CircleWelcomeTourPage() {
  const router = useRouter()
  const { loading, isAuthed, user } = useApp()

  const [member,  setMember]  = useState<CircleMember | null>(null)
  const [partner, setPartner] = useState<PartnerData | null>(null)
  const [partnerUserId, setPartnerUserId] = useState<string>('')
  const [cohortId, setCohortId] = useState<string>('')
  const [hydrating, setHydrating] = useState(true)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [sending, setSending] = useState(false)
  const [messageSent, setMessageSent] = useState(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }
    if (user.selectedPath !== 'C' && !user.isAdmin) { router.replace('/dashboard'); return }

    (async () => {
      const m = await getMyCircleMember()
      if (!m) { router.replace('/circle'); return }

      // Already onboarded → bypass the tour. Admins always get to preview.
      if (m.onboarded_at && !user.isAdmin) { router.replace('/circle'); return }

      setMember(m)
      setCohortId(m.cohort_id)

      if (m.partner_id) {
        const p = await getMyPartner(m.partner_id) as unknown as PartnerData | null
        if (p) setPartner(p)

        const { data: pm } = await supabaseClient
          .from('circle_members')
          .select('user_id')
          .eq('id', m.partner_id)
          .maybeSingle()
        if (pm) setPartnerUserId(pm.user_id as string)
      }

      setHydrating(false)
    })()
  }, [loading, isAuthed, user.selectedPath, user.isAdmin, router])

  const firstName = user.name?.split(' ')[0] ?? 'there'
  const myArchetypeLabel = member ? ARCHETYPE_LABELS[member.archetype] : ''
  const partnerName = partner?.users?.name ?? null
  const partnerFirstName = partnerName?.split(/\s+/)[0] ?? null
  const myGoal = member?.goal_90day ?? ''

  // Pre-written first message — keeps the introduction warm without
  // requiring the user to compose anything in their first minute.
  const draftMessage = partnerFirstName && member
    ? `Hi ${partnerFirstName} — I'm ${firstName}, ${myArchetypeLabel}. ${myGoal ? `My focus this 90 days is: ${myGoal}. ` : ''}Looking forward to doing this with you.`
    : ''

  async function handleSendAndAdvance() {
    if (!partnerUserId || !cohortId || !draftMessage) {
      // No partner paired yet — just advance to step 3.
      setStep(3)
      return
    }
    setSending(true)
    const ok = await sendPartnerMessage(partnerUserId, cohortId, draftMessage)
    setSending(false)
    if (ok) setMessageSent(true)
    setStep(3)
  }

  async function handleFinish() {
    if (!member) return
    setFinishing(true)
    await markCircleOnboarded(member.id)
    router.replace('/circle/week/1')
  }

  if (loading || hydrating || !member) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '24px 0 80px' }}>

      {/* Stepper */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 32,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
      }}>
        {([1, 2, 3] as const).map((n, i) => (
          <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: n <= step ? ORANGE : 'transparent',
              color: n <= step ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${n <= step ? ORANGE : 'var(--line-md)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>
              {n < step ? '✓' : n}
            </span>
            {i < 2 && <span style={{ width: 16, height: 1, background: 'var(--line-md)' }} />}
          </span>
        ))}
        <span style={{ marginLeft: 8 }}>Step {step} of 3</span>
      </div>

      {/* ── Screen 1 ── */}
      {step === 1 && (
        <section>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: ORANGE,
            margin: '0 0 12px', fontFamily: 'var(--font-body)',
          }}>
            Welcome to The Circle
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38, fontWeight: 300, fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 24px', lineHeight: 1.1, letterSpacing: '-0.015em',
          }}>
            You&apos;re in, {firstName}.
          </h1>

          <div style={{
            background: `linear-gradient(135deg, ${ORANGE_PALE} 0%, #fff 75%)`,
            border: '1px solid var(--line)',
            borderLeft: `3px solid ${ORANGE}`,
            borderRadius: 10,
            padding: '22px 24px',
            marginBottom: 16,
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: ORANGE,
              margin: '0 0 6px', fontFamily: 'var(--font-body)',
            }}>
              Your archetype
            </p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 30, fontWeight: 400,
              color: 'var(--ink)', margin: 0, lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}>
              {myArchetypeLabel}
            </p>
          </div>

          {myGoal && (
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '18px 20px',
              marginBottom: 28,
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                margin: '0 0 8px', fontFamily: 'var(--font-body)',
              }}>
                Your 90-day intention
              </p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, fontStyle: 'italic', fontWeight: 300,
                color: 'var(--ink)', margin: 0, lineHeight: 1.5,
              }}>
                &ldquo;{myGoal}&rdquo;
              </p>
            </div>
          )}

          <PrimaryButton onClick={() => setStep(2)}>
            Meet your accountability partner →
          </PrimaryButton>
        </section>
      )}

      {/* ── Screen 2 ── */}
      {step === 2 && (
        <section>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: ORANGE,
            margin: '0 0 12px', fontFamily: 'var(--font-body)',
          }}>
            Your accountability partner
          </p>

          {!partner ? (
            <>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30, fontWeight: 300, fontStyle: 'italic',
                color: 'var(--ink)',
                margin: '0 0 18px', lineHeight: 1.2, letterSpacing: '-0.015em',
              }}>
                Pairing happens once the cohort fills.
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.65, margin: '0 0 28px' }}>
                You&apos;ll be matched with someone whose archetype, attachment style,
                and 90-day focus pair well with yours. We&apos;ll send you their intro the
                moment your match is ready — usually within a day or two of the cohort
                opening.
              </p>
              <PrimaryButton onClick={() => setStep(3)}>
                Continue →
              </PrimaryButton>
            </>
          ) : (
            <>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32, fontWeight: 300,
                color: 'var(--ink)',
                margin: '0 0 6px', lineHeight: 1.15, letterSpacing: '-0.015em',
              }}>
                Meet {partnerName}.
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 22px', letterSpacing: '0.03em' }}>
                {ARCHETYPE_LABELS[partner.archetype] ?? partner.archetype}
              </p>

              {partner.goal_90day && (
                <div style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  padding: '16px 20px',
                  marginBottom: 22,
                }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                    margin: '0 0 6px', fontFamily: 'var(--font-body)',
                  }}>
                    Their 90-day focus
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16, fontStyle: 'italic', fontWeight: 300,
                    color: 'var(--ink)', margin: 0, lineHeight: 1.55,
                  }}>
                    &ldquo;{partner.goal_90day}&rdquo;
                  </p>
                </div>
              )}

              <div style={{
                background: ORANGE_PALE,
                border: `1px solid ${ORANGE}33`,
                borderLeft: `3px solid ${ORANGE}`,
                borderRadius: 10,
                padding: '16px 20px',
                marginBottom: 22,
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: ORANGE_DEEP,
                  margin: '0 0 8px', fontFamily: 'var(--font-body)',
                }}>
                  Your first message
                </p>
                <p style={{
                  fontSize: 14, color: 'var(--ink)',
                  margin: 0, lineHeight: 1.65,
                  fontFamily: 'var(--font-body)',
                }}>
                  {draftMessage}
                </p>
              </div>

              <PrimaryButton onClick={handleSendAndAdvance} disabled={sending}>
                {sending ? 'Sending…' : 'Send and enter The Circle →'}
              </PrimaryButton>
            </>
          )}
        </section>
      )}

      {/* ── Screen 3 ── */}
      {step === 3 && (
        <section style={{ textAlign: 'center', paddingTop: 16 }}>
          {messageSent && partnerFirstName && (
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#eaf2ec', color: GREEN,
              fontSize: 11, fontWeight: 600,
              padding: '6px 12px', borderRadius: 999,
              margin: '0 0 20px', fontFamily: 'var(--font-body)',
            }}>
              ✓ Sent to {partnerFirstName}
            </p>
          )}
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: ORANGE,
            margin: '0 0 12px', fontFamily: 'var(--font-body)',
          }}>
            You&apos;re ready
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36, fontWeight: 300, fontStyle: 'italic',
            color: 'var(--ink)',
            margin: '0 0 18px', lineHeight: 1.15, letterSpacing: '-0.015em',
          }}>
            Week 1 is ready for you.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.65, margin: '0 auto 32px', maxWidth: 460 }}>
            Teaching, journal prompt, one weekly action, and a partner check-in.
            Take it in whatever order feels right.
          </p>
          <PrimaryButton onClick={handleFinish} disabled={finishing}>
            {finishing ? 'Entering…' : 'Start Week 1 →'}
          </PrimaryButton>
        </section>
      )}
    </div>
  )
}

function PrimaryButton({
  onClick, disabled, children,
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        background: disabled ? `${ORANGE}88` : ORANGE,
        color: '#fff',
        padding: '14px 24px',
        borderRadius: 10,
        fontSize: 14, fontWeight: 600,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.01em',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.9' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {children}
    </button>
  )
}
