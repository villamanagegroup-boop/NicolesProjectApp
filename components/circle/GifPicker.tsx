'use client'

// components/circle/GifPicker.tsx
// Inline GIF picker backed by Giphy v1.
// - Click the trigger to open a popover anchored above it.
// - Empty query → /v1/gifs/trending. Typing → debounced /v1/gifs/search.
// - Click a tile → fires onPick with the optimized GIF URL and closes.
// - No-ops cleanly when NEXT_PUBLIC_GIPHY_API_KEY isn't configured (the
//   trigger button hides itself), so the rest of the UI keeps working.

import { useEffect, useRef, useState } from 'react'

interface GifPickerProps {
  onPick: (gifUrl: string) => void
  /** Override the trigger button label (default "GIF"). */
  label?: string
  align?: 'left' | 'right'
}

interface GiphyImage {
  url: string
  width:  string
  height: string
}
interface GiphyResult {
  id: string
  title: string
  images: {
    fixed_height?:        GiphyImage
    fixed_height_small?:  GiphyImage
    original?:            GiphyImage
  }
}

const ORANGE = '#B8862E'

export default function GifPicker({ onPick, label = 'GIF', align = 'left' }: GifPickerProps) {
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState<GiphyResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY

  // Debounced search; runs immediately for the empty query (Trending fallback).
  useEffect(() => {
    if (!open || !apiKey) return
    const delay = query.trim() ? 350 : 0
    const t = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const base = query.trim()
          ? `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(query)}`
          : 'https://api.giphy.com/v1/gifs/trending?'
        const url = `${base}${query.trim() ? '&' : ''}api_key=${apiKey}&limit=24&rating=pg-13`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Giphy ${res.status}`)
        const data = await res.json()
        setResults(Array.isArray(data.data) ? data.data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load GIFs')
        setResults([])
      } finally {
        setLoading(false)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [query, open, apiKey])

  // Outside-click + ESC dismiss
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // No key → render nothing. The picker is invisible until the env var lands.
  if (!apiKey) return null

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Pick a GIF"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, padding: '6px 12px', borderRadius: 999,
          border: `1px solid ${open ? ORANGE : 'var(--line-md)'}`,
          background: open ? '#fdf6f2' : '#fff',
          color: open ? ORANGE : 'var(--text-soft)',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
          transition: 'all .15s',
        }}
      >
        <span style={{ fontSize: 13 }}>🎞️</span>
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="GIF picker"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            [align]: 0,
            zIndex: 60,
            width: 360,
            maxWidth: 'calc(100vw - 40px)',
            background: '#ffffff',
            border: '1px solid var(--line-md)',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(12,12,10,0.18)',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search GIFs…"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '8px 12px', borderRadius: 8,
              border: '1px solid var(--line)',
              fontSize: 13, fontFamily: 'inherit',
              outline: 'none', color: 'var(--ink)',
              background: 'var(--paper2)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
          />

          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: 0, textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* Results grid — 3 columns. Trending GIFs when query is empty. */}
          <div style={{
            maxHeight: 320,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            scrollbarWidth: 'thin',
          }}>
            {loading ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '20px 0', margin: 0 }}>
                Loading GIFs…
              </p>
            ) : results.length === 0 ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '20px 0', margin: 0 }}>
                {query.trim() ? 'No GIFs found.' : ''}
              </p>
            ) : (
              results.map(r => {
                // Preview = small animated thumb. Full = optimized 200px-tall.
                const preview = r.images.fixed_height_small?.url ?? r.images.fixed_height?.url
                const full    = r.images.fixed_height?.url ?? r.images.original?.url ?? preview
                if (!preview || !full) return null
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { onPick(full); setOpen(false) }}
                    aria-label={r.title || 'GIF'}
                    style={{
                      padding: 0,
                      border: '1px solid transparent',
                      borderRadius: 8,
                      background: 'var(--paper2)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      aspectRatio: '1 / 1',
                      transition: 'border-color .12s, transform .12s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = ORANGE;
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={r.title || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </button>
                )
              })
            )}
          </div>

          <p style={{
            fontSize: 10, color: 'var(--text-muted)',
            margin: 0, textAlign: 'center',
            letterSpacing: '0.04em',
          }}>
            Powered by GIPHY
          </p>
        </div>
      )}
    </div>
  )
}
