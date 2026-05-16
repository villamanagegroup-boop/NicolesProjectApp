'use client'

// components/circle/DailyPromptCard.tsx
// Day-aware prompt card used in the Teaching tab of /circle/week/[N].
//
// Renders Monday (private journal), Wednesday (partner check-in), or Friday
// (cohort wins) in one of two states:
//   - "full" : full prompt + textarea (where applicable) + action buttons
//   - "mini" : single line summary, expandable on click
//
// Day-aware orchestration lives in the parent week page — this component just
// renders the state it's told to render.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveDailyPrompt, saveDailyPromptDraft, type DailyPromptDay } from '@/lib/circle'

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

const ORANGE      = '#B8862E'
const GREEN       = 'var(--green)'
const BLUE        = '#3a6fb2'
const PURPLE      = '#7a5ea8'

const DAY_META: Record<DailyPromptDay, {
  label: string
  short: string
  accent: string
  paleBg: string
  /** Same accent at low alpha — used for the mini-bar border. Concrete RGBA
   *  avoids the CSS-variable concat problem (`var(--green)33` is invalid). */
  miniBorder: string
  cta: string
}> = {
  monday:    { label: 'Monday journal',           short: 'MON', accent: ORANGE, paleBg: '#fdf6f2', miniBorder: 'rgba(184,134,46,0.32)', cta: 'Mark complete' },
  wednesday: { label: 'Wednesday partner prompt', short: 'WED', accent: BLUE,   paleBg: '#eef3fa', miniBorder: 'rgba(58,111,178,0.32)',  cta: 'Mark complete' },
  friday:    { label: 'Friday wins',              short: 'FRI', accent: GREEN,  paleBg: '#f0f7f1', miniBorder: 'rgba(60,140,80,0.32)',   cta: 'Keep private' },
}

interface Props {
  day: DailyPromptDay
  memberId: string
  weekNumber: number
  prompt: string
  initialText: string
  completed: boolean
  /** Forces this card into the collapsed "mini" state. The user can still expand it. */
  defaultMinimized: boolean
  /** Show partner's first name for Wednesday's "send to partner" copy. */
  partnerName?: string | null
  onSaved?: () => void
}

