'use client'

// app/(portal)/circle/intake/page.tsx
// The Circle — upgraded 5-section intake.
//
// Sections (one per page, progress dots at top):
//   1. Who you are                 — pattern_nuance, enneagram_type, attachment_style,
//                                    feedback_pref, three_words
//   2. What brought you here       — previous_attempts, decision_moment,
//                                    pattern_awareness_duration
//   3. What you want               — goal_90day, life_changing_definition, program_fears
//   4. Your letter                 — letter_to_self
//   5. Logistics                   — timezone, life_context, partner_needs
//   6. Closing                     — "I have your intake" → "Return to home"
//
// All answers live on circle_members (see migration 030). Three columns are
// admin-only — life_changing_definition, program_fears, letter_to_self —
// marked with a lock icon in the UI; the API layer is responsible for never
// returning them to anyone other than the owner.
//
// On submit, intake_completed_at is set to NOW().

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'

type Awareness = 'recent' | '1_to_3_years' | 'over_3_years' | 'most_of_life'
type Feedback  = 'direct' | 'warm' | 'questions' | 'reflect' | 'flex' |
                 // legacy values still accepted by the CHECK constraint;
                 // never offered as new selections.
                 'straight' | 'context' | 'written' | 'example'

const ARCHETYPE_DISPLAY: Record<string, string> = {
  door:   'an Open Door',
  throne: "an Overthinker's Throne",
  engine: 'an Interrupted Engine',
  push:   'a Pushthrough',
}

const FEEDBACK_OPTS: { value: Feedback; label: string; sub: string }[] = [
  { value: 'direct',    label: 'Direct and specific',          sub: 'Tell me exactly what you see.' },
  { value: 'warm',      label: 'Warm and honest',              sub: 'Truth with care around the delivery.' },
  { value: 'questions', label: 'Questions over statements',    sub: 'Ask me things rather than tell me.' },
  { value: 'reflect',   label: 'Let me come to it',            sub: 'Reflect things back and let me find the insight.' },
  { value: 'flex',      label: 'It depends on the day',        sub: "I'll tell my partner which I need." },
]

const AWARENESS_OPTS: { value: Awareness; label: string }[] = [
  { value: 'recent',         label: 'A few months — I just named it recently' },
  { value: '1_to_3_years',   label: '1 to 3 years — I knew but could not change it' },
  { value: 'over_3_years',   label: 'More than 3 years' },
  { value: 'most_of_life',   label: 'Most of my life — it has always been there' },
]

const SECTION_TITLES = [
  'Who you are',
  'What brought you here',
  'What you want',
  'Your letter',
  'Logistics',
] as const

