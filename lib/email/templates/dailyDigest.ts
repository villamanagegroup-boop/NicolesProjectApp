// lib/email/templates/dailyDigest.ts
// Daily "what's waiting for you" digest. Built only when there's at least one
// item (the cron skips empty digests), so the email always has substance.
//
// CAN-SPAM footer is included via unsubscribeFooterHtml (kind 'daily_reminder')
// and the cron also sets one-click List-Unsubscribe headers.

import { unsubscribeFooterHtml } from '@/lib/email/unsubscribe'
import type { DigestItem } from '@/lib/notifications/digest'

interface DigestVars {
  firstName: string
  items: DigestItem[]
  appBaseUrl: string
  userId: string
}

const ACCENT = '#7A1F1F'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function dailyDigestEmail({
  firstName, items, appBaseUrl, userId,
}: DigestVars): { subject: string; html: string; text: string } {
  const root = appBaseUrl.replace(/\/$/, '')
  const n = items.length
  const subject =
    n === 1 ? `One thing is waiting for you today` : `${n} things are waiting for you today`

  const rows = items.map(it => `
    <tr>
      <td style="padding:0 0 12px;">
        <a href="${it.href}" style="display:block;text-decoration:none;background:#faf7f0;border-radius:10px;border-left:3px solid ${ACCENT};padding:14px 18px;">
          <span style="display:block;font-size:15px;font-weight:600;color:#0c0c0a;">${escapeHtml(it.title)}</span>
          ${it.detail ? `<span style="display:block;margin-top:3px;font-size:13px;color:#6a655c;">${escapeHtml(it.detail)}</span>` : ''}
        </a>
      </td>
    </tr>`).join('')

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#faf7f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0c0c0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf7f0;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#fffdf7;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(12,12,10,0.08);">
            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#8a857a;">Your daily check-in</p>
                <h1 style="margin:0 0 18px;font-size:24px;font-weight:300;font-style:italic;line-height:1.3;color:#0c0c0a;">
                  ${escapeHtml(firstName)}, here's what's waiting for you.
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${rows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;" align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px auto 0;">
                  <tr>
                    <td style="border-radius:10px;background:${ACCENT};">
                      <a href="${root}/dashboard" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                        Open the app →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;border-top:1px solid rgba(12,12,10,0.06);">
                ${unsubscribeFooterHtml(root, userId, 'daily_reminder')}
              </td>
            </tr>
          </table>
          <p style="margin:24px auto 0;font-size:11px;color:#8a857a;letter-spacing:0.16em;text-transform:uppercase;">THE ENERGY LEADER</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `${firstName}, here's what's waiting for you today:

${items.map(it => `• ${it.title}${it.detail ? ` — ${it.detail}` : ''}\n  ${it.href}`).join('\n')}

Open the app: ${root}/dashboard

—
The Energy Leader
You're receiving this daily check-in because notifications are on. Manage them: ${root}/settings`

  return { subject, html, text }
}
