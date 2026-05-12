// lib/email/emailit.ts
// Thin wrapper around Emailit's REST API.
// API base: https://api.emailit.com/v2 with Bearer auth.
// Docs: https://emailit.com/docs/api-reference
//
// Behavior:
//   - If EMAILIT_API_KEY (or EMAILIT_FROM, for sendEmail) is not set, the
//     functions become no-ops that log and return { ok: false, reason:
//     'not_configured' }. Lets us write call sites unconditionally — the
//     integration turns on the moment the env vars land in Vercel.
//   - All call sites should treat results as fire-and-forget. Audience
//     mutations and email delivery must never block a feature path.

interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  text?: string
  /** Override the default From for transactional vs admin alerts if needed. */
  from?: string
  /** Reply-to address. Defaults to EMAILIT_REPLY_TO if set. */
  replyTo?: string
  /** Idempotency key — Emailit dedupes for 24 hours. Use for at-most-once
   *  delivery on user-triggered events (e.g. seal-day-7). */
  idempotencyKey?: string
}

export interface SendEmailResult {
  sent: boolean
  reason?: 'not_configured' | 'http_error' | 'exception'
  status?: number
  body?: unknown
}

const EMAILIT_BASE = 'https://api.emailit.com/v2'
const EMAILIT_ENDPOINT = `${EMAILIT_BASE}/emails`

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.EMAILIT_API_KEY
  const from   = input.from ?? process.env.EMAILIT_FROM
  const replyTo = input.replyTo ?? process.env.EMAILIT_REPLY_TO

  if (!apiKey || !from) {
    console.log('[email] skipped — EMAILIT_API_KEY or EMAILIT_FROM not configured', {
      to: input.to, subject: input.subject,
    })
    return { sent: false, reason: 'not_configured' }
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type':  'application/json',
  }
  if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey

  const body: Record<string, unknown> = {
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  }
  if (input.text)  body.text     = input.text
  if (replyTo)     body.reply_to = replyTo

  try {
    const res = await fetch(EMAILIT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[email] Emailit non-OK', res.status, errBody)
      return { sent: false, reason: 'http_error', status: res.status, body: errBody }
    }
    const data = await res.json().catch(() => null)
    return { sent: true, status: res.status, body: data }
  } catch (err) {
    console.error('[email] send failed', err)
    return { sent: false, reason: 'exception', body: String(err) }
  }
}

// ── Audience / subscriber management ───────────────────────────────────────
// Used to segment people across lifecycle stages — e.g. quiz takers move
// into a "buyers" audience when they purchase, and are removed from "quiz
// takers" so they stop receiving lead-nurture emails.

interface AudienceResult {
  ok: boolean
  reason?: 'not_configured' | 'http_error' | 'exception'
  status?: number
  body?: unknown
}

interface AddSubscriberInput {
  audienceId: string
  email: string
  firstName?: string
  /** Arbitrary Emailit custom fields — keys must match the audience schema. */
  customFields?: Record<string, unknown>
}

export async function addSubscriber(input: AddSubscriberInput): Promise<AudienceResult> {
  const apiKey = process.env.EMAILIT_API_KEY
  if (!apiKey) {
    console.log('[emailit] addSubscriber skipped — EMAILIT_API_KEY not configured', {
      audienceId: input.audienceId, email: input.email,
    })
    return { ok: false, reason: 'not_configured' }
  }
  if (!input.audienceId) {
    console.warn('[emailit] addSubscriber skipped — missing audienceId')
    return { ok: false, reason: 'not_configured' }
  }

  const body: Record<string, unknown> = { email: input.email.toLowerCase() }
  if (input.firstName)    body.first_name    = input.firstName
  if (input.customFields) body.custom_fields = input.customFields

  try {
    const res = await fetch(`${EMAILIT_BASE}/audiences/${encodeURIComponent(input.audienceId)}/subscribers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[emailit] addSubscriber non-OK', res.status, errBody)
      return { ok: false, reason: 'http_error', status: res.status, body: errBody }
    }
    const data = await res.json().catch(() => null)
    return { ok: true, status: res.status, body: data }
  } catch (err) {
    console.error('[emailit] addSubscriber failed', err)
    return { ok: false, reason: 'exception', body: String(err) }
  }
}

interface RemoveSubscriberInput {
  audienceId: string
  /** Emailit accepts the email address as the subscriber identifier. */
  email: string
}

export async function removeSubscriber(input: RemoveSubscriberInput): Promise<AudienceResult> {
  const apiKey = process.env.EMAILIT_API_KEY
  if (!apiKey) {
    console.log('[emailit] removeSubscriber skipped — EMAILIT_API_KEY not configured', {
      audienceId: input.audienceId, email: input.email,
    })
    return { ok: false, reason: 'not_configured' }
  }
  if (!input.audienceId) {
    console.warn('[emailit] removeSubscriber skipped — missing audienceId')
    return { ok: false, reason: 'not_configured' }
  }

  try {
    const res = await fetch(
      `${EMAILIT_BASE}/audiences/${encodeURIComponent(input.audienceId)}/subscribers/${encodeURIComponent(input.email.toLowerCase())}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      },
    )
    // 404 = already gone, treat as success for idempotency.
    if (!res.ok && res.status !== 404) {
      const errBody = await res.text().catch(() => '')
      console.error('[emailit] removeSubscriber non-OK', res.status, errBody)
      return { ok: false, reason: 'http_error', status: res.status, body: errBody }
    }
    return { ok: true, status: res.status }
  } catch (err) {
    console.error('[emailit] removeSubscriber failed', err)
    return { ok: false, reason: 'exception', body: String(err) }
  }
}
