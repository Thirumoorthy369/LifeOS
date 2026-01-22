// Habit CRUD Operations with Security
// Professional implementation with streak tracking and validation

import { db } from '@/lib/db';
import type { AIAction, ActionResult } from './index';
import { sanitizeInput } from './index';

interface Habit {
    id?: string;
    name: string;
    description?: string;
    frequency: 'daily' | 'weekly';
    streak: number;
    lastCompleted?: Date;
    createdAt: Date;
    updatedAt: Date;
    owner_id: string;
    synced: boolean;
}

/**
 * Execute habit-related actions
 * @security All operations validate ownership via owner_id
 */
export async function executeHabitAction(action: AIAction): Promise<ActionResult> {
    const { type, parameters, userId } = action;

    try {
        switch (type) {
            case 'create':
                return await createHabit(parameters, userId);
            case 'read':
                return await readHabits(parameters, userId);
            case 'update':
                return await updateHabit(parameters, userId);
            case 'delete':
                return await deleteHabit(parameters, userId);
            case 'analyze':
                return await analyzeHabits(parameters, userId);
            default:
                return {
                    success: false,
                    error: 'Invalid action type',
                    message: 'I can only create, read, update, delete, or analyze habits.'
                };
        }
    } catch (error: any) {
        console.error('Habit action error:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute habit action',
            message: 'Sorry, I encountered an error with habits. Please try again.'
        };
    }
}

async function createHabit(params: Record<string, any>, userId: string): Promise<ActionResult> {
    // Security: Validate required fields
    if (!params.name) {
        return {
            success: false,
            error: 'Name is required',
            message: 'Please provide a habit name. For example: "Create habit: Exercise daily"'
        };
    }

    // Security: Sanitize and validate
    const sanitizedName = sanitizeInput(params.name);
    const frequency = params.frequency === 'weekly' ? 'weekly' : 'daily';

    if (sanitizedName.length === 0) {
        return {
            success: false,
            error: 'Invalid name',
            message: 'The habit name contains invalid characters.'
        };
    }

    // Create habit with secure defaults
    const habit: Omit<Habit, 'id'> = {
        name: sanitizedName,
        description: params.description ? sanitizeInput(params.description) : undefined,
        frequency,
        streak: 0,
        lastCompleted: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        owner_id: userId, // Security: Enforce ownership
        synced: false,
    };

    try {
        const habitId = await db.habits.add(habit as any);

        return {
            success: true,
            message: `✅ Habit created: "${sanitizedName}" (${frequency})`,
            data: { habitId, name: sanitizedName, frequency },
            actionId: `habit_create_${habitId}`
        };
    } catch (error: any) {
        console.error('Error creating habit:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to create habit. Please try again.'
        };
    }
}

async function readHabits(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Security: Only fetch user's own habits
        const habits = await db.habits
            .where('owner_id').equals(userId)
            .toArray();

        if (habits.length === 0) {
            return {
                success: true,
                message: 'You don\'t have any habits yet. Create one with "Add habit: Exercise daily"',
                data: { habits: [], count: 0 }
            };
        }

        // Calculate stats
        const longestStreak = Math.max(...habits.map(h => h.streak));
        const completedToday = habits.filter(h => isCompletedToday(h)).length;

        let message = `🔥 You have ${habits.length} habit${habits.length !== 1 ? 's' : ''}!\n\n`;
        message += `**Stats:**\n`;
        message += `• Longest streak: ${longestStreak} days\n`;
        message += `• Completed today: ${completedToday}/${habits.length}\n\n`;
        message += `**Your habits:**\n`;
        habits.forEach((habit, idx) => {
            const icon = habit.streak > 0 ? '🔥' : '⭕';
            message += `${idx + 1}. ${icon} ${habit.name} - ${habit.streak} day streak\n`;
        });

        return {
            success: true,
            message,
            data: { habits, longestStreak, completedToday }
        };
    } catch (error: any) {
        console.error('Error reading habits:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve habits.'
        };
    }
}

