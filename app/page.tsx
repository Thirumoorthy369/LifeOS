'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { GridBackground } from '@/components/ui/backgrounds'
import { Mail } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Welcome to LifeOS')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
        setVerificationSent(true)
        toast.success('Account created! Please check your email to verify your account.')
        // Don't redirect - show verification message
      } else {
        await signInWithEmail(email, password)
        toast.success('Welcome back')
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-auth-gradient relative overflow-hidden">
      <GridBackground />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 p-8 space-y-6 bg-slate-900/80 backdrop-blur border-slate-800">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-100 text-glow">
            Welcome to LifeOS
          </h1>
          <p className="text-slate-400">
            Your personal operating system for life management
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200 font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 autofill:bg-slate-800 autofill:text-slate-100"
              style={{
                WebkitTextFillColor: '#f1f5f9',
                WebkitBoxShadow: '0 0 0 1000px rgb(30 41 59) inset',
                transition: 'background-color 5000s ease-in-out 0s'
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200 font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all duration-200 autofill:bg-slate-800 autofill:text-slate-100"
              style={{
                WebkitTextFillColor: '#f1f5f9',
                WebkitBoxShadow: '0 0 0 1000px rgb(30 41 59) inset',
                transition: 'background-color 5000s ease-in-out 0s'
              }}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-900 font-medium shadow-lg shadow-sky-500/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-sky-500/30"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        {/* Verification Message */}
        {verificationSent && (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4 space-y-2">
            <p className="text-sky-400 font-medium text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Verification email sent!
            </p>
            <p className="text-slate-400 text-xs">
              Please check your inbox and click the verification link. Then you can sign in.
            </p>
            <button
              onClick={() => {
                setVerificationSent(false)
                setIsSignUp(false)
              }}
              className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500">Or</span>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          variant="outline"
          className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          disabled={loading}
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm text-slate-400">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sky-400 hover:text-sky-300 underline underline-offset-4 transition-colors"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </Card>

      <div className="absolute bottom-4 text-center w-full text-slate-500 text-xs">
        <p>Offline-First • Secure • Private</p>
      </div>
    </div>
  )
}