export default function CircleIntakePage() {
  const router = useRouter()
  const { authUser, user, loading, isAuthed } = useApp()

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [hydrating, setHydrating] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [memberId, setMemberId] = useState<string | null>(null)
  const [cohortId, setCohortId] = useState<string | null>(null)
  const [archetype, setArchetype] = useState<string | null>(null)

  // Section 1
  const [patternNuance, setPatternNuance] = useState('')
  const [enneagram, setEnneagram] = useState('')
  const [attachment, setAttachment] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [threeWords, setThreeWords] = useState('')

  // Section 2
  const [previousAttempts, setPreviousAttempts] = useState('')
  const [decisionMoment, setDecisionMoment] = useState('')
  const [awareness, setAwareness] = useState<Awareness | null>(null)

  // Section 3
  const [goal90, setGoal90] = useState('')
  const [lifeChanging, setLifeChanging] = useState('')
  const [fears, setFears] = useState('')

  // Section 4
  const [letterToSelf, setLetterToSelf] = useState('')

  // Section 5
  const [timezone, setTimezone] = useState('')
  const [lifeContext, setLifeContext] = useState('')
  const [partnerNeeds, setPartnerNeeds] = useState('')

  // Hydrate the member row + any answers already on file.
  useEffect(() => {
    if (loading || !isAuthed || !authUser) return
    (async () => {
      const { data: member } = await supabaseClient
        .from('circle_members')
        .select(`
          id, cohort_id, archetype, enneagram_type, attachment_style, feedback_pref,
          goal_90day, pattern_nuance, three_words, previous_attempts, decision_moment,
          pattern_awareness_duration, life_changing_definition, program_fears,
          letter_to_self, timezone, life_context, partner_needs
        `)
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (member) {
        setMemberId(member.id)
        setCohortId(member.cohort_id)
        setArchetype(member.archetype)
        setPatternNuance(member.pattern_nuance ?? '')
        setEnneagram(member.enneagram_type ?? '')
        setAttachment(member.attachment_style ?? '')
        if (member.feedback_pref) setFeedback(member.feedback_pref as Feedback)
        setThreeWords(member.three_words ?? '')
        setPreviousAttempts(member.previous_attempts ?? '')
        setDecisionMoment(member.decision_moment ?? '')
        if (member.pattern_awareness_duration) setAwareness(member.pattern_awareness_duration as Awareness)
        setGoal90(member.goal_90day ?? '')
        setLifeChanging(member.life_changing_definition ?? '')
        setFears(member.program_fears ?? '')
        setLetterToSelf(member.letter_to_self ?? '')
        setTimezone(member.timezone ?? '')
        setLifeContext(member.life_context ?? '')
        setPartnerNeeds(member.partner_needs ?? '')
      } else {
        // No circle_members row yet — find the active cohort so submit can create one.
        const { data: cohort } = await supabaseClient
          .from('circle_cohorts')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()
        if (cohort) setCohortId(cohort.id)
      }

      // Detect timezone from the browser if we don't already have one stored.
      if (!member?.timezone) {
        try { setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone) } catch {}
      }

      setHydrating(false)
    })()
  }, [loading, isAuthed, authUser])

  // Persist all 15 fields. Called from "Continue" on each section and from
  // the final "Submit" on section 5. We upsert so partially-filled sessions
  // don't get lost if the member closes the tab between pages.
  async function persist(opts: { final?: boolean } = {}) {
    if (!authUser) return { error: 'Not signed in.' }
    if (!archetype) return { error: 'No archetype on file — please complete onboarding first.' }
    if (!cohortId) return { error: 'No active cohort is open. We\'ll enroll you when the next cohort opens.' }

    const payload: Record<string, unknown> = {
      user_id: authUser.id,
      cohort_id: cohortId,
      archetype,
      pattern_nuance:              patternNuance.trim() || null,
      enneagram_type:              enneagram.trim() || null,
      attachment_style:            attachment.trim() || null,
      feedback_pref:               feedback ?? null,
      three_words:                 threeWords.trim() || null,
      previous_attempts:           previousAttempts.trim() || null,
      decision_moment:             decisionMoment.trim() || null,
      pattern_awareness_duration:  awareness ?? null,
      goal_90day:                  goal90.trim() || null,
      life_changing_definition:    lifeChanging.trim() || null,
      program_fears:               fears.trim() || null,
      letter_to_self:              letterToSelf.trim() || null,
      timezone:                    timezone.trim() || null,
      life_context:                lifeContext.trim() || null,
      partner_needs:               partnerNeeds.trim() || null,
    }
    if (opts.final) payload.intake_completed_at = new Date().toISOString()

    const { error: upsertError } = await supabaseClient
      .from('circle_members')
      .upsert(payload, { onConflict: 'user_id,cohort_id' })

    return upsertError ? { error: upsertError.message } : {}
  }

  async function advance(next: typeof step) {
    setSaving(true); setError(null)
    const res = await persist()
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  async function submitFinal() {
    setSaving(true); setError(null)
    const res = await persist({ final: true })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setStep(6)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  if (loading || hydrating) {
    return <Shell><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p></Shell>
  }

  const archetypeLabel = archetype ? (ARCHETYPE_DISPLAY[archetype] ?? archetype) : 'an archetype'
  const firstName = user.name?.split(' ')[0] ?? ''

  return (
    <Shell>
      {step <= 5 && (
        <>
          <Eyebrow>The Circle · Intake · Section {step} of 5</Eyebrow>
          <ProgressDots current={step} total={5} />
        </>
      )}

      {/* ─── Section 1 — Who you are ─────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <H1>Before we begin.</H1>
          <NicoleNote>
            This intake is not a form. It is the first real conversation we are
            going to have — just between you and me. Take your time with every
            question. There are no right answers. The more honest you are here,
            the more this program will be built specifically around you and what
            you actually need.
            <br /><br />
            I read every single one of these personally.
            <NicoleSig />
          </NicoleNote>

          <FieldGroup>
            <Question>
              Your quiz told us you are {archetypeLabel}. Does that feel
              accurate? Is there anything about your pattern the quiz did not
              fully capture?
            </Question>
            <Textarea
              value={patternNuance}
              onChange={setPatternNuance}
              placeholder="What rings true, what doesn't, what's underneath…"
            />
          </FieldGroup>

          <FieldGroup>
            <Question>
              What is your Enneagram type? If you do not know, write{' '}
              <em>unknown</em> and we will explore it together.
            </Question>
            <Input
              value={enneagram}
              onChange={setEnneagram}
              placeholder="e.g. 4w5, Type 9, unknown"
            />
          </FieldGroup>

          <FieldGroup>
            <Question>What is your attachment style?</Question>
            <Input
              value={attachment}
              onChange={setAttachment}
              placeholder="e.g. anxious, secure, avoidant, disorganized, not sure"
            />
          </FieldGroup>

          <FieldGroup>
            <Question>How do you prefer to receive feedback?</Question>
            <RadioGroup>
              {FEEDBACK_OPTS.map(o => (
                <Radio
                  key={o.value}
                  label={o.label}
                  sub={o.sub}
                  checked={feedback === o.value}
                  onChange={() => setFeedback(o.value)}
                />
              ))}
            </RadioGroup>
          </FieldGroup>

          <FieldGroup>
            <Question>
              Describe yourself in three words. Not the words that sound good.
              The three words someone who knows you well would use.
            </Question>
            <Input
              value={threeWords}
              onChange={setThreeWords}
              placeholder="e.g. loyal, restless, capable"
              maxLength={50}
            />
          </FieldGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Footer
            right={<PrimaryBtn disabled={saving} onClick={() => advance(2)}>
              {saving ? 'Saving…' : 'Continue →'}
            </PrimaryBtn>}
          />
        </Card>
      )}

      {/* ─── Section 2 — What brought you here ───────────────────────────── */}
      {step === 2 && (
        <Card>
          <H1>What brought you here.</H1>
          <FieldGroup>
            <Question>
              What have you tried before this — programs, therapy, books,
              habits, routines — and why do you think it did not fully work?
            </Question>
            <SubLabel>
              Be specific. Not "I tried journaling and it did not stick." Tell
              me what happened, what shifted at first, what eventually stopped
              working, and what story you told yourself about why.
            </SubLabel>
            <Textarea
              value={previousAttempts}
              onChange={setPreviousAttempts}
              placeholder="What you tried, what happened, why it stopped…"
              minHeight={140}
            />
          </FieldGroup>

          <FieldGroup>
            <Question>
              What is the moment that made you decide to join The Circle? Not
              the general reason — the specific moment. What happened, what did
              you feel, what did you say to yourself?
            </Question>
            <Textarea
              value={decisionMoment}
              onChange={setDecisionMoment}
              placeholder="The moment that flipped the switch…"
              minHeight={140}
            />
          </FieldGroup>

          <FieldGroup>
            <Question>How long have you been aware that this pattern was running?</Question>
            <RadioGroup>
              {AWARENESS_OPTS.map(o => (
                <Radio
                  key={o.value}
                  label={o.label}
                  checked={awareness === o.value}
                  onChange={() => setAwareness(o.value)}
                />
              ))}
            </RadioGroup>
          </FieldGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Footer
            left={<BackBtn onClick={() => setStep(1)}>← Back</BackBtn>}
            right={<PrimaryBtn disabled={saving} onClick={() => advance(3)}>
              {saving ? 'Saving…' : 'Continue →'}
            </PrimaryBtn>}
          />
        </Card>
      )}

      {/* ─── Section 3 — What you want ───────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <H1>What you want.</H1>

          <FieldGroup>
            <Question>
              What is your 90-day focus? What do you want to be working on and
              moving through during this program?
            </Question>
            <SubLabel>
              Be specific. Not "I want to feel better." What does better
              actually look like in your daily life?
            </SubLabel>
            <Textarea
              value={goal90}
              onChange={setGoal90}
              placeholder="The shift you want in the next 90 days…"
              minHeight={140}
            />
          </FieldGroup>

          <FieldGroup>
            <Question>
              What would have to be true at the end of 90 days for you to feel
              like this experience changed your life?
              <Lock tooltip="This is just between you and Nicole." />
            </Question>
            <SubLabel>
              Not your goal. Your personal definition of life-changing for this
              specific season. What would you feel, experience, or know that
              you do not right now?
            </SubLabel>
            <Textarea
              value={lifeChanging}
              onChange={setLifeChanging}
              placeholder="Your private definition of life-changing…"
              minHeight={140}
            />
          </FieldGroup>

          <FieldGroup>
            <Question>
              Is there anything you are afraid of about this program? About
              doing this work, about being seen, about what you might find?
              <Lock tooltip="Nicole reads this. It is never shared with your partner or the group." />
            </Question>
            <SubLabel>
              You do not have to be afraid of anything. And you do not have to
              share this with anyone except me. But if something is there, I
              want to know before we start.
            </SubLabel>
            <Textarea
              value={fears}
              onChange={setFears}
              placeholder="Anything that's making you nervous…"
              minHeight={120}
            />
          </FieldGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Footer
            left={<BackBtn onClick={() => setStep(2)}>← Back</BackBtn>}
            right={<PrimaryBtn disabled={saving} onClick={() => advance(4)}>
              {saving ? 'Saving…' : 'Continue →'}
            </PrimaryBtn>}
          />
        </Card>
      )}

      {/* ─── Section 4 — Your letter ─────────────────────────────────────── */}
      {step === 4 && (
        <Card>
          <H1>Your letter.</H1>
          <NicoleNote>
            Before we pair you with your accountability partner, I want you to
            do one more thing. Write a letter to yourself — to the version of
            you who will open this six months after graduation.
            <br /><br />
            You do not know yet what will have shifted. You do not know yet who
            you will be. Write to her anyway. Tell her what you hope is true.
            Tell her what you are afraid might still be the same. Tell her what
            you want her to know about who you are right now, before the work
            begins.
            <br /><br />
            I will send this letter to you six months after your graduation
            day. No one else will read it.
            <NicoleSig />
          </NicoleNote>

          <FieldGroup>
            <Question>
              Your letter to yourself.
              <Lock tooltip="Stored for you. Emailed back 180 days after graduation. No one else reads it." />
            </Question>
            <Textarea
              value={letterToSelf}
              onChange={setLetterToSelf}
              placeholder={firstName ? `Dear ${firstName},` : 'Dear me,'}
              minHeight={260}
            />
          </FieldGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Footer
            left={<BackBtn onClick={() => setStep(3)}>← Back</BackBtn>}
            right={<PrimaryBtn disabled={saving} onClick={() => advance(5)}>
              {saving ? 'Saving…' : 'Continue →'}
            </PrimaryBtn>}
          />
        </Card>
      )}

      {/* ─── Section 5 — Logistics ───────────────────────────────────────── */}
      {step === 5 && (
        <Card>
          <H1>Logistics.</H1>

          <FieldGroup>
            <Question>What time zone are you in?</Question>
            <TimezoneSelect value={timezone} onChange={setTimezone} />
          </FieldGroup>

          <FieldGroup>
            <Question>
              Is there anything happening in your life right now that the
              program should know about? A season of high stress, a major
              transition, a health situation — anything that might affect your
              availability or capacity over the next 90 days?
            </Question>
            <SubLabel>
              This is not a disqualifying question. It is a context question.
              The more I know about what you are carrying in, the better I can
              support you.
            </SubLabel>
            <Textarea
              value={lifeContext}
              onChange={setLifeContext}
              placeholder="Anything I should hold while we do this work…"
              minHeight={140}
            />
          </FieldGroup>

          <FieldGroup>
            <Question>
              What does your accountability partner need to know about you to
              support you well?
              <Info tooltip="This will be shared with your accountability partner." />
            </Question>
            <SubLabel>
              Not your archetype — your partner will know that. What do you
              want them to understand about how you work, how you receive
              support, and what you need from this relationship specifically?
            </SubLabel>
            <Textarea
              value={partnerNeeds}
              onChange={setPartnerNeeds}
              placeholder="What you'd want a thoughtful partner to know upfront…"
              minHeight={140}
            />
          </FieldGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}
          <Footer
            left={<BackBtn onClick={() => setStep(4)}>← Back</BackBtn>}
            right={<PrimaryBtn disabled={saving} onClick={submitFinal}>
              {saving ? 'Saving…' : 'Submit intake →'}
            </PrimaryBtn>}
          />
        </Card>
      )}

      {/* ─── Closing page ─────────────────────────────────────────────────── */}
      {step === 6 && (
        <Card>
          <H1>Thank you{firstName ? `, ${firstName}` : ''}.</H1>
          <NicoleNote>
            I have your intake. I am going to read it this week.
            <br /><br />
            You will hear from me about your enrollment confirmation and your
            accountability partner soon.
            <br /><br />
            Between now and then — notice your pattern. Not to judge it. Just
            to see it. Start paying attention to the moments it shows up. You
            are already doing the work.
            <br /><br />
            See you inside.
            <NicoleSig />
          </NicoleNote>
          <Footer
            right={<PrimaryBtn onClick={() => router.push('/circle')}>Return to home</PrimaryBtn>}
          />
        </Card>
      )}
    </Shell>
  )
}

