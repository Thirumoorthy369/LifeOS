import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient } from '@/lib/openrouter';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import { sanitizeInput, sanitizeAIResponse, createRateLimitError, createValidationError } from '@/lib/ai-security';
import { adminAuth } from '@/lib/firebase-admin';
import { db } from '@/lib/db';

/**
 * AI Chat endpoint for general queries about user's LifeOS data
 * POST /api/ai/chat
 * 
 * Security:
 * - Requires Firebase authentication
 * - Rate limited to 20 requests/hour per user
 * - Input sanitization
 * - Response sanitization
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        let decodedToken;

        try {
            decodedToken = await adminAuth().verifyIdToken(token);
        } catch (error) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid token' },
                { status: 401 }
            );
        }

        const userId = decodedToken.uid;

        // 2. Rate Limiting
        const rateLimit = rateLimiter.check(
            userId,
            RATE_LIMITS.AI_CHAT.maxRequests,
            RATE_LIMITS.AI_CHAT.windowMs
        );

        if (!rateLimit.allowed) {
            return NextResponse.json(
                createRateLimitError(rateLimit.resetAt),
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMITS.AI_CHAT.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                    },
                }
            );
        }

        // 3. Parse and validate request body
        const body = await request.json();
        const { message, includeContext = false } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                createValidationError('Message is required and must be a string'),
                { status: 400 }
            );
        }

        // 4. Sanitize input
        const sanitizedMessage = sanitizeInput(message);

        if (!sanitizedMessage) {
            return NextResponse.json(
                createValidationError('Message cannot be empty after sanitization'),
                { status: 400 }
            );
        }

        // 5. Get user context if requested (from IndexedDB via client, or fetch from Supabase)
        let context = {};

        if (includeContext && body.context) {
            // Context should be sent from client (already has user data from IndexedDB)
            context = {
                tasks: sanitizeInput(body.context.tasks || ''),
                notes: sanitizeInput(body.context.notes || ''),
                habits: sanitizeInput(body.context.habits || ''),
            };
        }

        // 6. Detect and execute AI actions
        const { detectAction, validateAction } = await import('@/lib/ai-actions');
        const { executeTaskAction } = await import('@/lib/ai-actions/tasks');
        const { executeHabitAction } = await import('@/lib/ai-actions/habits');
        const { executeExpenseAction } = await import('@/lib/ai-actions/expenses');
        const { executeNoteAction } = await import('@/lib/ai-actions/notes');

        const aiAction = detectAction(sanitizedMessage, userId);
        let actionResult = null;

        if (aiAction) {
            // Validate action
            const validation = validateAction(aiAction);
            if (!validation.valid) {
                return NextResponse.json(
                    createValidationError(validation.error || 'Invalid action'),
                    { status: 400 }
                );
            }

            // Execute action based on entity type
            try {
                switch (aiAction.entity) {
                    case 'task':
                        actionResult = await executeTaskAction(aiAction);
                        break;
                    case 'habit':
                        actionResult = await executeHabitAction(aiAction);
                        break;
                    case 'expense':
                        actionResult = await executeExpenseAction(aiAction);
                        break;
                    case 'note':
                        actionResult = await executeNoteAction(aiAction);
                        break;
                }
            } catch (error: any) {
                console.error('Action execution error:', error);
                actionResult = {
                    success: false,
                    error: error.message,
                    message: 'Failed to execute action. Please try again.'
                };
            }
        }

        // 7. Call OpenRouter API with action context
        const aiClient = getOpenRouterClient();
        let aiResponse;

        // Build context including action result
        let enhancedContext = context;
        if (actionResult) {
            enhancedContext = {
                ...context,
                lastAction: actionResult.success
                    ? `Action completed: ${actionResult.message}`
                    : `Action failed: ${actionResult.error}`
            };
        }

        try {
            // If we have an action result, use it directly as response
            if (actionResult && actionResult.message) {
                aiResponse = actionResult.message;
            } else {
                // Otherwise, get AI response
                aiResponse = await aiClient.chatWithContext(sanitizedMessage, enhancedContext);
            }
        } catch (error) {
            console.error('OpenRouter API error:', error);
            return NextResponse.json(
                { error: 'AI Service Error', message: 'Failed to get AI response. Please try again.' },
                { status: 503 }
            );
        }

        // 7. Sanitize AI response
        const sanitizedResponse = sanitizeAIResponse(aiResponse);

        // 8. Return response with rate limit headers
        return NextResponse.json(
            {
                response: sanitizedResponse,
                action: actionResult ? {
                    success: actionResult.success,
                    entity: aiAction?.entity,
                    type: aiAction?.type,
                    data: actionResult.data
                } : null,
                usage: {
                    remaining: rateLimit.remaining - 1,
                    resetAt: new Date(rateLimit.resetAt).toISOString(),
                },
            },
            {
                headers: {
                    'X-RateLimit-Limit': RATE_LIMITS.AI_CHAT.maxRequests.toString(),
                    'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
                    'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                },
            }
        );
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
