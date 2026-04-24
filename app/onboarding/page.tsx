'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

type Archetype = 'door' | 'throne' | 'engine' | 'push'
type Ennea = '1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'
type Attach = 'secure' | 'anxious' | 'avoidant' | 'disorganized'
type Feedback = 'straight' | 'context' | 'written' | 'example'

interface AssessmentState {
  archetype: Archetype | null
  ennea: Ennea | null
  attach: Attach | null
  acctFeel: string | null
  feedback: Feedback | null
  goal: string
}

interface CohortMember {
  id: string
  name: string
  initials: string
  avatarBg: string
  avatarColor: string
  archetype: Archetype
  ennea: Ennea
  attach: Attach
  feedback: Feedback
  focus: string
}

const archetypeData: Record<Archetype, { name: string; sub: string; tags: string[]; color: string }> = {
  door:   { name: 'The Open Door',         sub: 'You activate for others automatically. This 90 days is about learning to be as available to yourself as you\'ve been to everyone else.',      tags: ['Over-giver','Boundary builder','Self-first learner'],       color: '#1B4332' },
  throne: { name: 'The Overthink Throne',  sub: 'Your mind rarely rests. This 90 days is about learning that clarity comes from movement — not more thinking.',                               tags: ['Mental processor','Action builder','Loop-breaker'],          color: '#1a1a2e' },
  engine: { name: 'The Interrupted Engine',sub: 'You\'re unstoppable in motion. This 90 days is about building an engine that runs in any conditions — not just perfect ones.',               tags: ['Momentum builder','Self-trust rebuilder','Consistency keeper'],color: '#7B1D1D' },
  push:   { name: 'The Pushthrough',       sub: 'You move first, check in later. This 90 days is about learning that pausing is a power move — not a retreat.',                              tags: ['Rest reclaimer','Body listener','Sustainable force'],         color: '#3d2c0e' },
}

const enneaData: Record<Ennea, { name: string; desc: string }> = {
  '1': { name: 'Type 1 — The Reformer',    desc: 'Driven by integrity. High standards for self and others.' },
  '2': { name: 'Type 2 — The Helper',      desc: 'Driven by connection. Gives freely, struggles to receive.' },
  '3': { name: 'Type 3 — The Achiever',    desc: 'Driven by results. Identity tied to accomplishment.' },
  '4': { name: 'Type 4 — The Individualist',desc: 'Driven by authenticity. Feels things deeply, needs to be seen.' },
  '5': { name: 'Type 5 — The Investigator',desc: 'Driven by knowledge. Needs space and time to process.' },
  '6': { name: 'Type 6 — The Loyalist',    desc: 'Driven by security. Anticipates problems, fiercely loyal.' },
  '7': { name: 'Type 7 — The Enthusiast',  desc: 'Driven by possibility. Avoids pain through movement and variety.' },
  '8': { name: 'Type 8 — The Challenger',  desc: 'Driven by autonomy. Leads strongly, struggles with vulnerability.' },
  '9': { name: 'Type 9 — The Peacemaker',  desc: 'Driven by harmony. Avoids conflict, can lose themselves in others.' },
}

const attachData: Record<Attach, { name: string; desc: string }> = {
  secure:       { name: 'Secure',                desc: 'Comfortable giving and receiving support. Consistent and grounding for partners.' },
  anxious:      { name: 'Anxious',               desc: 'Needs warm, frequent check-ins. Reassurance is not weakness — it\'s your fuel.' },
  avoidant:     { name: 'Avoidant',              desc: 'Processes internally first. Needs a partner who respects autonomy within structure.' },
  disorganized: { name: 'Complex (Disorganized)',desc: 'Wants connection and pulls back from it. Benefits from gentle, consistent presence.' },
}

const feedbackData: Record<Feedback, { name: string; desc: string }> = {
  straight: { name: 'Direct + fast',  desc: 'No cushioning needed. Straight talk lands best.' },
  context:  { name: 'With context',   desc: 'Understands feedback when the why is explained.' },
  written:  { name: 'Written first',  desc: 'Processes better in text before responding.' },
  example:  { name: 'By example',     desc: 'Learns by watching, not instruction.' },
}

