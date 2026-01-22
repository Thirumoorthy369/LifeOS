// Rate limiting system for AI endpoints
// Tracks requests per user and enforces limits

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private limits: Map<string, RateLimitEntry> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Clean up expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Check if a user has exceeded their rate limit
     * @param userId - User's Firebase UID
     * @param maxRequests - Maximum requests allowed in the window
     * @param windowMs - Time window in milliseconds (default: 1 hour)
     * @returns Object with allowed status and remaining quota
     */
    check(
        userId: string,
        maxRequests: number = 20,
        windowMs: number = 60 * 60 * 1000 // 1 hour
    ): { allowed: boolean; remaining: number; resetAt: number } {
        const now = Date.now();
        const key = `${userId}:${windowMs}`;
        const entry = this.limits.get(key);

        // No entry or expired - create new
        if (!entry || now > entry.resetAt) {
            const resetAt = now + windowMs;
            this.limits.set(key, { count: 1, resetAt });
            return { allowed: true, remaining: maxRequests - 1, resetAt };
        }

        // Check if limit exceeded
        if (entry.count >= maxRequests) {
            return { allowed: false, remaining: 0, resetAt: entry.resetAt };
        }

        // Increment count
        entry.count++;
        this.limits.set(key, entry);

        return {
            allowed: true,
            remaining: maxRequests - entry.count,
            resetAt: entry.resetAt,
        };
    }

    /**
     * Reset rate limit for a specific user
     * @param userId - User's Firebase UID
     */
    reset(userId: string): void {
        const keys = Array.from(this.limits.keys()).filter((k) =>
            k.startsWith(`${userId}:`)
        );
        keys.forEach((k) => this.limits.delete(k));
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        const toDelete: string[] = [];

        this.limits.forEach((entry, key) => {
            if (now > entry.resetAt) {
                toDelete.push(key);
            }
        });

        toDelete.forEach((key) => this.limits.delete(key));
    }

    /**
     * Get current usage for a user
     */
    getUsage(userId: string, windowMs: number = 60 * 60 * 1000): number {
        const key = `${userId}:${windowMs}`;
        const entry = this.limits.get(key);

        if (!entry || Date.now() > entry.resetAt) {
            return 0;
        }

        return entry.count;
    }

    /**
     * Cleanup on shutdown
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.limits.clear();
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
    AI_CHAT: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hour
    AI_DOCUMENT: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hour
    FILE_UPLOAD: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5/hour
} as const;
