import { db, SyncQueue } from './db'
import { supabase } from './supabase'

export class SyncEngine {
    private isOnline: boolean = false
    private isSyncing: boolean = false

    constructor() {
        if (typeof window !== 'undefined') {
            this.isOnline = navigator.onLine
            window.addEventListener('online', () => this.handleOnline())
            window.addEventListener('offline', () => this.handleOffline())
        }
    }

    private handleOnline() {
        this.isOnline = true
        this.sync()
    }

    private handleOffline() {
        this.isOnline = false
    }

    async addToQueue(tableName: string, operation: 'create' | 'update' | 'delete', recordId: string, data?: any) {
        await db.syncQueue.add({
            tableName,
            operation,
            recordId,
            data,
            timestamp: new Date(),
            attempts: 0
        })

        if (this.isOnline) {
            this.sync()
        }
    }

    async sync() {
        if (this.isSyncing || !this.isOnline) return

        this.isSyncing = true

        try {
            const queue = await db.syncQueue.orderBy('timestamp').toArray()

            for (const item of queue) {
                try {
                    await this.syncItem(item)
                    await db.syncQueue.delete(item.id!)
                } catch (error) {
                    console.error('Sync error:', error)
                    // Increment attempts
                    await db.syncQueue.update(item.id!, { attempts: item.attempts + 1 })

                    // If too many attempts, remove from queue
                    if (item.attempts >= 5) {
                        await db.syncQueue.delete(item.id!)
                    }
                }
            }
        } finally {
            this.isSyncing = false
        }
    }

    private async syncItem(item: SyncQueue) {
        const { tableName, operation, recordId, data } = item

        switch (operation) {
            case 'create':
            case 'update':
                await supabase.from(tableName).upsert(data)
                break
            case 'delete':
                await supabase.from(tableName).delete().eq('id', recordId)
                break
        }
    }

    getStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing
        }
    }
}

export const syncEngine = new SyncEngine()
