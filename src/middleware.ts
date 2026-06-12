import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// We handle auth client-side in dashboard/layout.tsx
// Middleware only blocks obvious non-auth routes
export function middleware(req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
