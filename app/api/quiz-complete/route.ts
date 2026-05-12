// app/api/quiz-complete/route.ts
// Called from the quiz flow once a participant submits their result.
// Adds them to the Emailit "Quiz Takers" audience with the archetype and
// leak description as custom fields so downstream campaigns can segment.
//
// Body: { email, first_name?, archetype?, leak_description? }

import { NextRequest, NextResponse } from 'next/server'
import { addSubscriber } from '@/lib/email/emailit'

interface QuizCompleteBody {
  email?: unknown
  first_name?: unknown
  archetype?: unknown
  leak_description?: unknown
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

export async function POST(request: NextRequest) {
  let body: QuizCompleteBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = asString(body.email)?.toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const audienceId = process.env.EMAILIT_QUIZ_AUDIENCE_ID
  if (!audienceId) {
    console.warn('quiz-complete: EMAILIT_QUIZ_AUDIENCE_ID not configured')
    return NextResponse.json({ received: true, synced: false }, { status: 200 })
  }

  const customFields: Record<string, unknown> = {}
  const archetype       = asString(body.archetype)
  const leakDescription = asString(body.leak_description)
  if (archetype)       customFields.archetype        = archetype
  if (leakDescription) customFields.leak_description = leakDescription

  const result = await addSubscriber({
    audienceId,
    email,
    firstName: asString(body.first_name),
    customFields: Object.keys(customFields).length ? customFields : undefined,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Failed to add subscriber', reason: result.reason ?? 'unknown' },
      { status: 502 },
    )
  }

  return NextResponse.json({ received: true, synced: true })
}