// ── Reusable bits ──────────────────────────────────────────────────────────

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      className="portal-full-bleed"
      style={{ background: ORANGE_PALE, minHeight: 'calc(100vh - 60px)', padding: '32px 24px 60px' }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>{children}</div>
    </div>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 32 }}>
      {children}
    </div>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: 'var(--text-muted)', margin: '0 0 14px',
    }}>
      {children}
    </div>
  )
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'active' : 'pending'
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700,
              background: state === 'done' ? ORANGE : state === 'active' ? '#fff' : 'var(--paper2)',
              color:      state === 'done' ? '#fff'  : state === 'active' ? ORANGE : 'var(--text-muted)',
              border:     `1.5px solid ${state === 'pending' ? 'var(--line-md)' : ORANGE}`,
            }}>
              {state === 'done' ? '✓' : n}
            </div>
            {n < total && (
              <div style={{
                width: 22, height: 2,
                background: state === 'done' ? ORANGE : 'var(--paper2)',
              }} />
            )}
          </div>
        )
      })}
      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
        {SECTION_TITLES[current - 1]}
      </span>
    </div>
  )
}

function H1({ children }: { children: ReactNode }) {
  return (
    <h1 style={{
      fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300,
      color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.15,
      margin: '0 0 18px',
    }}>
      {children}
    </h1>
  )
}

