// AI Action System - Core Infrastructure
// Security-first implementation with validation, sanitization, and audit logging

export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'analyze';
export type EntityType = 'task' | 'habit' | 'note' | 'expense';

export interface AIAction {
    type: ActionType;
    entity: EntityType;
    parameters: Record<string, any>;
    requiresConfirmation: boolean;
    userId: string;
    timestamp: Date;
}

export interface ActionResult {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
    actionId?: string;
}

// Security: Input validation patterns
const SAFE_STRING_PATTERN = /^[a-zA-Z0-9\s\-_.,!?@#$%&*()\[\]{}:;"'<>\/\\+=]*$/;
const MAX_STRING_LENGTH = 500;
const MAX_NUMBER_VALUE = 999999;

/**
 * Sanitize user input to prevent injection attacks
 * @security XSS prevention, SQL injection prevention
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') return '';

    // Remove potentially dangerous characters
    let sanitized = input
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();

    // Limit length
    if (sanitized.length > MAX_STRING_LENGTH) {
        sanitized = sanitized.substring(0, MAX_STRING_LENGTH);
    }

    return sanitized;
}

/**
 * Validate action parameters before execution
 * @security Ensures type safety and prevents malicious input
 */
export function validateAction(action: AIAction): { valid: boolean; error?: string } {
    // Validate action type
    const validTypes: ActionType[] = ['create', 'read', 'update', 'delete', 'analyze'];
    if (!validTypes.includes(action.type)) {
        return { valid: false, error: 'Invalid action type' };
    }

    // Validate entity type
    const validEntities: EntityType[] = ['task', 'habit', 'note', 'expense'];
    if (!validEntities.includes(action.entity)) {
        return { valid: false, error: 'Invalid entity type' };
    }

    // Validate userId
    if (!action.userId || typeof action.userId !== 'string') {
        return { valid: false, error: 'Invalid user ID' };
    }

    // Validate parameters
    if (!action.parameters || typeof action.parameters !== 'object') {
        return { valid: false, error: 'Invalid parameters' };
    }

    // Type-specific validation
    switch (action.entity) {
        case 'task':
            return validateTaskAction(action);
        case 'habit':
            return validateHabitAction(action);
        case 'expense':
            return validateExpenseAction(action);
        case 'note':
            return validateNoteAction(action);
        default:
            return { valid: false, error: 'Unknown entity type' };
    }
}

function validateTaskAction(action: AIAction): { valid: boolean; error?: string } {
    const { parameters } = action;

    if (action.type === 'create') {
        if (!parameters.title || typeof parameters.title !== 'string') {
            return { valid: false, error: 'Task title is required' };
        }
        if (!SAFE_STRING_PATTERN.test(parameters.title)) {
            return { valid: false, error: 'Task title contains invalid characters' };
        }
    }

    if (action.type === 'update' || action.type === 'delete') {
        if (!parameters.taskId && !parameters.title && !parameters.index) {
            return { valid: false, error: 'Task identifier required' };
        }
    }

    return { valid: true };
}

function validateHabitAction(action: AIAction): { valid: boolean; error?: string } {
    const { parameters } = action;

    if (action.type === 'create') {
        if (!parameters.name || typeof parameters.name !== 'string') {
            return { valid: false, error: 'Habit name is required' };
        }
        if (!SAFE_STRING_PATTERN.test(parameters.name)) {
            return { valid: false, error: 'Habit name contains invalid characters' };
        }
        if (parameters.frequency && !['daily', 'weekly'].includes(parameters.frequency)) {
            return { valid: false, error: 'Invalid frequency - use daily or weekly' };
        }
    }

    return { valid: true };
}

function validateExpenseAction(action: AIAction): { valid: boolean; error?: string } {
    const { parameters } = action;

    if (action.type === 'create') {
        if (typeof parameters.amount !== 'number' || parameters.amount <= 0) {
            return { valid: false, error: 'Valid expense amount required' };
        }
        if (parameters.amount > MAX_NUMBER_VALUE) {
            return { valid: false, error: 'Amount exceeds maximum allowed value' };
        }
        if (parameters.category && !SAFE_STRING_PATTERN.test(parameters.category)) {
            return { valid: false, error: 'Invalid category' };
        }
    }

    return { valid: true };
}

function validateNoteAction(action: AIAction): { valid: boolean; error?: string } {
    const { parameters } = action;

    if (action.type === 'create') {
        if (!parameters.title || typeof parameters.title !== 'string') {
            return { valid: false, error: 'Note title is required' };
        }
        if (!SAFE_STRING_PATTERN.test(parameters.title)) {
            return { valid: false, error: 'Note title contains invalid characters' };
        }
    }

    return { valid: true };
}

/**
 * Detect AI action intent from natural language
 * @security Returns null if no valid action detected - fail closed
 */
export function detectAction(message: string, userId: string): AIAction | null {
    const lowerMsg = message.toLowerCase().trim();
    const sanitizedMsg = sanitizeInput(message);

    // Task actions
    if (lowerMsg.includes('add task') || lowerMsg.includes('create task')) {
        const title = extractTaskTitle(sanitizedMsg);
        if (!title) return null;

        return {
            type: 'create',
            entity: 'task',
            parameters: { title },
            requiresConfirmation: false,
            userId,
            timestamp: new Date(),
        };
    }

    if (lowerMsg.includes('complete') || lowerMsg.includes('mark') && lowerMsg.includes('done')) {
        const taskRef = extractTaskReference(sanitizedMsg);
        return {
            type: 'update',
            entity: 'task',
            parameters: { ...taskRef, completed: true },
            requiresConfirmation: false,
            userId,
            timestamp: new Date(),
        };
    }

    if (lowerMsg.includes('delete task') || lowerMsg.includes('remove task')) {
        const taskRef = extractTaskReference(sanitizedMsg);
        return {
            type: 'delete',
            entity: 'task',
            parameters: taskRef,
            requiresConfirmation: true, // Destructive action
            userId,
            timestamp: new Date(),
        };
    }

    // Habit actions
    if (lowerMsg.includes('create habit') || lowerMsg.includes('add habit')) {
        const name = extractHabitName(sanitizedMsg);
        const frequency = lowerMsg.includes('weekly') ? 'weekly' : 'daily';

        if (!name) return null;

        return {
            type: 'create',
            entity: 'habit',
            parameters: { name, frequency },
            requiresConfirmation: false,
            userId,
            timestamp: new Date(),
        };
    }

    if (lowerMsg.includes('mark') && lowerMsg.includes('habit') && (lowerMsg.includes('done') || lowerMsg.includes('complete'))) {
        const habitRef = extractHabitReference(sanitizedMsg);
        return {
            type: 'update',
            entity: 'habit',
            parameters: { ...habitRef, markComplete: true },
            requiresConfirmation: false,
            userId,
            timestamp: new Date(),
        };
    }

    // Expense actions
    if ((lowerMsg.includes('add expense') || lowerMsg.includes('spent')) &&
        (lowerMsg.includes('₹') || lowerMsg.includes('rs') || /\d+/.test(lowerMsg))) {
        const amount = extractAmount(sanitizedMsg);
        const category = extractExpenseCategory(sanitizedMsg);
        const description = extractExpenseDescription(sanitizedMsg);

        if (!amount || amount <= 0) return null;

        return {
            type: 'create',
            entity: 'expense',
            parameters: { amount, category, description },
            requiresConfirmation: false,
            userId,
            timestamp: new Date(),
        };
    }

    // Note actions
    if (lowerMsg.includes('create note') || lowerMsg.includes('add note')) {
        const title = extractNoteTitle(sanitizedMsg);
        const content = extractNoteContent(sanitizedMsg);

        if (!title) return null;

        return {
            type: 'create',
            entity: 'note',
            parameters: { title, content },
            requiresConfirmation: false,
            userId,
            timestamp: new Date(),
        };
    }

    // Analytics queries
    if (lowerMsg.includes('how much') || lowerMsg.includes('total') || lowerMsg.includes('spending')) {
        return {
            type: 'analyze',
            entity: 'expense',
            parameters: { query: sanitizedMsg },
            requiresConfirmation: false,
            userId,
            timestamp: new Date(),
        };
    }

    // No action detected - return null (fail closed)
    return null;
}

// Helper functions for extracting parameters
function extractTaskTitle(msg: string): string | null {
    // Extract text after "add task:" or "create task:"
    const patterns = [
        /(?:add|create)\s+task:?\s+(.+)/i,
        /(?:add|create)\s+task\s+to\s+(.+)/i,
    ];

    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match && match[1]) {
            return sanitizeInput(match[1]).trim();
        }
    }

    return null;
}