const cohortPool: CohortMember[] = [
  { id:'A', name:'Maya T.',   initials:'MT', avatarBg:'#1B4332', avatarColor:'#C9A84C', archetype:'engine', ennea:'3', attach:'secure',  feedback:'straight', focus:'Stop abandoning my morning routine when work gets heavy' },
  { id:'B', name:'Renée J.',  initials:'RJ', avatarBg:'#7B1D1D', avatarColor:'#f5d080', archetype:'push',   ennea:'8', attach:'avoidant', feedback:'straight', focus:'Learn to rest before I crash' },
  { id:'C', name:'Simone K.', initials:'SK', avatarBg:'#2d3561', avatarColor:'#9fc9a8', archetype:'throne', ennea:'5', attach:'anxious',  feedback:'written',  focus:'Make decisions without spiraling for days' },
  { id:'D', name:'Alicia W.', initials:'AW', avatarBg:'#3d2c0e', avatarColor:'#C9A84C', archetype:'door',   ennea:'2', attach:'secure',   feedback:'context',  focus:'Stop volunteering for things before checking if I want to' },
  { id:'E', name:'Jordan P.', initials:'JP', avatarBg:'#1B4332', avatarColor:'#fff',    archetype:'engine', ennea:'9', attach:'anxious',  feedback:'context',  focus:'Finally finish the business plan I keep restarting' },
  { id:'F', name:'Tamara B.', initials:'TB', avatarBg:'#1a1a2e', avatarColor:'#C9A84C', archetype:'throne', ennea:'6', attach:'secure',   feedback:'straight', focus:'Stop overthinking every conversation after it happens' },
]

function scoreCompat(member: CohortMember, state: AssessmentState): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  const { archetype: a, ennea: e, attach: at, feedback: fb } = state
  if (!a || !e || !at || !fb) return { score: 0, reasons: [] }

  const archetypeCompat: Record<Archetype, Record<Archetype, number>> = {
    door:   { engine:30, push:25, throne:20, door:10 },
    throne: { engine:30, push:25, door:20,   throne:8 },
    engine: { door:30,   throne:25, push:20, engine:12 },
    push:   { throne:30, door:25,   engine:20, push:8 },
  }
  const ac = archetypeCompat[a]?.[member.archetype] ?? 10
  score += ac
  if (ac >= 25) reasons.push('Your archetypes complement each other — you each model what the other is building toward.')
  else if (ac >= 20) reasons.push('Different energy patterns that can cross-challenge each other productively.')

  const attachCompat: Record<Attach, Record<Attach, number>> = {
    secure:      { secure:20, anxious:25, avoidant:25, disorganized:20 },
    anxious:     { secure:28, avoidant:10, anxious:14, disorganized:12 },
    avoidant:    { secure:25, anxious:10,  avoidant:15, disorganized:12 },
    disorganized:{ secure:28, anxious:12,  avoidant:12, disorganized:10 },
  }
  const atc = attachCompat[at]?.[member.attach] ?? 10
  score += atc
  if (at === 'anxious' && member.attach === 'secure') reasons.push('Their secure attachment style will feel grounding and consistent for you.')
  else if (at === 'avoidant' && member.attach === 'secure') reasons.push('Their secure style gives you space while staying present — ideal for how you process.')
  else if (member.attach === 'secure') reasons.push('Their secure attachment creates a safe container for both of you.')
  else if (at === member.attach && at !== 'anxious') reasons.push('Similar attachment styles mean you\'ll naturally understand each other\'s rhythms.')

  const enneaPairs: Record<string, string[]> = {
    '2':['3','8','9'], '3':['2','6','9'], '9':['3','8','1'],
    '6':['3','9','8'], '5':['8','3','7'], '1':['7','4','9'],
    '4':['1','8','2'], '8':['2','5','9'], '7':['1','5','4'],
  }
  if ((enneaPairs[e] ?? []).includes(member.ennea)) {
    score += 18
    reasons.push('Your Enneagram types are a known high-growth pairing — you\'ll push each other in the right ways.')
  } else if (e !== member.ennea) {
    score += 8
  }

  if (fb === member.feedback) {
    score += 8
    reasons.push('You share the same feedback preference — check-ins will feel natural from the start.')
  } else if ((fb === 'straight' && member.feedback === 'context') || (fb === 'context' && member.feedback === 'straight')) {
    score += 5
    reasons.push('Different feedback styles that can balance each other out — one direct, one contextual.')
  }

  return { score: Math.min(score, 97), reasons: reasons.slice(0, 3) }
}

// ── Reusable sub-components ──────────────────────────────────────────────────

