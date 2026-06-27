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
import {
  saveDailyPrompt, saveDailyPromptDraft, saveMondayAttachments,
  uploadCircleAttachmentResult, attachmentKind,
  type DailyPromptDay, type MondayAttachment,
} from '@/lib/circle'

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
  /** Wednesday only: the coach's voice note for this week (a recording the
   *  admin uploaded). Rendered as an inline audio player. */
  voiceNoteUrl?: string | null
  /** Monday only: the member's previously-uploaded files for this week. */
  initialAttachments?: MondayAttachment[]
  onSaved?: () => void
}

export default function DailyPromptCard({
  day, memberId, weekNumber, prompt, initialText, completed, defaultMinimized,
  partnerName, voiceNoteUrl, initialAttachments, onSaved,
}: Props) {
  const router = useRouter()
  const meta = DAY_META[day]
  const [text, setText] = useState(initialText ?? '')
  const [attachments, setAttachments] = useState<MondayAttachment[]>(initialAttachments ?? [])
  const [uploading, setUploading] = useState(false)
  const [expanded, setExpanded] = useState(!defaultMinimized)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setText(initialText ?? '')
  }, [initialText])

  useEffect(() => {
    setAttachments(initialAttachments ?? [])
  }, [initialAttachments])

  // Monday: upload any file type (photo, video, voice note, doc) and persist
  // it to the member's weekly progress immediately.
  async function handleUpload(file: File) {
    setUploading(true); setError('')
    const result = await uploadCircleAttachmentResult(file)
    if (!result.url) { setUploading(false); setError(result.error ?? 'Upload failed.'); return }
    const next = [...attachments, {
      url: result.url,
      name: file.name,
      kind: attachmentKind(file.type, file.name),
    }]
    setAttachments(next)
    await saveMondayAttachments(memberId, weekNumber, next)
    setUploading(false)
    onSaved?.()
  }

  async function removeAttachment(url: string) {
    const next = attachments.filter(a => a.url !== url)
    setAttachments(next)
    await saveMondayAttachments(memberId, weekNumber, next)
    onSaved?.()
  }

  // Slots are always rendered for stack consistency; when there's no prompt
  // text for the week, the card stays in a non-expandable placeholder state.
  // Wednesday counts the coach voice note as content so members can still
  // expand the card to hear it even when there's no written prompt.
  const hasContent = (!!prompt && prompt.trim().length > 0)
    || (day === 'wednesday' && !!voiceNoteUrl)

  // Show prompt body in textarea? Friday & Monday have a response; Wednesday is action-only.
  const hasTextArea = day !== 'wednesday'
  // Monday is satisfied by text OR an uploaded file; Friday needs text.
  const hasResponse = day === 'monday'
    ? (!!text.trim() || attachments.length > 0)
    : !!text.trim()

  async function markComplete(): Promise<boolean> {
    if (hasTextArea && !hasResponse) {
      setError('Add a response or upload a file before marking complete.')
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
    // Wednesday with only a voice note (no written prompt) reads as the coach note.
    const summaryText = prompt.trim() || (day === 'wednesday' && voiceNoteUrl ? '🎙 Voice note from your coach' : '')
    const body = !hasContent
      ? <em style={{ color: 'var(--text-muted)' }}>{meta.label} — not yet posted for this week</em>
      : completed
        ? <><strong style={{ color: 'var(--ink)', fontWeight: 600 }}>✓ {meta.label}</strong> — {text.trim() || summaryText}</>
        : <>{meta.label} — {summaryText}</>

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

      {/* Wednesday: the coach's voice note for this week (plays for any week,
          so members can revisit past weeks). */}
      {day === 'wednesday' && voiceNoteUrl && (
        <div style={{
          background: '#fff', border: `1px solid ${meta.miniBorder}`,
          borderRadius: 10, padding: '12px 14px',
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: meta.accent, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🎙 Voice note from your coach
          </p>
          <audio controls preload="metadata" src={voiceNoteUrl} style={{ width: '100%', display: 'block' }} />
        </div>
      )}

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

      {/* Monday: attach any file the prompt asks for — photo, video, voice
          note, document. Uploads save immediately. */}
      {day === 'monday' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {attachments.map(a => (
                <AttachmentPreview key={a.url} att={a} onRemove={() => removeAttachment(a.url)} />
              ))}
            </div>
          )}
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
            padding: '8px 14px', borderRadius: 10, cursor: uploading ? 'wait' : 'pointer',
            background: '#fff', border: '1px dashed var(--line-md)',
            fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)', fontFamily: 'inherit',
            opacity: uploading ? 0.6 : 1,
          }}>
            {uploading ? 'Uploading…' : '📎 Add a file — photo, video, voice note, doc'}
            <input
              type="file"
              style={{ display: 'none' }}
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleUpload(f) }}
            />
          </label>
        </div>
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
              disabled={saving || !hasResponse}
              style={{ ...btnPrimaryStyle(meta.accent), opacity: (saving || !hasResponse) ? 0.6 : 1 }}
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

// Renders a member's uploaded Monday file inline by kind, with a remove button.
function AttachmentPreview({ att, onRemove }: { att: MondayAttachment; onRemove: () => void }) {
  return (
    <div style={{
      position: 'relative', background: '#fff', border: '1px solid var(--line)',
      borderRadius: 10, padding: 10,
    }}>
      <button
        onClick={onRemove}
        aria-label="Remove file"
        style={{
          position: 'absolute', top: 6, right: 6, zIndex: 1,
          width: 22, height: 22, borderRadius: '50%', border: 'none',
          background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer',
          fontSize: 13, lineHeight: 1, fontFamily: 'inherit',
        }}
      >
        ×
      </button>
      {att.kind === 'image' ? (
        <img src={att.url} alt={att.name} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
      ) : att.kind === 'video' ? (
        <video src={att.url} controls preload="metadata" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
      ) : att.kind === 'audio' ? (
        <audio src={att.url} controls preload="metadata" style={{ width: '100%', display: 'block' }} />
      ) : (
        <a
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: 'var(--green)', textDecoration: 'none', fontWeight: 600, wordBreak: 'break-all' }}
        >
          📄 {att.name}
        </a>
      )}
      {att.kind !== 'file' && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, wordBreak: 'break-all' }}>{att.name}</div>
      )}
    </div>
  )
}
