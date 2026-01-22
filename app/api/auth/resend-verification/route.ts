import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { lastSent: number; count: number }>()
const RATE_LIMIT_WINDOW = 60000 // 60 seconds
const MAX_REQUESTS = 1 // 1 request per window

export async function POST(req: NextRequest) {
    try {
        // Get the authorization token
        const authHeader = req.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Missing token' },
                { status: 401 }
            )
        }

        const token = authHeader.split('Bearer ')[1]

        // Verify the Firebase token
        let decodedToken
        try {
            decodedToken = await adminAuth().verifyIdToken(token)
        } catch (error) {
            console.error('Token verification failed:', error)
            return NextResponse.json(
                { error: 'Unauthorized - Invalid token' },
                { status: 401 }
            )
        }

        const uid = decodedToken.uid

        // Check rate limiting
        const now = Date.now()
        const userRateLimit = rateLimitStore.get(uid)

        if (userRateLimit) {
            const timeSinceLastSend = now - userRateLimit.lastSent

            if (timeSinceLastSend < RATE_LIMIT_WINDOW) {
                const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastSend) / 1000)
                return NextResponse.json(
                    {
                        error: 'Too many requests. Please wait before requesting another verification email.',
                        retryAfter
                    },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': retryAfter.toString()
                        }
                    }
                )
            }
        }

        // Get the user from Firebase Admin
        const user = await adminAuth().getUser(uid)

        // Check if email is already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { message: 'Email is already verified' },
                { status: 200 }
            )
        }

        // Generate and send verification email
        const link = await adminAuth().generateEmailVerificationLink(user.email!)

        // In production, you might want to send this via your own email service
        // For now, Firebase will handle sending the email
        // Note: The generateEmailVerificationLink creates a link that we could send via custom email
        // But Firebase's sendEmailVerification (client-side) is simpler for basic use

        // Since we're using Firebase's built-in email sending, we'll just confirm the action
        // The actual email sending happens client-side via sendEmailVerification()

        // Update rate limit store
        rateLimitStore.set(uid, {
            lastSent: now,
            count: (userRateLimit?.count || 0) + 1
        })

        // Clean up old entries (older than rate limit window)
        for (const [key, value] of rateLimitStore.entries()) {
            if (now - value.lastSent > RATE_LIMIT_WINDOW) {
                rateLimitStore.delete(key)
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Verification email request processed',
                retryAfter: RATE_LIMIT_WINDOW / 1000
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Resend verification error:', error)
        return NextResponse.json(
            { error: 'Failed to process verification email request' },
            { status: 500 }
        )
    }
}
