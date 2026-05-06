// lib/email/templates/signupComplete.ts
// Emails fired the moment a user completes signup (auth created + path
// + archetype written to their row).
//
// Two emails:
//   1. User welcome — warm greeting, archetype highlight, purchase summary,
//      next-step CTA, note about Stripe sending the receipt separately.
//   2. Admin alert — table-style ping to Nicole with all signup details
//      and a deep link to /admin/users/[id].
//
// Stripe handles the actual receipt email automatically when "Email customer
// receipts" is on in the Stripe dashboard, so we don't reproduce line items
// or amounts in our welcome email — just confirm what they bought and where
// to go next.

interface SignupUserVars {
  firstName: string
  archetypeTitle: string       // e.g. "The Seeker"
  archetypeEmoji: string       // e.g. "🌿"
  archetypeBlurb: string       // 1-2 sentence summary
  pathTitle: string            // e.g. "Seal the Leak"
  pathPrice: string            // e.g. "$37 one-time"
  nextStepLabel: string        // e.g. "Start Day 1 →"
  nextStepHref: string         // absolute URL into the portal/welcome
  accentColor: string          // hex, used in header gradient
}

export function signupCompleteUserEmail({
  firstName, archetypeTitle, archetypeEmoji, archetypeBlurb,
  pathTitle, pathPrice, nextStepLabel, nextStepHref, accentColor,
}: SignupUserVars): { subject: string; html: string; text: string } {
  const subject = `Welcome to The Energy Leader, ${firstName}`

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#faf7f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0c0c0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf7f0;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#fffdf7;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(12,12,10,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,${accentColor} 0%,${darken(accentColor)} 100%);padding:36px 32px 28px;text-align:center;color:#ffffff;">
                <div style="font-size:36px;line-height:1;margin:0 0 12px;">${archetypeEmoji}</div>
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:rgba(255,255,255,0.85);">You're in</p>
                <h1 style="margin:0;font-size:26px;font-weight:300;font-style:italic;line-height:1.25;letter-spacing:-0.01em;">
                  Welcome, ${escapeHtml(firstName)}.
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 32px 8px;">
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3a3a35;">
                  Your account is set up and your program is ready when you are. Here's what you just unlocked.
                </p>

                <!-- Purchase summary -->
                <p style="margin:0 0 8px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8a857a;">Your purchase</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf7f0;border-radius:10px;margin:0 0 22px;">
                  <tr>
                    <td style="padding:14px 18px;font-size:14px;color:#0c0c0a;font-weight:600;">${escapeHtml(pathTitle)}</td>
                    <td style="padding:14px 18px;font-size:13px;color:#3a3a35;text-align:right;font-weight:500;">${escapeHtml(pathPrice)}</td>
                  </tr>
                </table>

                <!-- Archetype -->
                <p style="margin:0 0 8px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8a857a;">Your archetype</p>
                <div style="border-left:3px solid ${accentColor};padding:6px 0 6px 16px;margin:0 0 22px;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#0c0c0a;">${archetypeEmoji} ${escapeHtml(archetypeTitle)}</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#3a3a35;">${escapeHtml(archetypeBlurb)}</p>
                </div>

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 16px;">
                  <tr>
                    <td style="border-radius:10px;background:${accentColor};">
                      <a href="${nextStepHref}"
                        style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                        ${escapeHtml(nextStepLabel)}
                      </a>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- Footnote -->
            <tr>
              <td style="padding:16px 32px 32px;border-top:1px solid rgba(12,12,10,0.06);">
                <p style="margin:0 0 8px;font-size:12px;color:#8a857a;line-height:1.6;text-align:center;">
                  📧 A purchase receipt has been emailed separately by Stripe.
                </p>
                <p style="margin:0;font-size:12px;color:#8a857a;line-height:1.6;text-align:center;">
                  Questions? Reply to this email — it goes straight to Nicole.
                </p>
              </td>
            </tr>

          </table>

          <p style="margin:24px auto 0;font-size:11px;color:#8a857a;letter-spacing:0.16em;text-transform:uppercase;">
            THE ENERGY LEADER
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `Welcome, ${firstName}.

Your account is set up and your program is ready when you are.

YOUR PURCHASE
${pathTitle} — ${pathPrice}

YOUR ARCHETYPE
${archetypeEmoji} ${archetypeTitle}
${archetypeBlurb}

${nextStepLabel}
${nextStepHref}

A purchase receipt has been emailed separately by Stripe.
Questions? Reply to this email.

—
The Energy Leader`

  return { subject, html, text }
}

interface SignupAdminVars {
  userName: string
  userEmail: string
  pathTitle: string
  pathPrice: string
  archetypeTitle: string
  signedUpAt: string
  appBaseUrl: string
  userId: string
}

export function signupCompleteAdminEmail({
  userName, userEmail, pathTitle, pathPrice, archetypeTitle,
  signedUpAt, appBaseUrl, userId,
}: SignupAdminVars): { subject: string; html: string; text: string } {
  const memberHref = `${appBaseUrl.replace(/\/$/, '')}/admin/users/${userId}`
  const when = new Date(signedUpAt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })

  const subject = `New signup: ${userName || userEmail} · ${pathTitle}`

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
                  New signup
                </p>
                <h1 style="margin:0;font-size:20px;font-weight:500;line-height:1.3;">
                  ${escapeHtml(userName || userEmail)} just joined.
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#3a3a35;line-height:1.6;">
                  <tr>
                    <td style="padding:6px 0;width:34%;color:#8a857a;">Name</td>
                    <td style="padding:6px 0;">${escapeHtml(userName || '—')}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Email</td>
                    <td style="padding:6px 0;"><a href="mailto:${escapeHtml(userEmail)}" style="color:#1f5c3a;">${escapeHtml(userEmail)}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Path</td>
                    <td style="padding:6px 0;font-weight:600;color:#0c0c0a;">${escapeHtml(pathTitle)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Price</td>
                    <td style="padding:6px 0;">${escapeHtml(pathPrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Archetype</td>
                    <td style="padding:6px 0;">${escapeHtml(archetypeTitle)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#8a857a;">Signed up</td>
                    <td style="padding:6px 0;">${when}</td>
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

  const text = `${userName || userEmail} just joined.

Name:      ${userName || '—'}
Email:     ${userEmail}
Path:      ${pathTitle}
Price:     ${pathPrice}
Archetype: ${archetypeTitle}
Signed up: ${when}

View member: ${memberHref}`

  return { subject, html, text }
}

// ── helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Slightly darker version of a hex color for gradient stop, no lib needed.
function darken(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = Math.max(0, ((n >> 16) & 0xff) - 30)
  const g = Math.max(0, ((n >> 8)  & 0xff) - 30)
  const b = Math.max(0, ( n        & 0xff) - 30)
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}