function NicoleNote({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 14, lineHeight: 1.7, color: 'var(--text-soft)',
      background: ORANGE_PALE, border: `1px solid ${ORANGE}30`,
      borderLeft: `3px solid ${ORANGE}`,
      borderRadius: 8, padding: '16px 18px', margin: '0 0 26px',
    }}>
      {children}
    </div>
  )
}

function NicoleSig() {
  return (
    <div style={{
      marginTop: 10, fontFamily: 'var(--font-display)', fontStyle: 'italic',
      fontSize: 14, color: 'var(--ink)',
    }}>
      — Nicole
    </div>
  )
}

function FieldGroup({ children }: { children: ReactNode }) {
  return <div style={{ marginBottom: 24 }}>{children}</div>
}

function Question({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
      color: 'var(--ink)', lineHeight: 1.5, marginBottom: 6,
      display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap',
    }}>
      {children}
    </div>
  )
}

function SubLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px', fontStyle: 'italic' }}>
      {children}
    </div>
  )
}

const baseFieldStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px',
  border: '1px solid var(--line-md)',
  borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
  background: '#fff', color: 'var(--ink)', outline: 'none',
  transition: 'border-color .15s',
}

function Textarea({ value, onChange, placeholder, minHeight = 100 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: number
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
      style={{ ...baseFieldStyle, resize: 'vertical', minHeight, lineHeight: 1.6 }}
    />
  )
}