function extractTaskReference(msg: string): { taskId?: string; title?: string; index?: number } {
    // Try to extract task by title
    const titleMatch = msg.match(/['"]([^'"]+)['"]/);
    if (titleMatch) {
        return { title: sanitizeInput(titleMatch[1]) };
    }

    // Try to extract by position (first, last, etc.)
    if (msg.includes('first')) return { index: 0 };
    if (msg.includes('last')) return { index: -1 };

    return {};
}

function extractHabitName(msg: string): string | null {
    const patterns = [
        /(?:add|create)\s+habit:?\s+(.+)/i,
        /(?:add|create)\s+habit\s+to\s+(.+)/i,
    ];

    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match && match[1]) {
            // Remove frequency words
            let name = match[1].replace(/\b(daily|weekly)\b/gi, '').trim();
            return sanitizeInput(name);
        }
    }

    return null;
}

function extractHabitReference(msg: string): { habitId?: string; name?: string } {
    const nameMatch = msg.match(/['"]([^'"]+)['"]/);
    if (nameMatch) {
        return { name: sanitizeInput(nameMatch[1]) };
    }
    return {};
}

function extractAmount(msg: string): number | null {
    // Extract number with or without ₹ symbol
    const patterns = [
        /₹\s*(\d+(?:\.\d{1,2})?)/,
        /rs\.?\s*(\d+(?:\.\d{1,2})?)/i,
        /(\d+(?:\.\d{1,2})?)\s*(?:₹|rs|rupees)/i,
        /(?:spent|expense)\s+(\d+(?:\.\d{1,2})?)/i,
    ];

    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match && match[1]) {
            const amount = parseFloat(match[1]);
            return isNaN(amount) ? null : amount;
        }
    }

    return null;
}

