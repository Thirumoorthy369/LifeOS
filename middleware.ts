import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // This is a placeholder for future auth middleware
    // For now, we'll handle auth on the client side
    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/tasks/:path*', '/habits/:path*', '/expenses/:path*', '/notes/:path*', '/study/:path*', '/profile/:path*']
}
