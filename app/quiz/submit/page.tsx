'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { scoreQuiz } from '@/lib/utils/quizUtils'
import { supabaseClient } from '@/lib/supabase/client'
import type { QuizResultId } from '@/types'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const IRIDESCENT_BG = `
  radial-gradient(ellipse at 10% 20%, rgba(210, 72, 60, 0.13) 0%, transparent 52%),
  radial-gradient(ellipse at 90% 15%, rgba(100, 180, 90, 0.12) 0%, transparent 48%),
  radial-gradient(ellipse at 50% 90%, rgba(230, 185, 40, 0.11) 0%, transparent 52%),
  radial-gradient(ellipse at 80% 65%, rgba(80, 170, 110, 0.10) 0%, transparent 44%),
  radial-gradient(ellipse at 18% 80%, rgba(200, 70, 55, 0.09) 0%, transparent 48%)
`.trim()

export default function QuizSubmitPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('clarity_quiz_answers')
    if (!raw) router.replace('/quiz')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: { name?: string; email?: string } = {}
    if (!name.trim()) newErrors.name = 'Name is required.'
    if (!email.trim()) newErrors.email = 'Email is required.'
    else if (!isValidEmail(email)) newErrors.email = 'Enter a valid email address.'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    setErrors({})

    const raw = sessionStorage.getItem('clarity_quiz_answers')
    const answers: Record<number, number> = raw ? JSON.parse(raw) : {}
    const result: QuizResultId = scoreQuiz(answers)

    try {
      await supabaseClient.from('quiz_leads').insert({
        name: name.trim(),
        email: email.trim(),
        quiz_result: result,
        answers_json: answers,
      })
    } catch (err) {
      console.error('Supabase insert error:', err)
    }

    sessionStorage.setItem('clarity_quiz_result', result)
    sessionStorage.setItem('clarity_lead_name', name.trim())
    router.push('/quiz/result')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fdfcfa',
        backgroundImage: IRIDESCENT_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        fontFamily: 'var(--font-body)',
        position: 'relative',
      }}
    >
      {/* Home link */}
      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Link
          href="/"
          style={{
            fontSize: '13px',
            color: 'rgba(12,12,10,0.4)',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
          }}
        >
          ← Home
        </Link>
      </div>

      <div style={{ position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            color: 'var(--ink)',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
          }}
        >
          ✦ Seal Your Leak
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <p
          style={{
            fontSize: '10px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'var(--green)',
            margin: '0 0 16px',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          Your result is ready.
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '42px',
            fontWeight: 300,
            color: 'var(--ink)',
            margin: '0 0 16px',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          One last step.
        </h1>

        <p
          style={{
            fontSize: '14px',
            color: 'rgba(12,12,10,0.55)',
            fontWeight: 300,
            textAlign: 'center',
            lineHeight: 1.7,
            margin: '0 0 40px',
          }}
        >
          Enter your name and email to unlock your archetype result
          and discover which path is right for you.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '28px' }}>
            <label
              htmlFor="quiz-name"
              style={{
                display: 'block',
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'rgba(12,12,10,0.4)',
                marginBottom: '8px',
              }}
            >
              Full Name
            </label>
            <input
              id="quiz-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: errors.name ? '1px solid rgba(180,40,40,0.5)' : '1px solid rgba(12,12,10,0.18)',
                color: 'var(--ink)',
                fontSize: '16px',
                padding: '8px 0',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                caretColor: 'var(--green)',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
              onBlur={e => { e.currentTarget.style.borderBottomColor = errors.name ? 'rgba(180,40,40,0.5)' : 'rgba(12,12,10,0.18)' }}
            />
            {errors.name && (
              <p style={{ fontSize: '12px', color: 'rgba(180,40,40,0.8)', margin: '6px 0 0' }}>
                {errors.name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label
              htmlFor="quiz-email"
              style={{
                display: 'block',
                fontSize: '11px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'rgba(12,12,10,0.4)',
                marginBottom: '8px',
              }}
            >
              Email Address
            </label>
            <input
              id="quiz-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: errors.email ? '1px solid rgba(180,40,40,0.5)' : '1px solid rgba(12,12,10,0.18)',
                color: 'var(--ink)',
                fontSize: '16px',
                padding: '8px 0',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                caretColor: 'var(--green)',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderBottomColor = 'var(--green)' }}
              onBlur={e => { e.currentTarget.style.borderBottomColor = errors.email ? 'rgba(180,40,40,0.5)' : 'rgba(12,12,10,0.18)' }}
            />
            {errors.email && (
              <p style={{ fontSize: '12px', color: 'rgba(180,40,40,0.8)', margin: '6px 0 0' }}>
                {errors.email}
              </p>
            )}
          </div>

          <p
            style={{
              fontSize: '12px',
              color: 'rgba(12,12,10,0.35)',
              margin: '0 0 32px',
              lineHeight: 1.6,
            }}
          >
            By continuing, you&apos;ll be added to our email list.
            We only send things worth reading.
          </p>

          <button
            type="submit"
            disabled={submitting}
            aria-label="Reveal my quiz result"
            style={{
              width: '100%',
              background: submitting ? 'rgba(31,92,58,0.5)' : 'var(--green)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '15px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              cursor: submitting ? 'not-allowed' : 'pointer',
              letterSpacing: '0.2px',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Saving…' : 'Reveal My Result →'}
          </button>
        </form>
      </div>
    </div>
  )
}
