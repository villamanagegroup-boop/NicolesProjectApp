'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QuizResultId } from '@/types'
import ArchetypeReveal from '@/components/result/ArchetypeReveal'

const VALID_RESULTS: QuizResultId[] = ['seeker', 'healer', 'builder', 'visionary']

const IRIDESCENT_BG = `
  radial-gradient(ellipse at 12% 18%, rgba(210, 72, 60, 0.13) 0%, transparent 52%),
  radial-gradient(ellipse at 88% 12%, rgba(100, 180, 90, 0.12) 0%, transparent 48%),
  radial-gradient(ellipse at 55% 85%, rgba(230, 185, 40, 0.11) 0%, transparent 52%),
  radial-gradient(ellipse at 78% 70%, rgba(80, 170, 110, 0.10) 0%, transparent 44%),
  radial-gradient(ellipse at 20% 78%, rgba(200, 70, 55, 0.09) 0%, transparent 48%)
`.trim()

export default function QuizResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<QuizResultId | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('clarity_quiz_result') as QuizResultId | null
    const storedName = sessionStorage.getItem('clarity_lead_name') ?? ''
    if (!stored || !VALID_RESULTS.includes(stored)) {
      router.replace('/quiz')
      return
    }
    setResult(stored)
    setName(storedName)
  }, [router])

  if (!result) return null

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fdfcfa',
        backgroundImage: IRIDESCENT_BG,
        fontFamily: 'var(--font-body)',
        paddingTop: '64px',
        paddingBottom: '80px',
        position: 'relative',
      }}
    >
      {/* Home link */}
      <div style={{ position: 'absolute', top: '24px', left: '32px' }}>
        <Link
          href="/"
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          ← Home
        </Link>
      </div>

      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: '0 24px',
          textAlign: 'center',
          animation: 'fadeUp 0.3s ease forwards',
        }}
      >
        {/* Greeting */}
        {name && (
          <p style={{
            fontSize: '13px',
            color: 'rgba(12,12,10,0.35)',
            marginBottom: '32px',
            letterSpacing: '0.5px',
          }}>
            {name.split(' ')[0]}, here is your result.
          </p>
        )}

        {/* Archetype card */}
        <div style={{
          background: 'white',
          border: '1px solid rgba(12,12,10,0.08)',
          borderRadius: '16px',
          padding: '52px 48px',
          boxShadow: '0 4px 40px rgba(12,12,10,0.07), 0 1px 4px rgba(12,12,10,0.05)',
          marginBottom: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle top accent */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--green), var(--gold))',
            borderRadius: '16px 16px 0 0',
          }} />

          <ArchetypeReveal resultId={result} />
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'rgba(12,12,10,0.08)',
          margin: '0 0 48px',
        }} />

        {/* CTA section */}
        <div>
          <p style={{
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--green)',
            margin: '0 0 16px',
            fontWeight: 500,
          }}>
            Your journey continues.
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 300,
            color: 'var(--ink)',
            margin: '0 0 14px',
          }}>
            Three ways to begin.
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'rgba(12,12,10,0.5)',
            margin: '0 0 32px',
            lineHeight: 1.7,
          }}>
            Stay aligned daily, reset what's leaking, or go all the way in.
            <br />
            Every path is built around your archetype.
          </p>
          <button
            type="button"
            aria-label="Choose my path"
            onClick={() => router.push('/quiz/paths')}
            style={{
              background: 'var(--ink)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '14px 32px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              letterSpacing: '0.2px',
              maxWidth: '360px',
              width: '100%',
            }}
          >
            Choose My Path →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .archetype-emoji { font-size: 56px !important; }
          .archetype-title { font-size: 44px !important; }
        }
      `}</style>
    </div>
  )
}
