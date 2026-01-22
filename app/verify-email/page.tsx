'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { auth, sendVerificationEmail, checkEmailVerified } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { GridBackground } from '@/components/ui/backgrounds'
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

export default function VerifyEmailPage() {
    const router = useRouter()
    const { user, emailVerified, loading } = useAuth()
    const [checking, setChecking] = useState(false)
    const [resending, setResending] = useState(false)
    const [canResend, setCanResend] = useState(true)
    const [countdown, setCountdown] = useState(0)

    // Redirect if user is verified or not logged in
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/')
            } else if (emailVerified) {
                toast.success('Email verified successfully!')
                router.push('/dashboard')
            }
        }
    }, [user, emailVerified, loading, router])

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [countdown])

    const handleCheckStatus = async () => {
        if (!user) return

        setChecking(true)
        try {
            const isVerified = await checkEmailVerified(user)
            if (isVerified) {
                toast.success('Email verified successfully!')
                router.push('/dashboard')
            } else {
                toast.info('Email not verified yet. Please check your inbox.')
            }
        } catch (error: any) {
            toast.error('Failed to check verification status')
            console.error('Check status error:', error)
        } finally {
            setChecking(false)
        }
    }

    const handleResendEmail = async () => {
        if (!user || !canResend) return

        setResending(true)
        setCanResend(false)

        try {
            await sendVerificationEmail(user)
            toast.success('Verification email sent! Please check your inbox.')
            setCountdown(60) // 60 second cooldown
        } catch (error: any) {
            // Check if it's a rate limit error
            if (error.code === 'auth/too-many-requests') {
                toast.error('Too many requests. Please wait a moment before trying again.')
                setCountdown(60)
            } else {
                toast.error(error.message || 'Failed to send verification email')
                setCanResend(true)
            }
            console.error('Resend email error:', error)
        } finally {
            setResending(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-slate-400">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-auth-gradient relative overflow-hidden">
            <GridBackground />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 pointer-events-none" />

            <Card className="w-full max-w-md relative z-10 p-8 space-y-6 bg-slate-900/80 backdrop-blur border-slate-800">
                <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-sky-500/20 blur-xl rounded-full" />
                            <Mail className="relative w-16 h-16 text-sky-400 mx-auto" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-100 text-glow">
                        Verify Your Email
                    </h1>

                    {/* Description */}
                    <div className="space-y-3">
                        <p className="text-slate-300">
                            We've sent a verification email to:
                        </p>
                        <p className="text-sky-400 font-medium break-all px-4">
                            {user.email}
                        </p>
                        <p className="text-sm text-slate-400">
                            Please click the verification link in the email to activate your account.
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left space-y-2">
                        <div className="flex items-start gap-2 text-sm text-slate-300">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-400 flex-shrink-0" />
                            <div className="space-y-1">
                                <p className="font-medium text-slate-200">Tips:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-400">
                                    <li>Check your spam/junk folder</li>
                                    <li>Email may take a few minutes to arrive</li>
                                    <li>Link expires after 1 hour</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleCheckStatus}
                        className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 font-medium shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all hover:scale-[1.02]"
                        disabled={checking}
                    >
                        {checking ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                I've Verified My Email
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleResendEmail}
                        variant="outline"
                        className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                        disabled={resending || !canResend}
                    >
                        {resending ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : !canResend ? (
                            <>
                                <Mail className="w-4 h-4 mr-2" />
                                Resend in {countdown}s
                            </>
                        ) : (
                            <>
                                <Mail className="w-4 h-4 mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </Button>
                </div>

                {/* Back to Login */}
                <div className="text-center pt-4 border-t border-slate-800">
                    <button
                        onClick={() => {
                            auth.signOut()
                            router.push('/')
                        }}
                        className="text-sm text-slate-400 hover:text-slate-300 underline underline-offset-4 transition-colors"
                    >
                        Sign out and use a different account
                    </button>
                </div>
            </Card>

            <div className="absolute bottom-4 text-center w-full text-slate-500 text-xs">
                <p>Secure • Encrypted • Private</p>
            </div>
        </div>
    )
}