export default function DailyPromptCard({
  day, memberId, weekNumber, prompt, initialText, completed, defaultMinimized, partnerName, onSaved,
}: Props) {
  const router = useRouter()
  const meta = DAY_META[day]
  const [text, setText] = useState(initialText ?? '')
  const [expanded, setExpanded] = useState(!defaultMinimized)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setText(initialText ?? '')
  }, [initialText])

  // Slots are always rendered for stack consistency; when there's no prompt
  // text for the week, the card stays in a non-expandable placeholder state.
  const hasContent = !!prompt && prompt.trim().length > 0

  // Show prompt body in textarea? Friday & Monday have a response; Wednesday is action-only.
  const hasTextArea = day !== 'wednesday'
  const needsText = hasTextArea // require text before completion

  async function markComplete(): Promise<boolean> {
    if (needsText && !text.trim()) {
      setError('Add a response before marking complete.')
      return false
    }
    setSaving(true); setError('')
    const ok = await saveDailyPrompt(memberId, weekNumber, day, hasTextArea ? text.trim() : null)
    setSaving(false)
    if (!ok) { setError("Couldn't save. Try again."); return false }
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 3000)
    onSaved?.()
    return true
  }

  async function saveDraft() {
    if (!hasTextArea) return
    setSaving(true); setError('')
    const ok = await saveDailyPromptDraft(memberId, weekNumber, day, text.trim())
    setSaving(false)
    if (!ok) setError("Couldn't save draft.")
    else { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 3000); onSaved?.() }
  }

  async function shareFridayPublicly() {
    const ok = await markComplete()
    if (!ok) return
    try {
      sessionStorage.setItem(`circle:fridayDraft:${weekNumber}`, text.trim())
    } catch { /* ignore */ }
    document.getElementById('wins-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function shareWithPartner() {
    router.push('/circle/partner')
  }

  // ───── Minimized one-liner ─────
  // Always rendered for visual consistency; when there's no prompt content
  // for this week, this becomes a non-clickable placeholder so the user can
  // see which day is missing copy.
  if (!expanded) {
    const body = !hasContent
      ? <em style={{ color: 'var(--text-muted)' }}>{meta.label} — not yet posted for this week</em>
      : completed
        ? <><strong style={{ color: 'var(--ink)', fontWeight: 600 }}>✓ {meta.label}</strong> — {text.trim() || prompt}</>
        : <>{meta.label} — {prompt}</>

    return (
      <button
        onClick={() => { if (hasContent) setExpanded(true) }}
        disabled={!hasContent}
        style={{
          width: '100%', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          minHeight: 40,
          background: !hasContent ? '#f6f4ef' : completed ? '#f8f9f7' : meta.paleBg,
          border: `1px solid ${!hasContent ? 'var(--line)' : completed ? 'var(--line)' : meta.miniBorder}`,
          borderRadius: 10,
          cursor: hasContent ? 'pointer' : 'default',
          fontFamily: 'inherit',
          color: 'var(--ink)',
          transition: 'background .15s',
          opacity: hasContent ? 1 : 0.7,
        }}
      >
        <span style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em',
          color: meta.accent, flexShrink: 0,
        }}>
          {meta.short}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-soft)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {body}
        </span>
        {hasContent && (
          <span style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'inline-flex' }}><ChevronDownIcon /></span>
        )}
      </button>
    )
  }

  // ───── Full expanded card ─────
  return (
    <div style={{
      background: meta.paleBg,
      border: `1px solid ${meta.accent}`,
      borderRadius: 12,
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <p style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: meta.accent, margin: 0,
        }}>
          {meta.label}
          {completed && <span style={{ marginLeft: 8, color: 'var(--text-soft)' }}>· complete</span>}
        </p>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--text-muted)', padding: 0, fontFamily: 'inherit',
          }}
        >
          Collapse
        </button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
        {prompt}
      </p>

      {hasTextArea && (
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder={day === 'monday' ? 'Your Monday reflection…' : 'Your win for this Friday…'}
          rows={5}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid var(--line-md)',
            borderRadius: 10,
            fontSize: 13.5, lineHeight: 1.55,
            resize: 'vertical',
            background: '#fff', color: 'var(--ink)',
            fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = meta.accent }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
        />
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Monday: save / mark complete */}
        {day === 'monday' && (
          <>
            <button
              onClick={saveDraft}
              disabled={saving || !text.trim()}
              style={{ ...btnGhostStyle, opacity: (saving || !text.trim()) ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button
              onClick={markComplete}
              disabled={saving || !text.trim()}
              style={{ ...btnPrimaryStyle(meta.accent), opacity: (saving || !text.trim()) ? 0.6 : 1 }}
            >
              {completed ? 'Update & mark complete' : meta.cta}
            </button>
          </>
        )}

        {/* Wednesday: share with partner / mark complete */}
        {day === 'wednesday' && (
          <>
            <button
              onClick={markComplete}
              disabled={saving}
              style={{ ...btnGhostStyle, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : (completed ? 'Re-mark complete' : 'Mark complete')}
            </button>
            <button
              onClick={shareWithPartner}
              style={btnPrimaryStyle(meta.accent)}
            >
              {partnerName ? `Open chat with ${partnerName} →` : 'Open partner chat →'}
            </button>
          </>
        )}

        {/* Friday: keep private / share publicly */}
        {day === 'friday' && (
          <>
            <button
              onClick={markComplete}
              disabled={saving || !text.trim()}
              style={{ ...btnGhostStyle, opacity: (saving || !text.trim()) ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : 'Keep private'}
            </button>
            <button
              onClick={shareFridayPublicly}
              disabled={saving || !text.trim()}
              style={{ ...btnPrimaryStyle(meta.accent), opacity: (saving || !text.trim()) ? 0.6 : 1 }}
            >
              Share publicly →
            </button>
          </>
        )}

        {savedFlash && (
          <span style={{ fontSize: 12, color: meta.accent, fontWeight: 600 }}>✓ Saved</span>
        )}
        {error && <span style={{ fontSize: 12, color: '#c0392b', fontWeight: 600 }}>{error}</span>}
      </div>

      {day === 'wednesday' && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          The conversation lives on your partner page; marking complete just stamps this prompt.
        </p>
      )}
      {day === 'friday' && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
          Saved here for you. <strong style={{ fontWeight: 600 }}>Share publicly</strong> also jumps you to the cohort wins composer below.
        </p>
      )}
    </div>
  )
}

const btnGhostStyle: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 10,
  border: '1px solid var(--line-md)',
  background: '#fff',
  color: 'var(--ink)',
  fontSize: 13, fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'background .15s',
}

function btnPrimaryStyle(accent: string): React.CSSProperties {
  return {
    padding: '9px 16px',
    borderRadius: 10,
    border: 'none',
    background: accent,
    color: '#fff',
    fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'opacity .15s',
  }
}
