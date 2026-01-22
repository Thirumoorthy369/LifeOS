import { NextRequest, NextResponse } from 'next/server';
import { getOpenRouterClient } from '@/lib/openrouter';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import {
    sanitizeInput,
    sanitizeAIResponse,
    validateTextLength,
    createRateLimitError,
    createValidationError,
} from '@/lib/ai-security';
import { adminAuth } from '@/lib/firebase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * AI Document processing endpoint
 * POST /api/ai/document
 * 
 * Supports: summarize, quiz, question, explain
 * 
 * Security:
 * - Requires Firebase authentication
 * - Rate limited to 10 requests/hour per user
 * - Input sanitization and validation
 * - Text length limits
 * - Results cached in Supabase
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
            RATE_LIMITS.AI_DOCUMENT.maxRequests,
            RATE_LIMITS.AI_DOCUMENT.windowMs
        );

        if (!rateLimit.allowed) {
            return NextResponse.json(
                createRateLimitError(rateLimit.resetAt),
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMITS.AI_DOCUMENT.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                    },
                }
            );
        }

        // 3. Parse and validate request body
        const body = await request.json();
        const { taskType, documentId, text, question, numQuestions = 5 } = body;

        // Validate taskType
        const validTaskTypes = ['summary', 'quiz', 'question', 'explain'];
        if (!taskType || !validTaskTypes.includes(taskType)) {
            return NextResponse.json(
                createValidationError(`Invalid taskType. Must be one of: ${validTaskTypes.join(', ')}`),
                { status: 400 }
            );
        }

        // Validate text content
        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                createValidationError('Text content is required'),
                { status: 400 }
            );
        }

        const sanitizedText = sanitizeInput(text);
        const textValidation = validateTextLength(sanitizedText, 50000);

        if (!textValidation.valid) {
            return NextResponse.json(
                createValidationError(textValidation.error || 'Invalid text content'),
                { status: 400 }
            );
        }

        // 4. Check cache first (if documentId provided)
        if (documentId) {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: cached } = await supabase
                .from('ai_results')
                .select('result')
                .eq('owner_id', userId)
                .eq('task_type', taskType)
                .eq('input_ref', documentId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (cached) {
                return NextResponse.json({
                    response: cached.result,
                    cached: true,
                    usage: {
                        remaining: rateLimit.remaining,
                        resetAt: new Date(rateLimit.resetAt).toISOString(),
                    },
                });
            }
        }

        // 5. Call OpenRouter API based on task type
        const aiClient = getOpenRouterClient();
        let aiResponse: string;

        try {
            switch (taskType) {
                case 'summary':
                    aiResponse = await aiClient.summarize(sanitizedText);
                    break;

                case 'quiz':
                    const quizCount = Math.min(Math.max(1, numQuestions || 5), 10); // 1-10 questions
                    aiResponse = await aiClient.generateQuiz(sanitizedText, quizCount);
                    break;

                case 'question':
                    if (!question || typeof question !== 'string') {
                        return NextResponse.json(
                            createValidationError('Question is required for Q&A task'),
                            { status: 400 }
                        );
                    }
                    const sanitizedQuestion = sanitizeInput(question);
                    aiResponse = await aiClient.answerQuestion(sanitizedText, sanitizedQuestion);
                    break;

                case 'explain':
                    const concept = body.concept ? sanitizeInput(body.concept) : undefined;
                    aiResponse = await aiClient.explain(sanitizedText, concept);
                    break;

                default:
                    return NextResponse.json(
                        createValidationError('Invalid task type'),
                        { status: 400 }
                    );
            }
        } catch (error) {
            console.error('OpenRouter API error:', error);
            return NextResponse.json(
                { error: 'AI Service Error', message: 'Failed to process document. Please try again.' },
                { status: 503 }
            );
        }

        // 6. Sanitize AI response
        const sanitizedResponse = sanitizeAIResponse(aiResponse);

        // 7. Cache result in Supabase (if documentId provided)
        if (documentId) {
            try {
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                await supabase.from('ai_results').insert({
                    owner_id: userId,
                    task_type: taskType,
                    input_ref: documentId,
                    result: sanitizedResponse,
                });
            } catch (error) {
                console.error('Failed to cache AI result:', error);
                // Don't fail the request if caching fails
            }
        }

        // 8. Return response with rate limit headers
        return NextResponse.json(
            {
                response: sanitizedResponse,
                cached: false,
                usage: {
                    remaining: rateLimit.remaining - 1,
                    resetAt: new Date(rateLimit.resetAt).toISOString(),
                },
            },
            {
                headers: {
                    'X-RateLimit-Limit': RATE_LIMITS.AI_DOCUMENT.maxRequests.toString(),
                    'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
                    'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                },
            }
        );
    } catch (error) {
        console.error('Document API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
