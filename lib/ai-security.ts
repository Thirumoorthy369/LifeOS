// Security utilities for AI features

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML/JavaScript
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';

    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: URIs (can be used for XSS)
    sanitized = sanitized.replace(/data:text\/html/gi, '');

    // Limit length to prevent DoS
    const MAX_INPUT_LENGTH = 10000; // 10k characters
    if (sanitized.length > MAX_INPUT_LENGTH) {
        sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
    }

    return sanitized.trim();
}

/**
 * Validate and sanitize AI response before sending to client
 * Ensures safe rendering of AI-generated content
 */
export function sanitizeAIResponse(response: string): string {
    if (!response) return '';

    // Allow markdown but remove dangerous HTML
    let sanitized = response;

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove iframes
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    return sanitized;
}

/**
 * Validate file upload
 * Checks file type, size, and extension
 */
export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export function validateFile(
    file: File,
    options: {
        maxSizeBytes?: number;
        allowedTypes?: string[];
        allowedExtensions?: string[];
    } = {}
): FileValidationResult {
    const {
        maxSizeBytes = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
        allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'],
    } = options;

    // Check file size
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `File size exceeds ${maxSizeBytes / 1024 / 1024}MB limit`,
        };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        };
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `File extension ${extension} not allowed. Allowed: ${allowedExtensions.join(', ')}`,
        };
    }

    // Check for double extensions (potential malware)
    const parts = file.name.toLowerCase().split('.');
    if (parts.length > 2) {
        return {
            valid: false,
            error: 'Files with multiple extensions are not allowed',
        };
    }

    return { valid: true };
}

/**
 * Validate server-side file buffer
 * Checks magic bytes to verify actual file type
 */
export function validateFileBuffer(
    buffer: Buffer,
    expectedType: 'pdf' | 'png' | 'jpeg'
): boolean {
    if (!buffer || buffer.length < 4) return false;

    const magicBytes = buffer.slice(0, 8);

    switch (expectedType) {
        case 'pdf':
            // PDF magic bytes: %PDF
            return magicBytes.toString('ascii', 0, 4) === '%PDF';

        case 'png':
            // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
            return (
                magicBytes[0] === 0x89 &&
                magicBytes[1] === 0x50 &&
                magicBytes[2] === 0x4e &&
                magicBytes[3] === 0x47
            );

        case 'jpeg':
            // JPEG magic bytes: FF D8 FF
            return (
                magicBytes[0] === 0xff &&
                magicBytes[1] === 0xd8 &&
                magicBytes[2] === 0xff
            );

        default:
            return false;
    }
}

/**
 * Generate safe filename
 * Removes special characters and prevents path traversal
 */
export function sanitizeFilename(filename: string): string {
    // Remove path separators and special characters
    let safe = filename.replace(/[/\\?%*:|"<>]/g, '-');

    // Remove leading/trailing dots and spaces
    safe = safe.replace(/^[.\s]+|[.\s]+$/g, '');

    // Limit length
    if (safe.length > 255) {
        const ext = safe.substring(safe.lastIndexOf('.'));
        safe = safe.substring(0, 255 - ext.length) + ext;
    }

    return safe || 'unnamed-file';
}

/**
 * Validate text content length
 */
export function validateTextLength(
    text: string,
    maxLength: number = 50000
): FileValidationResult {
    if (!text) {
        return { valid: false, error: 'Text content is empty' };
    }

    if (text.length > maxLength) {
        return {
            valid: false,
            error: `Text exceeds maximum length of ${maxLength} characters`,
        };
    }

    return { valid: true };
}

/**
 * Rate limit error response
 */
export function createRateLimitError(resetAt: number) {
    return {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        resetAt: new Date(resetAt).toISOString(),
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    };
}

/**
 * Validation error response
 */
export function createValidationError(message: string) {
    return {
        error: 'Validation failed',
        message,
    };
}