async function updateHabit(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Find habit - Security: Only user's own habits
        let habit: any;

        if (params.habitId) {
            habit = await db.habits.get(params.habitId);
            if (habit && habit.owner_id !== userId) {
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'You can only update your own habits.'
                };
            }
        } else if (params.name) {
            const habits = await db.habits
                .where('owner_id').equals(userId)
                .filter(h => h.name.toLowerCase().includes(params.name.toLowerCase()))
                .toArray();
            habit = habits[0];
        }

        if (!habit) {
            return {
                success: false,
                error: 'Habit not found',
                message: 'Could not find the habit you specified.'
            };
        }

        // Check if already completed today
        if (params.markComplete && isCompletedToday(habit)) {
            return {
                success: true,
                message: `✅ You already completed "${habit.name}" today! Current streak: ${habit.streak} days`,
                data: { habitId: habit.id, alreadyCompleted: true }
            };
        }

        // Update habit
        const updates: Partial<Habit> = {
            updatedAt: new Date(),
            synced: false,
        };

        if (params.markComplete) {
            updates.streak = habit.streak + 1;
            updates.lastCompleted = new Date();
        }

        await db.habits.update(habit.id, updates);

        return {
            success: true,
            message: `🔥 "${habit.name}" completed! ${updates.streak} day streak!`,
            data: { habitId: habit.id, newStreak: updates.streak },
            actionId: `habit_update_${habit.id}`
        };
    } catch (error: any) {
        console.error('Error updating habit:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to update habit.'
        };
    }
}

async function deleteHabit(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Find habit - Security: Only user's own habits
        let habit: any;

        if (params.habitId) {
            habit = await db.habits.get(params.habitId);
            if (habit && habit.owner_id !== userId) {
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'You can only delete your own habits.'
                };
            }
        } else if (params.name) {
            const habits = await db.habits
                .where('owner_id').equals(userId)
                .filter(h => h.name.toLowerCase().includes(params.name.toLowerCase()))
                .toArray();
            habit = habits[0];
        }

        if (!habit) {
            return {
                success: false,
                error: 'Habit not found',
                message: 'Could not find the habit you specified.'
            };
        }

        await db.habits.delete(habit.id);

        return {
            success: true,
            message: `🗑️ Habit "${habit.name}" deleted (${habit.streak} day streak lost).`,
            data: { habitId: habit.id, deletedName: habit.name },
            actionId: `habit_delete_${habit.id}`
        };
    } catch (error: any) {
        console.error('Error deleting habit:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to delete habit.'
        };
    }
}

async function analyzeHabits(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Security: Only user's own habits
        const habits = await db.habits
            .where('owner_id').equals(userId)
            .toArray();

        if (habits.length === 0) {
            return {
                success: true,
                message: 'You don\'t have any habits to analyze yet.',
                data: {}
            };
        }

        const longestStreak = Math.max(...habits.map(h => h.streak));
        const longestHabit = habits.find(h => h.streak === longestStreak);
        const completedToday = habits.filter(h => isCompletedToday(h)).length;
        const avgStreak = Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length);

        let message = `📊 **Habit Analytics:**\n\n`;
        message += `• Total habits: ${habits.length}\n`;
        message += `• Longest streak: ${longestStreak} days (${longestHabit?.name})\n`;
        message += `• Average streak: ${avgStreak} days\n`;
        message += `• Completed today: ${completedToday}/${habits.length}\n`;
        message += `• Consistency: ${Math.round((completedToday / habits.length) * 100)}%`;

        return {
            success: true,
            message,
            data: { longestStreak, avgStreak, completedToday, total: habits.length }
        };
    } catch (error: any) {
        console.error('Error analyzing habits:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to analyze habits.'
        };
    }
}

// Helper function
function isCompletedToday(habit: Habit): boolean {
    if (!habit.lastCompleted) return false;
    const today = new Date().toDateString();
    const lastCompleted = new Date(habit.lastCompleted).toDateString();
    return today === lastCompleted;
}
