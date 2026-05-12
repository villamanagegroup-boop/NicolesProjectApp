// lib/email/unsubscribe.ts
// Stateless, signed unsubscribe tokens. Each email's unsubscribe link
// contains `?token=<base64url-payload>.<hmac>` — the server verifies the
// HMAC and flips the corresponding notification_prefs flag.
//
// Why HMAC and not a DB-stored token: we don't want to track every email
// send, and revocation isn't a concern (unsubscribing is idempotent).

import crypto from 'crypto'

// kinds users can opt out of — must match column keys in notification_prefs
export type NotificationKind = 'daily_reminder' | 'weekly_digest' | 'milestone_alerts'

const VERSION = 'v1'

function getSecret(): string {
  // Prefer a dedicated secret; fall back to the service-role key so the
  // feature works the moment Supabase is configured. Never use a public key.
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('No secret available to sign unsubscribe tokens')
  return secret
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

export function signUnsubscribeToken(userId: string, kind: NotificationKind): string {
  const payload = `${VERSION}.${userId}.${kind}`
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest()
  return `${base64url(Buffer.from(payload))}.${base64url(sig)}`
}

export function verifyUnsubscribeToken(token: string): { userId: string; kind: NotificationKind } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payloadB64, sigB64] = parts

  let payload: string
  try {
    payload = fromBase64url(payloadB64).toString('utf8')
  } catch {
    return null
  }

  // Re-sign the payload and compare in constant time.
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest()
  let provided: Buffer
  try {
    provided = fromBase64url(sigB64)
  } catch {
    return null
  }
  if (expected.length !== provided.length) return null
  if (!crypto.timingSafeEqual(expected, provided)) return null

  const [version, userId, kindRaw] = payload.split('.')
  if (version !== VERSION) return null
  if (!userId) return null
  if (kindRaw !== 'daily_reminder' && kindRaw !== 'weekly_digest' && kindRaw !== 'milestone_alerts') {
    return null
  }
  return { userId, kind: kindRaw }
}

/** Builds the unsubscribe URL for use in marketing email footers. */
export function unsubscribeUrl(appBaseUrl: string, userId: string, kind: NotificationKind): string {
  const token = signUnsubscribeToken(userId, kind)
  return `${appBaseUrl.replace(/\/$/, '')}/unsubscribe?token=${encodeURIComponent(token)}`
}

/** HTML snippet for the footer of marketing emails. CAN-SPAM compliant. */
export function unsubscribeFooterHtml(appBaseUrl: string, userId: string, kind: NotificationKind): string {
  const url = unsubscribeUrl(appBaseUrl, userId, kind)
  return `
    <p style="margin:24px auto 0;font-size:11px;color:#8a857a;text-align:center;line-height:1.6;">
      You're receiving this because you signed up for The Energy Leader.
      <br />
      <a href="${url}" style="color:#8a857a;text-decoration:underline;">Unsubscribe from these emails</a>
      &nbsp;·&nbsp;
      <a href="${appBaseUrl.replace(/\/$/, '')}/settings" style="color:#8a857a;text-decoration:underline;">Manage all preferences</a>
    </p>`.trim()
}
