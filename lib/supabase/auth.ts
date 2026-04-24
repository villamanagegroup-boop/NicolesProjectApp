import { supabaseClient } from '@/lib/supabase/client'

/**
 * Signs the current user out and clears the session cookie.
 * Safe to call from anywhere; callers handle the post-signout redirect.
 */
export async function signOut() {
  await supabaseClient.auth.signOut()
}
