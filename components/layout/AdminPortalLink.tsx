'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

// Tiny shield icon — visually marks the link as elevated/admin
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1l5 2v5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V3l5-2z" />
    </svg>
  )
}

/**
 * Renders a "Back to admin portal" link in member-app sidebars — but only
 * when the signed-in user has a row in admin_roles. Returns null otherwise,
 * so regular members never see it.
 */
export default function AdminPortalLink() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return
      const { data } = await supabaseClient
        .from('admin_roles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!cancelled) setIsAdmin(!!data)
    })()
    return () => { cancelled = true }
  }, [])

  if (!isAdmin) return null

  return (
    <Link
      href="/admin"
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        color: 'var(--ink)',
        background: 'var(--gold-pale)',
        border: '1px solid var(--gold-line)',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--paper2)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--gold-pale)' }}
    >
      <ShieldIcon />
      Back to admin portal
    </Link>
  )
}