function RadioOption({ name, value, checked, label, sub, onChange }: {
  name: string; value: string; checked: boolean; label: string; sub?: string; onChange: () => void
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '10px 14px', border: `1px solid ${checked ? '#1B4332' : '#e8e4dc'}`,
      borderRadius: '10px', cursor: 'pointer',
      background: checked ? '#f0f6f2' : '#fff',
      transition: 'all .15s',
    }}>
      <input
        type="radio" name={name} value={value} checked={checked}
        onChange={onChange}
        style={{ marginTop: '2px', accentColor: '#1B4332', flexShrink: 0 }}
      />
      <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#333' }}>
        <strong style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1a1a1a', marginBottom: '1px' }}>{label}</strong>
        {sub}
      </span>
    </label>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '12px' }}>
      {children}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
      {children}
    </div>
  )
}

function ErrorMsg({ show, msg }: { show: boolean; msg: string }) {
  if (!show) return null
  return <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '6px' }}>{msg}</p>
}

function BtnRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>{children}</div>
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<AssessmentState>({
    archetype: null, ennea: null, attach: null, acctFeel: null, feedback: null, goal: '',
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [matches, setMatches] = useState<(CohortMember & { compat: number; why: string[] })[]>([])
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  async function finishOnboarding() {
    setFinishing(true)
    setFinishError(null)
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      // Not signed in — admin preview path. Just go to the dashboard.
      router.push('/dashboard')
      return
    }
    const { error: assessmentError } = await supabaseClient
      .from('onboarding_assessments')
      .upsert({
        user_id:   user.id,
        archetype: state.archetype,
        ennea:     state.ennea,
        attach:    state.attach,
        acct_feel: state.acctFeel,
        feedback:  state.feedback,
        goal:      state.goal.trim() || null,
      }, { onConflict: 'user_id' })

    if (assessmentError) {
      setFinishError(assessmentError.message)
      setFinishing(false)
      return
    }

    const { error: userError } = await supabaseClient
      .from('users')
      .update({ onboarding_complete: true })
      .eq('id', user.id)

    if (userError) {
      setFinishError(userError.message)
      setFinishing(false)
      return
    }

    router.push('/dashboard')
  }

  const stepLabels = ['','Your archetype','Enneagram type','Attachment style','Coaching preferences','Your matches']
  const progress = Math.min(step, 5)

  function set(key: keyof AssessmentState, val: string) {
    setState(prev => ({ ...prev, [key]: val }))
    setErrors(prev => ({ ...prev, [key]: false }))
  }

  function goNext(from: number) {
    const errs: Record<string, boolean> = {}

    if (from === 1 && !state.archetype) { errs.archetype = true }
    if (from === 2 && !state.ennea)     { errs.ennea = true }
    if (from === 3) {
      if (!state.attach)   errs.attach = true
      if (!state.acctFeel) errs.acctFeel = true
    }
    if (from === 4) {
      if (!state.feedback)   errs.feedback = true
      if (!state.goal.trim()) errs.goal = true
    }

    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    if (from === 4) {
      const computed = cohortPool
        .map(m => { const c = scoreCompat(m, state); return { ...m, compat: c.score, why: c.reasons } })
        .sort((a, b) => b.compat - a.compat)
        .slice(0, 3)
      setMatches(computed)
    }

    setStep(from + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack(from: number) {
    setStep(from - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function confirm() {
    if (!selectedMatch) { setErrors(prev => ({ ...prev, match: true })); return }
    setStep(6)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirmedMatch = cohortPool.find(m => m.id === selectedMatch)
  const ad = state.archetype ? archetypeData[state.archetype] : null
  const ed = state.ennea ? enneaData[state.ennea] : null
  const atd = state.attach ? attachData[state.attach] : null
  const fd = state.feedback ? feedbackData[state.feedback] : null

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#f8f6f1', color: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Progress */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
            {step < 6 ? `Step ${progress} of 5 — ${stepLabels[progress]}` : 'Complete — welcome to The Circle'}
          </div>
          <div style={{ height: '4px', background: '#e8e4dc', borderRadius: '2px' }}>
            <div style={{ height: '4px', borderRadius: '2px', background: '#1B4332', width: step >= 6 ? '100%' : `${progress * 20}%`, transition: 'width .4s ease' }} />
          </div>
        </div>

        {/* ── STEP 1: ARCHETYPE ── */}
        {step === 1 && (
          <>
            <Card>
              <SectionHead>Welcome to The Circle</SectionHead>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>Let&apos;s build your profile</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
                This takes about 8 minutes. Your answers power your accountability pairing — no manual steps required.
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>
                Which archetype did you identify as in Seal the Leak?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  ['door',   'The Open Door',          'Your energy activates for others automatically. You give before you check in with yourself.'],
                  ['throne', 'The Overthink Throne',   'Your mind stays on. Replaying, preparing, analyzing — it rarely gets to rest.'],
                  ['engine', 'The Interrupted Engine', 'When you\'re moving you\'re unstoppable. Interruptions cost you more than just time.'],
                  ['push',   'The Pushthrough',        'You move first, check in later. Your body has been speaking — you\'re learning to listen.'],
                ] as [Archetype, string, string][]).map(([val, label, sub]) => (
                  <RadioOption key={val} name="archetype" value={val} label={label} sub={sub}
                    checked={state.archetype === val} onChange={() => set('archetype', val)} />
                ))}
              </div>
              <ErrorMsg show={!!errors.archetype} msg="Please select your archetype to continue." />
            </Card>
            <BtnRow>
              <button className="btn-next" onClick={() => goNext(1)}>Continue →</button>
            </BtnRow>
          </>
        )}

        {/* ── STEP 2: ENNEAGRAM ── */}
        {step === 2 && (
          <>
            <Card>
              <SectionHead>Enneagram type</SectionHead>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>What is your Enneagram type?</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
                If you haven&apos;t taken the Enneagram yet,{' '}
                <a href="https://www.truity.com/test/enneagram-personality-test" target="_blank" rel="noreferrer" style={{ color: '#1B4332', fontWeight: 600 }}>
                  take the free Truity test
                </a>{' '}
                (15 min) and come back.
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>Select your primary Enneagram type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(['1','2','3','4','5','6','7','8','9'] as Ennea[]).map(val => (
                  <RadioOption key={val} name="ennea" value={val}
                    label={enneaData[val].name} sub={enneaData[val].desc}
                    checked={state.ennea === val} onChange={() => set('ennea', val)} />
                ))}
              </div>
              <ErrorMsg show={!!errors.ennea} msg="Please select your Enneagram type." />
            </Card>
            <BtnRow>
              <button className="btn-back" onClick={() => goBack(2)}>← Back</button>
              <button className="btn-next" onClick={() => goNext(2)}>Continue →</button>
            </BtnRow>
          </>
        )}

        {/* ── STEP 3: ATTACHMENT ── */}
        {step === 3 && (
          <>
            <Card>
              <SectionHead>Attachment style</SectionHead>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>How do you typically show up in close relationships?</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
                This shapes how you&apos;ll engage with your accountability partner — how often you need check-ins, how you receive feedback, and what support looks like for you.
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>When you&apos;re going through something hard, you tend to…</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    ['secure',       'Reach out and ask for what you need',              'You\'re comfortable leaning on others and being leaned on. Relationships feel safe and reciprocal.'],
                    ['anxious',      'Worry about whether people are really there for you','You reach out but often second-guess the response. You need reassurance more than you let on.'],
                    ['avoidant',     'Handle it yourself first',                          'Asking for help feels uncomfortable. You prefer to process alone and present solutions, not problems.'],
                    ['disorganized', 'Both — you want connection but it also feels risky','Part of you reaches out, part of you pulls back. Support can feel overwhelming even when you need it.'],
                  ] as [Attach, string, string][]).map(([val, label, sub]) => (
                    <RadioOption key={val} name="attach" value={val} label={label} sub={sub}
                      checked={state.attach === val} onChange={() => set('attach', val)} />
                  ))}
                </div>
                <ErrorMsg show={!!errors.attach} msg="Please answer this question." />
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>When someone holds you accountable, you feel…</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    ['motivated',   'Motivated — I needed someone to say it out loud'],
                    ['seen',        'Seen — it means they were actually listening'],
                    ['defensive',   'Slightly defensive — even when I know they mean well'],
                    ['overwhelmed', 'Overwhelmed — like I\'ve let someone down'],
                  ] as [string, string][]).map(([val, label]) => (
                    <RadioOption key={val} name="acct-feel" value={val} label={label}
                      checked={state.acctFeel === val} onChange={() => set('acctFeel', val)} />
                  ))}
                </div>
                <ErrorMsg show={!!errors.acctFeel} msg="Please answer this question." />
              </div>
            </Card>
            <BtnRow>
              <button className="btn-back" onClick={() => goBack(3)}>← Back</button>
              <button className="btn-next" onClick={() => goNext(3)}>Continue →</button>
            </BtnRow>
          </>
        )}

        {/* ── STEP 4: COACHING PREFS ── */}
        {step === 4 && (
          <>
            <Card>
              <SectionHead>Your coaching preferences</SectionHead>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>Two last questions — then we build your profile</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
                These shape how your accountability partner will show up for you — and how you&apos;ll show up for them.
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>How do you prefer to receive direct feedback?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {([
                    ['straight', 'Straight and fast',       'Skip the cushioning. Tell me directly — I can handle it and prefer it.'],
                    ['context',  'With context and care',   'I receive feedback better when I understand the why behind it.'],
                    ['written',  'In writing first',        'I need to sit with it before I can respond well. Voice or live can feel like too much pressure.'],
                    ['example',  'By example, not instruction','Show me what it looks like — don\'t tell me what I should do.'],
                  ] as [Feedback, string, string][]).map(([val, label, sub]) => (
                    <RadioOption key={val} name="feedback" value={val} label={label} sub={sub}
                      checked={state.feedback === val} onChange={() => set('feedback', val)} />
                  ))}
                </div>
                <ErrorMsg show={!!errors.feedback} msg="Please answer this question." />
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>What is the one thing you most want to shift in the next 90 days?</div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px', fontStyle: 'italic' }}>
                  Be as specific as you can. "Stop overgiving" is good. "Stop saying yes to my sister's requests before I've checked with myself" is better.
                </div>
                <textarea
                  value={state.goal}
                  onChange={e => set('goal', e.target.value)}
                  placeholder="Write your 90-day focus here..."
                  style={{
                    width: '100%', padding: '10px 14px', border: `1px solid ${errors.goal ? '#c0392b' : '#e8e4dc'}`,
                    borderRadius: '10px', fontSize: '13px', fontFamily: 'inherit',
                    resize: 'vertical', minHeight: '80px', background: '#fff', color: '#1a1a1a',
                    boxSizing: 'border-box', outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#1B4332' }}
                  onBlur={e => { e.currentTarget.style.borderColor = errors.goal ? '#c0392b' : '#e8e4dc' }}
                />
                <ErrorMsg show={!!errors.goal} msg="Please share your 90-day focus." />
              </div>
            </Card>
            <BtnRow>
              <button className="btn-back" onClick={() => goBack(4)}>← Back</button>
              <button className="btn-next" onClick={() => goNext(4)}>Build my profile →</button>
            </BtnRow>
          </>
        )}

        {/* ── STEP 5: PROFILE + MATCHES ── */}
        {step === 5 && ad && ed && atd && fd && (
          <>
            {/* Profile hero */}
            <div style={{ background: ad.color, borderRadius: '14px', padding: '24px', marginBottom: '16px', color: '#fff' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '6px' }}>
                Your archetype
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>{ad.name}</h2>
              <div style={{ fontSize: '13px', color: '#9fc9a8', lineHeight: 1.5 }}>{ad.sub}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
                {ad.tags.map(t => (
                  <span key={t} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'rgba(201,168,76,.2)', color: '#C9A84C' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Trait grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Enneagram type',     val: ed.name,      desc: ed.desc },
                { label: 'Attachment style',   val: atd.name,     desc: atd.desc },
                { label: 'Feedback preference',val: fd.name,      desc: fd.desc },
                { label: '90-day focus',       val: state.goal,   desc: '' },
              ].map(({ label, val, desc }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a' }}>{val}</div>
                  {desc && <div style={{ fontSize: '11px', color: '#666', marginTop: '3px', lineHeight: 1.5 }}>{desc}</div>}
                </div>
              ))}
            </div>

            {/* Matches */}
            <Card>
              <SectionHead>Your accountability matches</SectionHead>
              <div style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>Choose your partner</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
                Based on your {ad.name} archetype, Enneagram {state.ennea}, and {atd.name.toLowerCase()} attachment style — here are your top three matches ranked by compatibility.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {matches.map(m => (
                  <div key={m.id}
                    onClick={() => setSelectedMatch(m.id)}
                    style={{
                      background: selectedMatch === m.id ? '#f8fcf9' : '#fff',
                      border: `${selectedMatch === m.id ? '2px' : '1px'} solid ${selectedMatch === m.id ? '#1B4332' : '#e8e4dc'}`,
                      borderRadius: '14px', padding: '20px', cursor: 'pointer',
                      transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700,
                        background: m.avatarBg, color: m.avatarColor, flexShrink: 0,
                      }}>{m.initials}</div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>{m.name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {archetypeData[m.archetype].name} · Enneagram {m.ennea} · {attachData[m.attach].name} attachment
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '5px' }}>
                        <span>Compatibility</span><span>{m.compat}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#e8e4dc', borderRadius: '3px' }}>
                        <div style={{ height: '6px', borderRadius: '3px', background: '#1B4332', width: `${m.compat}%`, transition: 'width .6s ease' }} />
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#888', marginBottom: '5px' }}>Why this pairing works</div>
                    <ul style={{ fontSize: '12px', color: '#555', lineHeight: 1.7, paddingLeft: '14px', marginBottom: '10px' }}>
                      {m.why.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>

                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Their 90-day focus</div>
                    <div style={{ fontSize: '12px', color: '#444', fontStyle: 'italic', marginBottom: '14px' }}>&ldquo;{m.focus}&rdquo;</div>

                    <button
                      style={{
                        width: '100%', padding: '10px', borderRadius: '10px',
                        border: `1px solid ${selectedMatch === m.id ? '#1B4332' : '#e8e4dc'}`,
                        background: selectedMatch === m.id ? '#1B4332' : '#fff',
                        color: selectedMatch === m.id ? '#fff' : '#1B4332',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all .15s',
                      }}
                    >
                      {selectedMatch === m.id ? '✓ Selected' : 'Select this partner'}
                    </button>
                  </div>
                ))}
              </div>

              <ErrorMsg show={!!errors.match} msg="Please select a match to continue." />
            </Card>

            <BtnRow>
              <button className="btn-back" onClick={() => goBack(5)}>← Back</button>
              <button className="btn-gold" onClick={confirm}>Confirm my partner →</button>
            </BtnRow>
          </>
        )}

        {/* ── STEP 6: CONFIRMATION ── */}
        {step === 6 && confirmedMatch && (
          <>
            <div style={{ background: '#1B4332', borderRadius: '14px', padding: '28px', textAlign: 'center', color: '#fff', marginBottom: '16px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(201,168,76,.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '24px' }}>✓</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>You&apos;re paired.</h2>
              <p style={{ fontSize: '13px', color: '#9fc9a8', lineHeight: 1.6, margin: 0 }}>
                You and {confirmedMatch.name} are officially partnered for the next 90 days. You both share the same Circle cohort, and your profiles have been shared with each other.
              </p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e8e4dc', borderRadius: '14px', padding: '20px' }}>
              <SectionHead>What happens next</SectionHead>
              {[
                { n: '1', h: 'Your partner receives your profile today',      p: 'They\'ll see your archetype, your 90-day focus, and how you prefer to receive feedback — so they show up for you the right way from Day 1.' },
                { n: '2', h: 'You\'ll get an intro message within 24 hours',  p: 'A brief prompt you can both use to kick off your first check-in. No awkward "so what do we do?" — we make the first move easy.' },
                { n: '3', h: 'Your first live group call is coming up',       p: 'You\'ll meet everyone in The Circle — including your partner in real time. Come ready to share your 90-day focus in one sentence.' },
                { n: '4', h: 'Re-pair option available at Day 30',            p: 'If the match doesn\'t feel right after a month, you can request a new pairing — no explanation needed. We want the partnership to actually work.' },
              ].map(({ n, h, p }) => (
                <div key={n} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#C9A84C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{n}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{h}</div>
                    <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>{p}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              {finishError && (
                <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 12 }}>{finishError}</p>
              )}
              <button
                type="button"
                onClick={finishOnboarding}
                disabled={finishing}
                style={{
                  display: 'inline-block',
                  background: finishing ? '#8aa595' : '#1B4332',
                  color: '#fff',
                  padding: '12px 32px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: finishing ? 'not-allowed' : 'pointer',
                }}
              >
                {finishing ? 'Finishing…' : 'Go to my portal →'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .btn-next {
          background: #1B4332; color: #fff; padding: 10px 22px;
          border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; font-family: inherit;
          transition: background .15s;
        }
        .btn-next:hover { background: #143326; }
        .btn-back {
          background: #fff; border: 1px solid #e8e4dc; color: #666;
          padding: 10px 22px; border-radius: 10px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all .15s;
        }
        .btn-back:hover { border-color: #999; color: #333; }
        .btn-gold {
          background: #C9A84C; color: #fff; padding: 10px 22px;
          border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; font-family: inherit;
          transition: background .15s;
        }
        .btn-gold:hover { background: #b8963f; }
      `}</style>
    </div>
  )
}
