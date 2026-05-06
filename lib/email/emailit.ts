// lib/email/emailit.ts
// Thin wrapper around Emailit's REST API.
// API: POST https://api.emailit.com/v2/emails  with Bearer auth.
// Docs: https://emailit.com/docs/api-reference/emails/send
//
// Behavior:
//   - If EMAILIT_API_KEY or EMAILIT_FROM is not set, sendEmail() becomes a
//     no-op that logs and returns { sent: false, reason: 'not_configured' }.
//     Lets us write call sites unconditionally — emails turn on the moment
//     the env vars land in Vercel, no code change needed.
//   - All call sites should treat the result as fire-and-forget. Email
//     delivery should never block a feature path.

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

const EMAILIT_ENDPOINT = 'https://api.emailit.com/v2/emails'

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
