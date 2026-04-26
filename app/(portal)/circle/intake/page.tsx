'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'

// Circle intake — a safety-net flow for Path C users whose circle_members row
// is missing required data (enneagram, attachment, feedback pref, 90-day goal).
// The main /onboarding collects all of this, but this page lets a user fill
// in gaps (e.g. they onboarded before a cohort was active, or an admin
// manually enrolled them).

type Ennea = '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'
type Attach = 'secure' | 'anxious' | 'avoidant' | 'disorganized'
type Feedback = 'straight' | 'context' | 'written' | 'example'

const ORANGE      = '#C97D3A'
const ORANGE_PALE = '#fdf6f2'

const ENNEA_OPTS: [Ennea, string, string][] = [
  ['1', 'Type 1 — The Reformer',     'Driven by integrity. High standards for self and others.'],
  ['2', 'Type 2 — The Helper',       'Driven by connection. Gives freely, struggles to receive.'],
  ['3', 'Type 3 — The Achiever',     'Driven by results. Identity tied to accomplishment.'],
  ['4', 'Type 4 — The Individualist','Driven by authenticity. Feels things deeply, needs to be seen.'],
  ['5', 'Type 5 — The Investigator', 'Driven by knowledge. Needs space and time to process.'],
  ['6', 'Type 6 — The Loyalist',     'Driven by security. Anticipates problems, fiercely loyal.'],
  ['7', 'Type 7 — The Enthusiast',   'Driven by possibility. Avoids pain through movement.'],
  ['8', 'Type 8 — The Challenger',   'Driven by autonomy. Leads strongly, wary of vulnerability.'],
  ['9', 'Type 9 — The Peacemaker',   'Driven by harmony. Avoids conflict, can lose self in others.'],
]

const ATTACH_OPTS: [Attach, string, string][] = [
  ['secure',       'Secure',                'Comfortable giving and receiving support. Consistent and grounding.'],
  ['anxious',      'Anxious',               "Needs warm, frequent check-ins. Reassurance isn't weakness — it's fuel."],
  ['avoidant',     'Avoidant',              'Processes internally first. Wants partners who respect autonomy.'],
  ['disorganized', 'Complex (Disorganized)','Wants connection and pulls back from it. Needs gentle, consistent presence.'],
]

const FEEDBACK_OPTS: [Feedback, string, string][] = [
  ['straight', 'Direct + fast',          'No cushioning needed. Straight talk lands best.'],
  ['context',  'With context and care',  'I receive feedback better when I understand the why.'],
  ['written',  'In writing first',       "I need to sit with it before I can respond well."],
  ['example',  'By example, not instruction', "Show me — don't tell me what to do."],
]