function Input({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={e => onChange(e.target.value)}
      onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
      style={baseFieldStyle}
    />
  )
}

function RadioGroup({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
}

function Radio({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: () => void
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 14px',
      border: `1px solid ${checked ? ORANGE : 'var(--line-md)'}`,
      borderRadius: 10, cursor: 'pointer',
      background: checked ? ORANGE_PALE : '#fff',
      transition: 'all .15s',
    }}>
      <input
        type="radio" checked={checked} onChange={onChange}
        style={{ marginTop: 3, accentColor: ORANGE, flexShrink: 0 }}
      />
      <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-soft)' }}>
        <strong style={{ display: 'block', fontWeight: 600, color: 'var(--ink)', marginBottom: sub ? 2 : 0 }}>{label}</strong>
        {sub}
      </span>
    </label>
  )
}

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Intl.supportedValuesOf was added in Node 18 / modern browsers; if the
  // runtime is older we fall back to a curated short list rather than blow up.
  const zones = useMemo(() => {
    try {
      const list = (Intl as { supportedValuesOf?: (key: string) => string[] })
        .supportedValuesOf?.('timeZone') as string[]
      if (Array.isArray(list) && list.length > 0) return list
    } catch {}
    return [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
      'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
    ]
  }, [])

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...baseFieldStyle, cursor: 'pointer' }}
    >
      <option value="">— Select your timezone —</option>
      {zones.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
    </select>
  )
}