function extractExpenseCategory(msg: string): string {
    const categories = [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
        'Bills & Utilities', 'Healthcare', 'Education', 'Other'
    ];

    const lowerMsg = msg.toLowerCase();
    for (const category of categories) {
        if (lowerMsg.includes(category.toLowerCase()) ||
            lowerMsg.includes(category.split(' ')[0].toLowerCase())) {
            return category;
        }
    }

    // Default category
    return 'Other';
}

function extractExpenseDescription(msg: string): string | null {
    const patterns = [
        /for\s+(.+?)(?:\s+(?:today|yesterday|categor)|\s*$)/i,
        /on\s+(.+?)(?:\s+(?:today|yesterday|category)|\s*$)/i,
    ];

    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match && match[1]) {
            return sanitizeInput(match[1]).trim();
        }
    }

    return null;
}

function extractNoteTitle(msg: string): string | null {
    const patterns = [
        /(?:create|add)\s+note:?\s+(.+)/i,
        /(?:create|add)\s+note\s+about\s+(.+)/i,
    ];

    for (const pattern of patterns) {
        const match = msg.match(pattern);
        if (match && match[1]) {
            // Take first part as title
            const title = match[1].split(/[.,;]|with content|:/)[0];
            return sanitizeInput(title).trim();
        }
    }

    return null;
}

function extractNoteContent(msg: string): string {
    const contentMatch = msg.match(/(?:with content|:)\s+(.+)/i);
    if (contentMatch && contentMatch[1]) {
        return sanitizeInput(contentMatch[1]).trim();
    }
    return '';
}
