import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // TODO: When Supabase is connected, implement full auth protection:
  // 1. Create Supabase server client with cookies
  // 2. Get session: const { data: { session } } = await supabase.auth.getSession()
  // 3. If no session AND pathname starts with '/(portal)' or matches portal routes → redirect to /login
  // 4. If session AND no quiz_result in user row → redirect to /quiz
  // 5. If session AND no selected_path in user row → redirect to /result
  // 6. If pathname starts with '/program' AND user.has_paid === false → redirect to /checkout

  // For now: pass all requests through
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
