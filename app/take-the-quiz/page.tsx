'use client'

// app/take-the-quiz/page.tsx
// Failsafe landing for users who reached a program without taking the quiz.
//
// When this fires:
//   - User paid via a Stripe payment link and was manually claimed by an
//     admin without doing the quiz funnel.
//   - User had their quiz_result cleared in Supabase.
//   - Direct signup with a path param skipped the funnel somehow.
//
// The portal layout guard sends them here. They have two ways out:
//   1. Take a 12-question standalone quiz (writes to their user row, then
//      redirects to their proper dashboard).
//   2. Email Nicole if they'd rather talk to a human.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

const SUPPORT_EMAIL = 'nicole@theenergyleader.com'

const PATH_NAMES: Record<'A' | 'B' | 'C', string> = {
  A: 'Seal the Leak',
  B: '365 Days of Alignment',
  C: 'The Circle',
}

const IRIDESCENT_BG = [
  'radial-gradient(ellipse at 12% 18%, rgba(210, 72, 60, 0.10) 0%, transparent 52%)',
  'radial-gradient(ellipse at 88% 12%, rgba(100, 180, 90, 0.09) 0%, transparent 48%)',
  'radial-gradient(ellipse at 55% 85%, rgba(230, 185, 40, 0.09) 0%, transparent 52%)',
  'radial-gradient(ellipse at 78% 70%, rgba(80, 170, 110, 0.08) 0%, transparent 44%)',
].join(', ')

export default function TakeTheQuizPage() {
  const router = useRouter()
  const [name, setName]             = useState<string | null>(null)
  const [path, setPath]             = useState<'A' | 'B' | 'C' | null>(null)
  const [hasQuiz, setHasQuiz]       = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser()
      if (cancelled) return
      if (!authUser) {
        // No auth — page is meant for signed-in users, but we still render
        // it (with generic copy) so the email CTA works. Don't force /login.
        setAuthChecked(true)
        return
      }
      const { data: profile } = await supabaseClient
        .from('users')
        .select('name, selected_path, quiz_result')
        .eq('id', authUser.id)
        .maybeSingle()
      if (cancelled) return
      setName((profile?.name as string | null) ?? null)
      setPath((profile?.selected_path as 'A' | 'B' | 'C' | null) ?? null)
      setHasQuiz(!!profile?.quiz_result)
      setAuthChecked(true)
    })()
    return () => { cancelled = true }
  }, [])

  // Render the welcome letter regardless of state — admins previewing it
  // and users retaking the quiz both need to see it. The portal layout
  // handles routing legitimate users in; this page just needs to load.

  const firstName = name?.trim()?.split(/\s+/)[0] ?? 'friend'
  const programName = path ? PATH_NAMES[path] : 'your program'
  const dashboardHref = path === 'A' ? '/program' : path === 'C' ? '/circle' : '/dashboard'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fdfcfa',
      backgroundImage: IRIDESCENT_BG,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ width: '100%', maxWidth: 540 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--green)', margin: '0 0 14px',
          }}>
            ✦ A quick step before you start
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 38, fontWeight: 300, fontStyle: 'italic',
            color: 'var(--ink)',
            margin: 0, lineHeight: 1.15,
          }}>
            Welcome, {firstName}.
          </h1>
        </div>

        {/* Letter */}
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '32px 32px 28px',
          marginBottom: 16,
          boxShadow: '0 4px 24px rgba(12,12,10,0.04)',
        }}>
          <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.75, margin: '0 0 16px' }}>
            We&apos;re so glad you&apos;re here.
          </p>
          <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.75, margin: '0 0 16px' }}>
            You&apos;re officially in <strong>{programName}</strong>, and your spot is secured.
            Before we open the doors, there&apos;s one short step left:
            a 12-question quiz that reveals your <em>archetype</em>.
          </p>
          <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.75, margin: '0 0 16px' }}>
            Your archetype shapes the daily prompts, journal entries, and
            (for The Circle) which weekly track you follow. It takes about
            three minutes and we won&apos;t use it for anything else.
          </p>
          <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.75, margin: 0 }}>
            When you&apos;re ready, take the quiz below — or, if you&apos;d
            rather chat with a human first, the team is one email away.
          </p>
        </div>

        {/* Primary CTA */}
        <Link
          href="/quiz/standalone"
          style={{
            display: 'block',
            width: '100%',
            background: 'var(--green)',
            color: '#ffffff',
            padding: '15px 18px',
            borderRadius: 10,
            fontSize: 15, fontWeight: 600,
            fontFamily: 'var(--font-body)',
            textAlign: 'center',
            textDecoration: 'none',
            letterSpacing: '0.2px',
            boxSizing: 'border-box',
            marginBottom: 10,
          }}
        >
          Take the quiz · 3 minutes →
        </Link>

        {/* Secondary CTA */}
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Help getting started')}&body=${encodeURIComponent(`Hi Nicole,\n\nI just signed up for ${programName} and have a question before I take the quiz.\n\n— ${firstName}`)}`}
          style={{
            display: 'block',
            width: '100%',
            background: '#ffffff',
            color: 'var(--ink)',
            padding: '13px 18px',
            borderRadius: 10,
            fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--font-body)',
            textAlign: 'center',
            textDecoration: 'none',
            border: '1px solid var(--line-md)',
            boxSizing: 'border-box',
          }}
        >
          Email Nicole at {SUPPORT_EMAIL}
        </a>

        {/* Footer */}
        <p style={{
          fontSize: 11, color: 'var(--text-muted)',
          textAlign: 'center', margin: '24px 0 0', lineHeight: 1.6,
        }}>
          Already took the quiz somewhere else? Just retake it — we&apos;ll
          use your latest result.
        </p>

        {/* Escape hatch for users who already have a quiz result —
            they're here either by retaking or by accident. */}
        {authChecked && hasQuiz && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)',
            textAlign: 'center', margin: '12px 0 0', lineHeight: 1.6,
          }}>
            Looks like you&apos;ve already taken the quiz.{' '}
            <button
              onClick={() => router.push(dashboardHref)}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: 'var(--green)', textDecoration: 'underline',
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              }}
            >
              Back to {programName} →
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
