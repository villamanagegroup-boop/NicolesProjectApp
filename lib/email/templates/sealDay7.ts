// lib/email/templates/sealDay7.ts
// Email templates fired the moment a user seals Day 7 of Seal the Leak.
//
// Two emails go out per seal:
//   1. User confirmation — celebrates the 30-day Cards unlock, links to /cards
//   2. Admin alert       — pings Nicole (via ADMIN_NOTIFY_EMAIL) so she knows
//                          a new user just hit completion
//
// Plain HTML with inline styles. Kept on-brand with the in-app modal:
// gold/green earthy palette, generous whitespace, italic display headline.

interface SealDay7UserVars {
  firstName: string
  daysRemaining: number
  expiresAt: string   // ISO
  appBaseUrl: string  // e.g. https://nicolesproject.com
}

export function sealDay7UserEmail({
  firstName, daysRemaining, expiresAt, appBaseUrl,
}: SealDay7UserVars): { subject: string; html: string; text: string } {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const cardsHref = `${appBaseUrl.replace(/\/$/, '')}/cards`

  const subject = `${firstName}, you sealed the leak — 30 days of Alignment, unlocked`

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#faf7f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0c0c0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf7f0;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#fffdf7;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(12,12,10,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#C8941F 0%,#9a7720 100%);padding:36px 32px 28px;text-align:center;color:#ffffff;">
                <div style="font-size:32px;line-height:1;margin:0 0 14px;">✦</div>
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:rgba(255,255,255,0.85);">Day 7 sealed</p>
                <h1 style="margin:0;font-size:26px;font-weight:300;font-style:italic;line-height:1.2;letter-spacing:-0.01em;">
                  30 days of Alignment, unlocked.
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3a3a35;">
                  Hi ${escapeHtml(firstName)},
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3a3a35;">
                  You did the work. Seven days, every prompt, every action. The shift you made is yours to keep.
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#3a3a35;">
                  Starting now, you have <strong style="color:#0c0c0a;">${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}</strong> of full access to <strong>365 Days of Alignment</strong> — a new card every morning, your journal, the win tracker, and the vault.
                </p>

                <!-- Expiry pill -->
                <div style="background:rgba(200,148,31,0.08);border:1px solid rgba(200,148,31,0.25);border-radius:10px;padding:14px 18px;margin:0 0 24px;text-align:center;">
                  <p style="margin:0;font-size:12px;font-weight:600;color:#C8941F;letter-spacing:0.4px;">
                    📅 Window ends ${expiryDate}
                  </p>
                </div>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 8px;">
                  <tr>
                    <td style="border-radius:10px;background:#C8941F;">
                      <a href="${cardsHref}"
                        style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                        Open today's card →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footnote -->
            <tr>
              <td style="padding:20px 32px 36px;">
                <p style="margin:0;font-size:12px;color:#8a857a;line-height:1.6;text-align:center;">
                  We'll remind you before your window ends so you don't lose your streak.
                </p>
              </td>
            </tr>

          </table>

          <p style="margin:24px auto 0;font-size:11px;color:#8a857a;letter-spacing:0.16em;text-transform:uppercase;">
            CLARITY · ALIGNMENT · PURPOSE · GROWTH
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `Hi ${firstName},

You sealed the leak. Seven days, every prompt, every action — the shift is yours to keep.

Starting now, you have ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} of full access to 365 Days of Alignment — daily cards, journal, win tracker, and the vault.

Window ends ${expiryDate}.

Open today's card: ${cardsHref}

We'll remind you before your window ends so you don't lose your streak.

—
Clarity · Alignment · Purpose · Growth`

  return { subject, html, text }
}

interface SealDay7AdminVars {
  userName: string
  userEmail: string
  archetype: string
  expiresAt: string
  granted: boolean
  appBaseUrl: string
  userId: string
}

export function sealDay7AdminEmail({
  userName, userEmail, archetype, expiresAt, granted, appBaseUrl, userId,
}: SealDay7AdminVars): { subject: string; html: string; text: string } {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const memberHref = `${appBaseUrl.replace(/\/$/, '')}/admin/users/${userId}`

  const subject = `${userName || userEmail} sealed Day 7${granted ? ' — 30-day Cards unlocked' : ''}`

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0c0c0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ee;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid rgba(12,12,10,0.08);">

            <tr>
              <td style="padding:28px 28px 20px;border-bottom:3px solid #1f5c3a;">
                <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#1f5c3a;">
                  Day 7 completion
                </p>
                <h1 style="margin:0;font-size:20px;font-weight:500;line-height:1.3;">
                  ${escapeHtml(userName || userEmail)} just sealed the leak.
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#3a3a35;line-height:1.6;">
                  <tr>
                    <td style="padding:6px 0;width:40%;color:#8a857a;">User</td>
                    <td style="padding:6px 0;">${escapeHtml(userName || '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Email</td>
                    <td style="padding:6px 0;">${escapeHtml(userEmail)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Archetype</td>
                    <td style="padding:6px 0;">${escapeHtml(archetype)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Cards window</td>
                    <td style="padding:6px 0;">
                      ${granted
                        ? `<span style="color:#1f5c3a;font-weight:600;">Granted</span> — expires ${expiryDate}`
                        : `<span style="color:#8a857a;">Already had access (no new grant)</span>`}
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 4px;">
                  <tr>
                    <td style="border-radius:8px;background:#1f5c3a;">
                      <a href="${memberHref}"
                        style="display:inline-block;padding:10px 20px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                        View member →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `${userName || userEmail} just sealed Day 7.

User:      ${userName || '—'}
Email:     ${userEmail}
Archetype: ${archetype}
Cards:     ${granted ? `Granted — expires ${expiryDate}` : 'Already had access (no new grant)'}

View member: ${memberHref}`

  return { subject, html, text }
}

// Minimal HTML escape so user-supplied name/email can't inject markup.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
