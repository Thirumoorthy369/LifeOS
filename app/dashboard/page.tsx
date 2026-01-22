'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { NetworkStatus } from '@/components/network-status'
import { getGreeting } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TopographicBackground } from '@/components/ui/backgrounds'
import { db } from '@/lib/db'
import { ProfileMenu } from '@/components/profile-menu'

export default function DashboardPage() {
    const { user, loading, emailVerified } = useAuth()
    const router = useRouter()
    const [taskCount, setTaskCount] = useState({ pending: 0, completed: 0 })

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/')
            } else if (!emailVerified && user.providerData[0]?.providerId === 'password') {
                router.push('/verify-email')
            }
        }
    }, [user, loading, emailVerified, router])

    useEffect(() => {
        if (user) {
            loadTaskCounts()
        }

        const handleTaskUpdate = () => {
            if (user) {
                loadTaskCounts()
            }
        }

        window.addEventListener('tasksUpdated', handleTaskUpdate)

        return () => {
            window.removeEventListener('tasksUpdated', handleTaskUpdate)
        }
    }, [user])

    const loadTaskCounts = async () => {
        if (!user) return

        try {
            const allTasks = await db.tasks.where('owner_id').equals(user.uid).toArray()
            const pending = allTasks.filter(t => !t.completed).length
            const completed = allTasks.filter(t => t.completed).length
            setTaskCount({ pending, completed })
        } catch (error) {
            console.error('Failed to load task counts:', error)
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
        return null
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-dashboard-gradient pointer-events-none" />
            <TopographicBackground />

            {/* Header */}
            <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between relative z-10">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-100">LifeOS</h1>
                </div>
                <div className="flex items-center gap-4">
                    <NetworkStatus />
                    <ProfileMenu user={user} />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto space-y-8 relative z-10">
                {/* Greeting Section */}
                <div className="bg-ambient-gradient rounded-xl p-8 border border-slate-800">
                    <h2 className="text-3xl font-semibold text-slate-100 mb-2">
                        {getGreeting()}, {user.displayName || user.email?.split('@')[0] || 'there'}! 👋
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Today feels manageable.
                    </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Primary Focus Card */}
                    <Card className="p-6 bg-focus-gradient border-slate-800 col-span-full">
                        <h3 className="text-lg font-medium text-slate-100 mb-4">
                            Primary Focus Today
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Set your main focus for today
                        </p>
                    </Card>

                    {/* Tasks Card */}
                    <Card
                        className="p-6 bg-slate-900/50 border-slate-800 cursor-pointer hover:bg-slate-800/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300"
                        onClick={() => router.push('/tasks')}
                    >
                        <h3 className="text-lg font-medium text-slate-100 mb-4">
                            Tasks Today
                        </h3>
                        <p className="text-slate-400 text-sm">
                            {taskCount.pending === 0
                                ? 'No tasks yet'
                                : `${taskCount.pending} pending task${taskCount.pending !== 1 ? 's' : ''}`}
                        </p>
                    </Card>

                    {/* Study Progress Card */}
                    <Card
                        className="p-6 bg-slate-900/50 border-slate-800 cursor-pointer hover:bg-slate-800/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                        onClick={() => router.push('/study')}
                    >
                        <h3 className="text-lg font-medium text-slate-100 mb-4">
                            Study Progress ✨
                        </h3>
                        <p className="text-slate-400 text-sm">
                            AI-powered study tools available!
                        </p>
                    </Card>

                    {/* Habit Streak Card */}
                    <Card
                        className="p-6 bg-slate-900/50 border-slate-800 cursor-pointer hover:bg-slate-800/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
                        onClick={() => router.push('/habits')}
                    >
                        <h3 className="text-lg font-medium text-slate-100 mb-4">
                            Habit Streak
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Build consistent habits
                        </p>
                    </Card>

                    {/* Expenses Card */}
                    <Card
                        className="p-6 bg-expense-gradient border-slate-800 cursor-pointer hover:bg-slate-800/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300"
                        onClick={() => router.push('/expenses')}
                    >
                        <h3 className="text-lg font-medium text-slate-100 mb-4">
                            Expenses Today
                        </h3>
                        <p className="text-slate-400 text-sm">
                            ₹0 spent today
                        </p>
                    </Card>

                    {/* Quick Notes Card */}
                    <Card
                        className="p-6 bg-slate-900/50 border-slate-800 col-span-full md:col-span-1 cursor-pointer hover:bg-slate-800/70 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                        onClick={() => router.push('/notes')}
                    >
                        <h3 className="text-lg font-medium text-slate-100 mb-4">
                            Quick Notes
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Capture your thoughts
                        </p>
                    </Card>
                </div>

                {/* System Status */}
                <div className="text-center py-4">
                    <NetworkStatus />
                </div>
            </main>
        </div>
    )
}
