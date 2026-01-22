import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limiter';
import {
    validateFile,
    validateFileBuffer,
    sanitizeFilename,
    createRateLimitError,
    createValidationError,
} from '@/lib/ai-security';
import { adminAuth } from '@/lib/firebase-admin';

// PDF text extraction (server-side only)
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

// Image OCR (placeholder)
async function extractTextFromImage(buffer: Buffer): Promise<string> {
    return '[Image text extraction not yet implemented. Use OCR in production.]';
}

/**
 * File upload endpoint for study documents - LOCAL STORAGE VERSION
 * POST /api/ai/upload
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
            RATE_LIMITS.FILE_UPLOAD.maxRequests,
            RATE_LIMITS.FILE_UPLOAD.windowMs
        );

        if (!rateLimit.allowed) {
            return NextResponse.json(
                createRateLimitError(rateLimit.resetAt),
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': RATE_LIMITS.FILE_UPLOAD.maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                    },
                }
            );
        }

        // 3. Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                createValidationError('File is required'),
                { status: 400 }
            );
        }

        // 4. Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            return NextResponse.json(
                createValidationError(validation.error || 'Invalid file'),
                { status: 400 }
            );
        }

        // 5. Read and validate buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let fileType: 'pdf' | 'png' | 'jpeg';

        if (file.type === 'application/pdf') {
            fileType = 'pdf';
        } else if (file.type === 'image/png') {
            fileType = 'png';
        } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            fileType = 'jpeg';
        } else {
            return NextResponse.json(
                createValidationError('Unsupported file type'),
                { status: 400 }
            );
        }

        // Verify magic bytes
        if (!validateFileBuffer(buffer, fileType)) {
            return NextResponse.json(
                createValidationError('File type mismatch'),
                { status: 400 }
            );
        }

        // 6. Extract text
        let extractedText = '';

        try {
            if (fileType === 'pdf') {
                extractedText = await extractTextFromPDF(buffer);
            } else {
                extractedText = await extractTextFromImage(buffer);
            }
        } catch (error) {
            console.error('Text extraction error:', error);
            extractedText = '[Text extraction failed]';
        }

        // 7. Convert to base64 for client storage
        const base64Data = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Data}`;

        // 8. Return data for client-side IndexedDB storage
        return NextResponse.json(
            {
                success: true,
                document: {
                    id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    name: sanitizeFilename(file.name),
                    type: fileType === 'pdf' ? 'pdf' : 'image',
                    dataUrl: dataUrl, // Base64 data for client storage
                    extractedText: extractedText,
                    hasText: extractedText.length > 0 && !extractedText.includes('[Text extraction'),
                    size: file.size,
                    uploadedAt: new Date().toISOString(),
                },
                usage: {
                    remaining: rateLimit.remaining - 1,
                    resetAt: new Date(rateLimit.resetAt).toISOString(),
                },
            },
            {
                headers: {
                    'X-RateLimit-Limit': RATE_LIMITS.FILE_UPLOAD.maxRequests.toString(),
                    'X-RateLimit-Remaining': (rateLimit.remaining - 1).toString(),
                    'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                },
            }
        );
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
