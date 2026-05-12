'use client'

// components/layout/NicoleBannerStrip.tsx
// Sticky-top banner for the channel='banner' admin messages addressed to
// the signed-in user. Dismissal persists in user_message_reads so the
// banner doesn't reappear on the next page load.
//
// Renders directly under the portal Topbar via PortalLayout. Hidden when
// there's nothing active (returns null).

import { useEffect, useState } from 'react'
import {
  fetchActiveBanners, dismissBanner,
  type AdminMessage,
} from '@/lib/admin/hooks'

export default function NicoleBannerStrip() {
  const [banners, setBanners] = useState<AdminMessage[]>([])

  useEffect(() => {
    let cancelled = false
    fetchActiveBanners().then(rows => {
      if (!cancelled) setBanners(rows)
    })
    return () => { cancelled = true }
  }, [])

  if (banners.length === 0) return null

  // Show the newest banner first; if Nicole sent two, the older one stays
  // dismissable too. Stacking them gets noisy fast — limit to top 1.
  const top = banners[0]

  function handleDismiss() {
    setBanners(prev => prev.filter(b => b.id !== top.id))
    void dismissBanner(top.id)
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'linear-gradient(90deg, rgba(184,146,42,0.12) 0%, rgba(184,146,42,0.06) 100%)',
      borderBottom: '1px solid rgba(184,146,42,0.25)',
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      fontFamily: 'var(--font-body)',
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--gold)',
        padding: '3px 8px', borderRadius: 999,
        background: '#fff', border: '1px solid rgba(184,146,42,0.3)',
        flexShrink: 0,
      }}>
        ✨ From Nicole
      </span>
      <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, flex: 1, minWidth: 0 }}>
        {top.title ? <strong style={{ marginRight: 6 }}>{top.title}</strong> : null}
        {top.body}
      </span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
          padding: '2px 6px', fontFamily: 'inherit',
        }}
      >
        ×
      </button>
    </div>
  )
}
