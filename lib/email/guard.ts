// lib/email/guard.ts
// Send-time opt-out enforcement. The unsubscribe system writes preferences;
// this is the gate that actually honors them BEFORE an email is sent.
//
// Two layers:
//   - email_opt_out (boolean on users) — global suppression. When true, the
//     user gets NO non-critical email, period. Set by the "unsubscribe from
//     all" link or by an admin removing someone manually.
//   - notification_prefs[kind] (jsonb on users) — per-category opt-out.
//
// Critical transactional mail (password resets, purchase receipts) should NOT
// be gated on prefs — pass requireKind only for marketing/lifecycle email.
// Every caller still respects the global email_opt_out flag.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { NotificationKind } from './unsubscribe'

export interface EmailGateResult {
  allowed: boolean
  reason?: 'globally_opted_out' | 'kind_opted_out' | 'user_not_found'
}

/**
 * Decide whether we may email this user.
 * @param kind  When omitted, only the global opt-out is checked (use for
 *              transactional/lifecycle mail). When provided, the matching
 *              notification_prefs flag must also be on.
 */
export async function canEmailUser(
  admin: SupabaseClient,
  userId: string,
  kind?: Exclude<NotificationKind, 'all'>,
): Promise<EmailGateResult> {
  const { data: row, error } = await admin
    .from('users')
    .select('email_opt_out, notification_prefs')
    .eq('id', userId)
    .maybeSingle()

  if (error || !row) return { allowed: false, reason: 'user_not_found' }

  if (row.email_opt_out === true) {
    return { allowed: false, reason: 'globally_opted_out' }
  }

  if (kind) {
    const prefs = (row.notification_prefs ?? {}) as Record<string, unknown>
    // Default to allowed when the key is absent (opt-in by default).
    if (prefs[kind] === false) return { allowed: false, reason: 'kind_opted_out' }
  }

  return { allowed: true }
}
