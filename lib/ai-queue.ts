import { db, AIQueue } from './db'

export class AIQueueManager {
    async addToQueue(
        taskType: 'summary' | 'quiz' | 'question' | 'evaluation',
        inputType: 'note' | 'document' | 'text',
        ownerId: string,
        options: {
            inputRef?: string
            inputText?: string
        }
    ) {
        const queueItem: Omit<AIQueue, 'id'> = {
            taskType,
            inputType,
            inputRef: options.inputRef,
            inputText: options.inputText,
            status: 'pending',
            timestamp: new Date(),
            owner_id: ownerId
        }

        const id = await db.aiQueue.add(queueItem)

        // Attempt to process if online
        if (navigator.onLine) {
            this.processQueue()
        }

        return id
    }

    async processQueue() {
        const pendingTasks = await db.aiQueue
            .where('status')
            .equals('pending')
            .toArray()

        for (const task of pendingTasks) {
            try {
                await db.aiQueue.update(task.id!, { status: 'processing' })

                const response = await fetch('/api/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        taskType: task.taskType,
                        inputType: task.inputType,
                        inputRef: task.inputRef,
                        inputText: task.inputText,
                        ownerId: task.owner_id
                    })
                })

                const result = await response.json()

                await db.aiQueue.update(task.id!, {
                    status: 'done',
                    result: result.output
                })
            } catch (error) {
                console.error('AI Queue processing error:', error)
                await db.aiQueue.update(task.id!, {
                    status: 'error',
                    result: 'Failed to process AI request'
                })
            }
        }
    }

    async getResult(id: number): Promise<AIQueue | undefined> {
        return db.aiQueue.get(id)
    }

    async getPendingCount(): Promise<number> {
        return db.aiQueue.where('status').equals('pending').count()
    }
}

export const aiQueue = new AIQueueManager()
