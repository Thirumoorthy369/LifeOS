'use client'

import { useEffect, useState } from 'react'
import { syncEngine } from '@/lib/sync-engine'

export function NetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)

    useEffect(() => {
        const updateStatus = () => {
            const status = syncEngine.getStatus()
            setIsOnline(status.isOnline)
            setIsSyncing(status.isSyncing)
        }

        updateStatus()

        window.addEventListener('online', updateStatus)
        window.addEventListener('offline', updateStatus)

        const interval = setInterval(updateStatus, 1000)

        return () => {
            window.removeEventListener('online', updateStatus)
            window.removeEventListener('offline', updateStatus)
            clearInterval(interval)
        }
    }, [])

    if (isOnline && !isSyncing) {
        return (
            <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Online · Synced</span>
            </div>
        )
    }

    if (isOnline && isSyncing) {
        return (
            <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Syncing...</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 text-sm text-yellow-600">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span>Offline · Saved locally</span>
        </div>
    )
}
