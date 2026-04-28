'use client'

// app/(admin)/admin/cards/page.tsx
// Edit the 365-day card deck. Lists every day in a tight table; clicking a
// row opens an inline editor (title, theme, body, affirmation, journal prompt,
// emoji, color). Saves go straight to public.daily_cards.

import { useEffect, useState } from 'react'
import { fetchDailyCards, updateDailyCard, type DailyCardRow } from '@/lib/admin/hooks'

export default function AdminCardsPage() {
  const [cards, setCards] = useState<DailyCardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [jumpDay, setJumpDay] = useState<number | null>(null) // null = all days; number = single day view
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<DailyCardRow>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function jumpTo(day: number) {
    if (!Number.isFinite(day) || day < 1 || day > 365) return
    setJumpDay(day)
    setSearch('')
    // Auto-open the matching card for editing.
    const card = cards.find(c => c.day_number === day)
    if (card) {
      setEditingId(card.id)
      setDraft({ ...card })
    }
  }

  async function refresh() {
    setLoading(true)
    setCards(await fetchDailyCards())
    setLoading(false)
  }
  useEffect(() => { refresh() }, [])

  function openEdit(card: DailyCardRow) {
    setEditingId(card.id)
    setDraft({ ...card })
    setError(null)
  }
  function cancel() {
    setEditingId(null)
    setDraft({})
    setError(null)
  }
  async function save(id: string) {
    setSavingId(id)
    setError(null)
    const { error } = await updateDailyCard(id, {
      theme:          draft.theme,
      title:          draft.title,
      body_text:      draft.body_text,
      affirmation:    draft.affirmation,
      journal_prompt: draft.journal_prompt,
      image_url:      draft.image_url,
      card_color:     draft.card_color,
      emoji:          draft.emoji,
    })
    setSavingId(null)
    if (error) {
      setError(error.message)
      return
    }
    setEditingId(null)
    setDraft({})
    await refresh()
  }

  const filtered = jumpDay
    ? cards.filter(c => c.day_number === jumpDay)
    : search.trim()
    ? cards.filter(c => {
        const q = search.toLowerCase()
        return (
          c.title.toLowerCase().includes(q) ||
          c.theme.toLowerCase().includes(q) ||
          (c.body_text ?? '').toLowerCase().includes(q) ||
          String(c.day_number) === q
        )
      })
    : cards

  const S = {
    h1: { fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0 },
    sub: { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' },
    input: {
      background: '#fff', border: '1px solid var(--line-md)', borderRadius: 8,
      color: 'var(--ink)', fontSize: 13, padding: '7px 10px', outline: 'none',
      fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
    },
    label: { fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 4, display: 'block' as const },
    btn: (variant: 'primary' | 'ghost') => ({
      fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 7,
      cursor: 'pointer', border: 'none', fontFamily: 'inherit',
      background: variant === 'primary' ? 'var(--gold)' : 'var(--line)',
      color: variant === 'primary' ? '#fff' : 'var(--text-soft)',
    }),
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={S.h1}>Daily cards — 365 deck</h1>
          <p style={S.sub}>{cards.length} cards on file. Jump to a day, or search to filter.</p>
        </div>
        <input
          placeholder="Search by title, theme, or day…"
          value={search}
          onChange={e => { setSearch(e.target.value); if (jumpDay) setJumpDay(null) }}
          style={{ ...S.input, width: 280, maxWidth: '100%' }}
        />
      </div>

      {/* Day-on-demand jump bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
        padding: '10px 14px', background: '#fff', border: '1px solid var(--line)',
        borderRadius: 10, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Jump to day
        </span>
        <button
          onClick={() => jumpTo((jumpDay ?? 1) - 1)}
          disabled={!jumpDay || jumpDay <= 1}
          style={{ ...S.btn('ghost'), opacity: !jumpDay || jumpDay <= 1 ? 0.4 : 1 }}
          aria-label="Previous day"
        >
          ←
        </button>
        <input
          type="number"
          min={1}
          max={365}
          value={jumpDay ?? ''}
          placeholder="1–365"
          onChange={e => {
            const v = e.target.value
            if (v === '') { setJumpDay(null); return }
            const n = Number(v)
            if (Number.isFinite(n) && n >= 1 && n <= 365) jumpTo(n)
          }}
          style={{ ...S.input, width: 90, textAlign: 'center' as const }}
        />
        <button
          onClick={() => jumpTo((jumpDay ?? 0) + 1)}
          disabled={!!jumpDay && jumpDay >= 365}
          style={{ ...S.btn('ghost'), opacity: !!jumpDay && jumpDay >= 365 ? 0.4 : 1 }}
          aria-label="Next day"
        >
          →
        </button>
        {jumpDay && (
          <button onClick={() => { setJumpDay(null); cancel() }} style={S.btn('ghost')}>
            Show all {cards.length}
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {jumpDay ? `Viewing day ${jumpDay}` : `${filtered.length} of ${cards.length} shown`}
        </span>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading deck…</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((card, i) => {
            const isEditing = editingId === card.id
            return (
              <div key={card.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                {/* Row */}
                <div
                  onClick={() => isEditing ? cancel() : openEdit(card)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', cursor: 'pointer',
                    background: isEditing ? 'rgba(184,146,42,0.10)' : '#fff',
                    borderLeft: isEditing ? '3px solid var(--gold)' : '3px solid transparent',
                    fontSize: 13,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--text-muted)',
                    minWidth: 44, fontSize: 11, flexShrink: 0,
                  }}>
                    Day {card.day_number}
                  </span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{card.emoji ?? '✦'}</span>
                  <span style={{
                    flex: '1 1 200px', minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: 600, color: 'var(--ink)',
                  }}>
                    {card.title}
                  </span>
                  <span style={{
                    fontSize: 11, color: 'var(--text-muted)', flexShrink: 0,
                    maxWidth: 160,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {card.theme}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gold)', flexShrink: 0, fontWeight: 600 }}>
                    {isEditing ? 'Editing' : 'Edit →'}
                  </span>
                </div>

                {/* Editor */}
                {isEditing && (
                  <div style={{ padding: '14px 18px 18px 50px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 100px 1fr', gap: 10 }}>
                      <div>
                        <label style={S.label}>Emoji</label>
                        <input
                          value={draft.emoji ?? ''}
                          onChange={e => setDraft({ ...draft, emoji: e.target.value })}
                          style={S.input}
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <label style={S.label}>Color</label>
                        <input
                          type="color"
                          value={draft.card_color ?? '#1a2e20'}
                          onChange={e => setDraft({ ...draft, card_color: e.target.value })}
                          style={{ ...S.input, padding: '3px 4px', height: 33 }}
                        />
                      </div>
                      <div>
                        <label style={S.label}>Theme</label>
                        <input
                          value={draft.theme ?? ''}
                          onChange={e => setDraft({ ...draft, theme: e.target.value })}
                          style={S.input}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={S.label}>Title</label>
                      <input
                        value={draft.title ?? ''}
                        onChange={e => setDraft({ ...draft, title: e.target.value })}
                        style={S.input}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Body</label>
                      <textarea
                        rows={4}
                        value={draft.body_text ?? ''}
                        onChange={e => setDraft({ ...draft, body_text: e.target.value })}
                        style={{ ...S.input, resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Affirmation</label>
                      <textarea
                        rows={2}
                        value={draft.affirmation ?? ''}
                        onChange={e => setDraft({ ...draft, affirmation: e.target.value })}
                        style={{ ...S.input, resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Journal prompt</label>
                      <textarea
                        rows={2}
                        value={draft.journal_prompt ?? ''}
                        onChange={e => setDraft({ ...draft, journal_prompt: e.target.value })}
                        style={{ ...S.input, resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={S.label}>Image URL</label>
                      <input
                        value={draft.image_url ?? ''}
                        onChange={e => setDraft({ ...draft, image_url: e.target.value })}
                        placeholder="https://…"
                        style={S.input}
                      />
                    </div>
                    {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => save(card.id)} disabled={savingId === card.id} style={S.btn('primary')}>
                        {savingId === card.id ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={cancel} style={S.btn('ghost')}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {cards.length === 0 ? 'No cards in the deck yet.' : 'No cards match that search.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
