'use client'

import { useEffect, useState } from 'react'
import { syncEngine } from '@/lib/sync-engine'

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        const updateStatus = () => {
            const status = syncEngine.getStatus()
            setIsOnline(status.isOnline)
        }

        updateStatus()

        window.addEventListener('online', updateStatus)
        window.addEventListener('offline', updateStatus)

        // Periodic sync attempt
        const interval = setInterval(() => {
            if (navigator.onLine) {
                syncEngine.sync()
            }
        }, 30000) // Every 30 seconds

        return () => {
            window.removeEventListener('online', updateStatus)
            window.removeEventListener('offline', updateStatus)
            clearInterval(interval)
        }
    }, [])

    return <>{children}</>
}