function Lock({ tooltip }: { tooltip: string }) {
  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: '50%',
        background: 'rgba(184,134,46,0.12)', color: ORANGE,
        fontSize: 10, fontWeight: 700, cursor: 'help',
        marginLeft: 2,
      }}
    >
      🔒
    </span>
  )
}

function Info({ tooltip }: { tooltip: string }) {
  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: '50%',
        background: 'rgba(95,140,75,0.16)', color: 'var(--green, #3c6f47)',
        fontSize: 11, fontWeight: 700, cursor: 'help',
        marginLeft: 2,
      }}
    >
      i
    </span>
  )
}

function ErrorMsg({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12, color: 'var(--red)', margin: '12px 0 0' }}>{children}</p>
}

function Footer({ left, right }: { left?: ReactNode; right: ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: left ? 'space-between' : 'flex-end',
      alignItems: 'center', marginTop: 24, gap: 10,
    }}>
      {left}
      {right}
    </div>
  )
}

function PrimaryBtn({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'var(--paper3)' : ORANGE,
        color: '#fff', padding: '11px 24px', borderRadius: 10,
        fontSize: 13, fontWeight: 600, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

function BackBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid var(--line-md)',
        color: 'var(--text-soft)', padding: '11px 20px', borderRadius: 10,
        fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}
