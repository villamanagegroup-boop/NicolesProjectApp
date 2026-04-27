'use client'

// components/admin/PreviewBanner.tsx
// Sticky banner shown across the top of the user portal while an admin is
// in preview mode. Doubles as the only exit point — clicking "Exit preview"
// clears sessionStorage and takes the admin back to the admin shell.

import { useRouter } from 'next/navigation'
import { usePreviewMode } from '@/hooks/usePreviewMode'

const PATH_LABELS: Record<'A' | 'B' | 'C', string> = {
  A: 'Path A · Cohort + Cards',
  B: 'Path B · Daily Cards',
  C: 'Path C · Circle',
}

export default function PreviewBanner() {
  const { preview, setPreview } = usePreviewMode()
  const router = useRouter()

  if (!preview) return null

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'linear-gradient(90deg, var(--gold-pale) 0%, #fff8e1 100%)',
        borderBottom: '1px solid var(--gold-line)',
        padding: '8px 18px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        fontFamily: 'var(--font-body)',
        boxShadow: '0 1px 0 rgba(184,146,42,0.08)',
      }}
    >
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--gold)',
        padding: '3px 9px', borderRadius: 999,
        background: '#fff', border: '1px solid var(--gold-line)',
      }}>
        Preview mode
      </span>
      <span style={{ fontSize: 12, color: 'var(--ink)' }}>
        Viewing as <strong>{PATH_LABELS[preview.path]}</strong>
        {preview.dayOverride ? <> · Day {preview.dayOverride}</> : null}
        {preview.cohortId ? <> · cohort scope active</> : null}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        Members can&apos;t see this banner.
      </span>
      <button
        onClick={() => { setPreview(null); router.push('/admin') }}
        style={{
          marginLeft: 'auto',
          fontSize: 11, fontWeight: 600,
          padding: '5px 12px', borderRadius: 7,
          background: '#fff', color: 'var(--ink)',
          border: '1px solid var(--gold-line)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Exit preview →
      </button>
    </div>
  )
}