export default function CircleIntakePage() {
  const router = useRouter()
  const { authUser, user, loading, isAuthed } = useApp()

  const [step, setStep] = useState(1)
  const [ennea, setEnnea] = useState<Ennea | null>(null)
  const [attach, setAttach] = useState<Attach | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [goal, setGoal] = useState('')

  const [memberId, setMemberId] = useState<string | null>(null)
  const [cohortId, setCohortId] = useState<string | null>(null)
  const [archetype, setArchetype] = useState<string | null>(null)
  const [hydrating, setHydrating] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gate: only Path C (or admin) should be here.
  useEffect(() => {
    if (loading || !isAuthed) return
    if (user.isAdmin) return
    if (user.selectedPath !== 'C') router.replace('/circle')
  }, [loading, isAuthed, user.isAdmin, user.selectedPath, router])

  // Load existing circle_member row so we can prefill any already-saved fields.
  // If there's no row yet, we'll need a cohort_id to create one on submit.
  useEffect(() => {
    if (!authUser) { setHydrating(false); return }
    (async () => {
      const { data: member } = await supabaseClient
        .from('circle_members')
        .select('id, cohort_id, archetype, enneagram_type, attachment_style, feedback_pref, goal_90day')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (member) {
        setMemberId(member.id)
        setCohortId(member.cohort_id)
        setArchetype(member.archetype)
        if (member.enneagram_type)   setEnnea(member.enneagram_type as Ennea)
        if (member.attachment_style) setAttach(member.attachment_style as Attach)
        if (member.feedback_pref)    setFeedback(member.feedback_pref as Feedback)
        if (member.goal_90day)       setGoal(member.goal_90day)
      } else {
        // No member row yet — find the active cohort so we can create one on submit.
        const { data: cohort } = await supabaseClient
          .from('circle_cohorts')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()
        if (cohort) setCohortId(cohort.id)
      }

      // Fall back to onboarding_assessments to prefill / determine archetype.
      const { data: assessment } = await supabaseClient
        .from('onboarding_assessments')
        .select('archetype, ennea, attach, feedback, goal')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (assessment) {
        if (!archetype && assessment.archetype) setArchetype(assessment.archetype)
        setEnnea(prev => prev ?? (assessment.ennea as Ennea | null))
        setAttach(prev => prev ?? (assessment.attach as Attach | null))
        setFeedback(prev => prev ?? (assessment.feedback as Feedback | null))
        setGoal(prev => prev || (assessment.goal ?? ''))
      }
      setHydrating(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser])

  async function submit() {
    if (!authUser) return
    if (!ennea || !attach || !feedback || !goal.trim()) {
      setError('Please fill every field before finishing.')
      return
    }
    if (!archetype) {
      setError('No archetype on file — please complete the main onboarding first.')
      return
    }
    if (!cohortId) {
      setError('No active cohort is open right now. We\'ll enroll you when the next cohort opens.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      user_id: authUser.id,
      cohort_id: cohortId,
      archetype,
      enneagram_type: ennea,
      attachment_style: attach,
      feedback_pref: feedback,
      goal_90day: goal.trim(),
    }

    const { error: upsertError } = await supabaseClient
      .from('circle_members')
      .upsert(payload, { onConflict: 'user_id,cohort_id' })

    setSaving(false)
    if (upsertError) { setError(upsertError.message); return }
    router.push('/circle/welcome')
  }

  if (loading || hydrating) {
    return <Shell><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p></Shell>
  }

  const progress = Math.min(step, 4)

  return (
    <Shell>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 6px' }}>
          The Circle · Intake
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 300, color: 'var(--ink)', margin: '0 0 6px' }}>
          {user.name ? `A few more things, ${user.name.split(' ')[0]}.` : 'Finish your Circle profile'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
          These answers power your partner pairing and shape the prompts you see each week. About 3 minutes.
        </p>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
          Step {progress} of 4
        </div>
        <div style={{ height: 3, background: 'var(--paper2)', borderRadius: 2 }}>
          <div style={{ height: 3, borderRadius: 2, background: ORANGE, width: `${progress * 25}%`, transition: 'width .4s ease' }} />
        </div>
      </div>

      {/* Step 1 — Enneagram */}
      {step === 1 && (
        <Card>
          <SectionHead>Enneagram type</SectionHead>
          <H2>What&apos;s your primary Enneagram type?</H2>
          <Sub>
            If you haven&apos;t taken it yet,{' '}
            <a href="https://www.truity.com/test/enneagram-personality-test" target="_blank" rel="noreferrer" style={{ color: ORANGE, fontWeight: 600 }}>
              take the free Truity test
            </a>{' '}
            (~15 min) and come back.
          </Sub>
          <OptionList>
            {ENNEA_OPTS.map(([val, label, sub]) => (
              <Option key={val} label={label} sub={sub} checked={ennea === val} onChange={() => setEnnea(val)} />
            ))}
          </OptionList>
          <Footer right={
            <PrimaryBtn disabled={!ennea} onClick={() => { setError(null); setStep(2) }}>Continue →</PrimaryBtn>
          } />
        </Card>
      )}

      {/* Step 2 — Attachment */}
      {step === 2 && (
        <Card>
          <SectionHead>Attachment style</SectionHead>
          <H2>When you&apos;re going through something hard, you tend to…</H2>
          <Sub>This shapes how your accountability partner will show up for you — and how often you&apos;ll want to check in.</Sub>
          <OptionList>
            {ATTACH_OPTS.map(([val, label, sub]) => (
              <Option key={val} label={label} sub={sub} checked={attach === val} onChange={() => setAttach(val)} />
            ))}
          </OptionList>
          <Footer
            left={<BackBtn onClick={() => setStep(1)}>← Back</BackBtn>}
            right={<PrimaryBtn disabled={!attach} onClick={() => { setError(null); setStep(3) }}>Continue →</PrimaryBtn>}
          />
        </Card>
      )}

      {/* Step 3 — Feedback preference */}
      {step === 3 && (
        <Card>
          <SectionHead>Feedback preference</SectionHead>
          <H2>How do you prefer to receive direct feedback?</H2>
          <Sub>Your partner will see this so they know how to show up.</Sub>
          <OptionList>
            {FEEDBACK_OPTS.map(([val, label, sub]) => (
              <Option key={val} label={label} sub={sub} checked={feedback === val} onChange={() => setFeedback(val)} />
            ))}
          </OptionList>
          <Footer
            left={<BackBtn onClick={() => setStep(2)}>← Back</BackBtn>}
            right={<PrimaryBtn disabled={!feedback} onClick={() => { setError(null); setStep(4) }}>Continue →</PrimaryBtn>}
          />
        </Card>
      )}

      {/* Step 4 — 90-day goal */}
      {step === 4 && (
        <Card>
          <SectionHead>90-day focus</SectionHead>
          <H2>What is the one thing you most want to shift in the next 90 days?</H2>
          <Sub>
            Be as specific as you can. <em>&ldquo;Stop overgiving&rdquo;</em> is good.{' '}
            <em>&ldquo;Stop saying yes to my sister&apos;s requests before I&apos;ve checked with myself&rdquo;</em> is better.
          </Sub>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="Write your 90-day focus here..."
            style={{
              width: '100%', padding: '12px 14px',
              border: `1px solid var(--line-md)`,
              borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
              resize: 'vertical', minHeight: 100, background: '#fff', color: 'var(--ink)',
              boxSizing: 'border-box', outline: 'none',
              marginTop: 8,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 10 }}>{error}</p>}
          <Footer
            left={<BackBtn onClick={() => setStep(3)}>← Back</BackBtn>}
            right={
              <PrimaryBtn disabled={saving || !goal.trim()} onClick={submit}>
                {saving ? 'Saving…' : 'Finish →'}
              </PrimaryBtn>
            }
          />
        </Card>
      )}
    </Shell>
  )
}

// ── Reusable bits (Circle-themed) ────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="portal-full-bleed"
      style={{ background: ORANGE_PALE, minHeight: 'calc(100vh - 60px)', padding: '40px 24px' }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>{children}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 28 }}>
      {children}
    </div>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, marginBottom: 10 }}>
      {children}
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, margin: '0 0 6px', color: 'var(--ink)' }}>{children}</h2>
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: '0 0 18px' }}>{children}</p>
}

function OptionList({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
}

function Option({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 14px',
      border: `1px solid ${checked ? ORANGE : 'var(--line-md)'}`,
      borderRadius: 10,
      cursor: 'pointer',
      background: checked ? ORANGE_PALE : '#fff',
      transition: 'all .15s',
    }}>
      <input
        type="radio" checked={checked} onChange={onChange}
        style={{ marginTop: 3, accentColor: ORANGE, flexShrink: 0 }}
      />
      <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-soft)' }}>
        <strong style={{ display: 'block', fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{label}</strong>
        {sub}
      </span>
    </label>
  )
}

function Footer({ left, right }: { left?: React.ReactNode; right: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: left ? 'space-between' : 'flex-end', alignItems: 'center', marginTop: 22, gap: 10 }}>
      {left}
      {right}
    </div>
  )
}

function PrimaryBtn({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'var(--paper3)' : ORANGE,
        color: '#fff',
        padding: '10px 22px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        transition: 'background .15s',
      }}
    >
      {children}
    </button>
  )
}

function BackBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid var(--line-md)',
        color: 'var(--text-soft)',
        padding: '10px 18px', borderRadius: 10,
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}
