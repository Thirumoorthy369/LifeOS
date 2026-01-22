// Expense CRUD Operations with Security and Analytics
// Professional implementation with category tracking and spending insights

import { db } from '@/lib/db';
import type { AIAction, ActionResult } from './index';
import { sanitizeInput } from './index';

interface Expense {
    id?: string;
    amount: number;
    category: string;
    description?: string;
    date: Date;
    createdAt: Date;
    owner_id: string;
    synced: boolean;
}

const VALID_CATEGORIES = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Other'
];

/**
 * Execute expense-related actions
 * @security All operations validate ownership and amounts
 */
export async function executeExpenseAction(action: AIAction): Promise<ActionResult> {
    const { type, parameters, userId } = action;

    try {
        switch (type) {
            case 'create':
                return await createExpense(parameters, userId);
            case 'read':
                return await readExpenses(parameters, userId);
            case 'delete':
                return await deleteExpense(parameters, userId);
            case 'analyze':
                return await analyzeExpenses(parameters, userId);
            default:
                return {
                    success: false,
                    error: 'Invalid action type',
                    message: 'I can create, read, delete, or analyze expenses.'
                };
        }
    } catch (error: any) {
        console.error('Expense action error:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute expense action',
            message: 'Sorry, I encountered an error with expenses. Please try again.'
        };
    }
}

async function createExpense(params: Record<string, any>, userId: string): Promise<ActionResult> {
    // Security: Validate amount
    if (typeof params.amount !== 'number' || params.amount <= 0) {
        return {
            success: false,
            error: 'Invalid amount',
            message: 'Please provide a valid positive amount. For example: "Add expense: ₹500 for groceries"'
        };
    }

    // Security: Validate max amount (prevent abuse)
    if (params.amount > 999999) {
        return {
            success: false,
            error: 'Amount too large',
            message: 'Please enter an amount less than ₹1,000,000'
        };
    }

    // Validate and sanitize category
    const category = VALID_CATEGORIES.includes(params.category)
        ? params.category
        : 'Other';

    const description = params.description
        ? sanitizeInput(params.description)
        : undefined;

    // Create expense with secure defaults
    const expense: Omit<Expense, 'id'> = {
        amount: params.amount,
        category,
        description,
        date: new Date(),
        createdAt: new Date(),
        owner_id: userId, // Security: Enforce ownership
        synced: false,
    };

    try {
        const expenseId = await db.expenses.add(expense as any);

        return {
            success: true,
            message: `✅ Expense added: ₹${params.amount.toFixed(2)} for ${category}${description ? ` (${description})` : ''}`,
            data: { expenseId, amount: params.amount, category },
            actionId: `expense_create_${expenseId}`
        };
    } catch (error: any) {
        console.error('Error creating expense:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to add expense. Please try again.'
        };
    }
}

async function readExpenses(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Security: Only fetch user's own expenses
        const allExpenses = await db.expenses
            .where('owner_id').equals(userId)
            .reverse()
            .sortBy('date');

        if (allExpenses.length === 0) {
            return {
                success: true,
                message: 'You haven\'t added any expenses yet.',
                data: { expenses: [], total: 0 }
            };
        }

        // Filter by time period if specified
        let expenses = allExpenses;
        const now = new Date();

        if (params.period === 'today') {
            expenses = allExpenses.filter(e =>
                new Date(e.date).toDateString() === now.toDateString()
            );
        } else if (params.period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            expenses = allExpenses.filter(e => new Date(e.date) >= weekAgo);
        } else if (params.period === 'month') {
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            expenses = allExpenses.filter(e => new Date(e.date) >= monthAgo);
        }

        const total = expenses.reduce((sum, e) => sum + e.amount, 0);

        let message = `💰 **Your Expenses:**\n\n`;
        message += `Total: ₹${total.toFixed(2)}\n\n`;
        message += `**Recent expenses:**\n`;
        expenses.slice(0, 5).forEach((exp, idx) => {
            const date = new Date(exp.date).toLocaleDateString('en-IN', {
                month: 'short', day: 'numeric'
            });
            message += `${idx + 1}. ₹${exp.amount.toFixed(2)} - ${exp.category} (${date})\n`;
            if (exp.description) message += `   ${exp.description}\n`;
        });

        if (expenses.length > 5) {
            message += `\n...and ${expenses.length - 5} more`;
        }

        return {
            success: true,
            message,
            data: { expenses, total, count: expenses.length }
        };
    } catch (error: any) {
        console.error('Error reading expenses:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve expenses.'
        };
    }
}

async function deleteExpense(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Find expense - Security: Only user's own expenses
        let expense: any;

        if (params.expenseId) {
            expense = await db.expenses.get(params.expenseId);
            if (expense && expense.owner_id !== userId) {
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'You can only delete your own expenses.'
                };
            }
        } else {
            // Get most recent expense
            const expenses = await db.expenses
                .where('owner_id').equals(userId)
                .reverse()
                .sortBy('date');
            expense = expenses[0];
        }

        if (!expense) {
            return {
                success: false,
                error: 'Expense not found',
                message: 'Could not find the expense you specified.'
            };
        }

        await db.expenses.delete(expense.id);

        return {
            success: true,
            message: `🗑️ Expense deleted: ₹${expense.amount.toFixed(2)} (${expense.category})`,
            data: { expenseId: expense.id, amount: expense.amount },
            actionId: `expense_delete_${expense.id}`
        };
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to delete expense.'
        };
    }
}

async function analyzeExpenses(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Security: Only user's own expenses
        const allExpenses = await db.expenses
            .where('owner_id').equals(userId)
            .toArray();

        if (allExpenses.length === 0) {
            return {
                success: true,
                message: 'No expenses to analyze yet.',
                data: {}
            };
        }

        // Time-based filtering
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const todayExpenses = allExpenses.filter(e =>
            new Date(e.date).toDateString() === now.toDateString()
        );
        const weekExpenses = allExpenses.filter(e => new Date(e.date) >= weekAgo);
        const monthExpenses = allExpenses.filter(e => new Date(e.date) >= monthAgo);

        // Category breakdown
        const categoryTotals = new Map<string, number>();
        weekExpenses.forEach(exp => {
            const current = categoryTotals.get(exp.category) || 0;
            categoryTotals.set(exp.category, current + exp.amount);
        });

        const sortedCategories = Array.from(categoryTotals.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        // Calculate totals
        const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
        const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
        const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        let message = `📊 **Expense Analytics:**\n\n`;
        message += `**Spending Summary:**\n`;
        message += `• Today: ₹${todayTotal.toFixed(2)}\n`;
        message += `• This week: ₹${weekTotal.toFixed(2)}\n`;
        message += `• This month: ₹${monthTotal.toFixed(2)}\n\n`;

        if (sortedCategories.length > 0) {
            message += `**Top Categories (this week):**\n`;
            sortedCategories.forEach(([category, amount], idx) => {
                const percentage = (amount / weekTotal * 100).toFixed(0);
                message += `${idx + 1}. ${category}: ₹${amount.toFixed(2)} (${percentage}%)\n`;
            });
        }

        return {
            success: true,
            message,
            data: {
                todayTotal,
                weekTotal,
                monthTotal,
                categoryBreakdown: sortedCategories
            }
        };
    } catch (error: any) {
        console.error('Error analyzing expenses:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to analyze expenses.'
        };
    }
}
