'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'
import RoleBadge from './RoleBadge'

const ORANGE      = '#B8862E'
const ORANGE_PALE = 'rgba(184,134,46,0.08)'
const ORANGE_DIM  = 'rgba(184,134,46,0.55)'
const ORANGE_LINE = 'rgba(184,134,46,0.25)'

const GREEN     = '#1F5C3A'
const GREEN_DIM = 'rgba(31,92,58,0.55)'

/**
 * User identity card shown at the bottom of every member-app sidebar and the
 * mobile drawer. Always renders for signed-in users:
 *   • Admins  → orange avatar + name + "Admin" badge + "Open admin portal →"
 *   • Members → green  avatar + name + "Member" badge (no button)
 *
 * The component name is historical (it used to be admin-only); the import path
 * is preserved across all four sidebars so behavior stays a one-line change.
 */
export default function AdminPortalLink({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [displayName, setDisplayName] = useState<string>('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user || cancelled) return
      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabaseClient.from('users').select('name').eq('id', user.id).maybeSingle(),
        supabaseClient.from('admin_roles').select('id').eq('user_id', user.id).maybeSingle(),
      ])
      if (cancelled) return
      const fallback = user.email?.split('@')[0] ?? 'You'
      setDisplayName(profile?.name?.trim() || fallback)
      setIsAdmin(!!roleRow)
      setLoaded(true)
    })()
    return () => { cancelled = true }
  }, [])

  // Skip first paint until we know the role — prevents flashing "Member" on
  // an admin or vice versa, which is jarring on every nav.
  if (!loaded) return null

  const accent     = isAdmin ? ORANGE     : GREEN
  const accentDim  = isAdmin ? ORANGE_DIM : GREEN_DIM

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${accent}, ${accentDim})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {displayName.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{
            fontSize: '12px', fontWeight: 600, color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}>
            {displayName}
          </div>
          <RoleBadge role={isAdmin ? 'admin' : 'member'} />
        </div>
      </div>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={onNavigate}
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '8px 12px',
            background: ORANGE_PALE,
            color: ORANGE,
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            border: `1px solid ${ORANGE_LINE}`,
            fontFamily: 'var(--font-body)',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(184,134,46,0.14)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ORANGE_PALE }}
        >
          Open admin portal →
        </Link>
      )}
    </div>
  )
}
