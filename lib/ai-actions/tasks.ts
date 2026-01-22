// Task CRUD Operations with Security
// Professional implementation with validation, authorization, and error handling

import { supabaseAdmin } from '@/lib/supabase-admin';
import type { AIAction, ActionResult } from './index';
import { sanitizeInput } from './index';


interface Task {
    id?: string;
    title: string;
    description?: string;
    completed: boolean;
    isPrimary: boolean;
    isRecurring: boolean;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    owner_id: string;
    synced: boolean;
}

/**
 * Execute task-related actions
 * @security All operations validate ownership via owner_id
 */
export async function executeTaskAction(action: AIAction): Promise<ActionResult> {
    const { type, parameters, userId } = action;

    try {
        switch (type) {
            case 'create':
                return await createTask(parameters, userId);
            case 'read':
                return await readTasks(parameters, userId);
            case 'update':
                return await updateTask(parameters, userId);
            case 'delete':
                return await deleteTask(parameters, userId);
            default:
                return {
                    success: false,
                    error: 'Invalid action type for tasks',
                    message: 'I can only create, read, update, or delete tasks.'
                };
        }
    } catch (error: any) {
        console.error('Task action error:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute task action',
            message: 'Sorry, I encountered an error. Please try again.'
        };
    }
}

async function createTask(params: Record<string, any>, userId: string): Promise<ActionResult> {
    // Security: Validate required fields
    if (!params.title) {
        return {
            success: false,
            error: 'Title is required',
            message: 'Please provide a task title. For example: "Add task: Buy groceries"'
        };
    }

    // Security: Sanitize input
    const sanitizedTitle = sanitizeInput(params.title);
    const sanitizedDescription = params.description ? sanitizeInput(params.description) : '';

    if (sanitizedTitle.length === 0) {
        return {
            success: false,
            error: 'Invalid title',
            message: 'The task title contains invalid characters.'
        };
    }

    // Create task with secure defaults
    try {
        const { data, error } = await supabaseAdmin
            .from('tasks')
            .insert({
                title: sanitizedTitle,
                description: sanitizedDescription || null,
                completed: false,
                is_primary: false,
                is_recurring: false,
                owner_id: userId, // Security: Enforce ownership
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: `✅ Task created: "${sanitizedTitle}"`,
            data: { taskId: data.id, title: sanitizedTitle },
            actionId: `task_create_${data.id}`
        };
    } catch (error: any) {
        console.error('Error creating task:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to create task. Please try again.'
        };
    }
}

async function readTasks(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Security: Only fetch user's own tasks
        let query = supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('owner_id', userId);

        // Filter by completion status if specified
        if (params.completed !== undefined) {
            query = query.eq('completed', params.completed);
        }

        const { data: tasks, error } = await query;

        if (error) throw error;

        if (tasks.length === 0) {
            return {
                success: true,
                message: params.completed ? 'No completed tasks found.' : 'No pending tasks found.',
                data: { tasks: [], count: 0 }
            };
        }

        // Format response
        const pendingTasks = tasks?.filter((t: any) => !t.completed) || [];
        const completedTasks = tasks?.filter((t: any) => t.completed) || [];

        let message = `📋 You have ${pendingTasks.length} pending task${pendingTasks.length !== 1 ? 's' : ''}`;
        if (completedTasks.length > 0) {
            message += ` and ${completedTasks.length} completed`;
        }
        message += '.\n\n';

        if (params.completed === false || params.completed === undefined) {
            message += '**Pending tasks:**\n';
            pendingTasks.slice(0, 5).forEach((task: any, idx: number) => {
                message += `${idx + 1}. ${task.title}\n`;
            });
            if (pendingTasks.length > 5) {
                message += `... and ${pendingTasks.length - 5} more`;
            }
        }

        return {
            success: true,
            message,
            data: { tasks, pending: pendingTasks.length, completed: completedTasks.length }
        };
    } catch (error: any) {
        console.error('Error reading tasks:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve tasks.'
        };
    }
}

async function updateTask(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Find task - Security: Only user's own tasks
        let task: any;

        if (params.taskId) {
            const { data, error } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('id', params.taskId)
                .single();

            if (error || !data) {
                return {
                    success: false,
                    error: 'Task not found',
                    message: 'Could not find the task you specified.'
                };
            }

            if (data.owner_id !== userId) {
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'You can only update your own tasks.'
                };
            }
            task = data;
        } else if (params.title) {
            const { data: tasks } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('owner_id', userId)
                .ilike('title', `%${params.title}%`);
            task = tasks?.[0];
        } else if (params.index !== undefined) {
            const { data: allTasks } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('owner_id', userId)
                .eq('completed', false)
                .order('created_at', { ascending: true });
            const index = params.index === -1 ? (allTasks?.length || 1) - 1 : params.index;
            task = allTasks?.[index];
        }

        if (!task) {
            return {
                success: false,
                error: 'Task not found',
                message: 'Could not find the task you specified.'
            };
        }

        // Update task
        const updates: any = {};

        if (params.completed !== undefined) {
            updates.completed = params.completed;
        }
        if (params.title) {
            updates.title = sanitizeInput(params.title);
        }
        if (params.description) {
            updates.description = sanitizeInput(params.description);
        }

        const { error } = await supabaseAdmin
            .from('tasks')
            .update(updates)
            .eq('id', task.id);

        if (error) throw error;

        const action = params.completed ? 'marked as complete' : 'updated';
        return {
            success: true,
            message: `✅ Task "${task.title}" ${action}!`,
            data: { taskId: task.id, updates },
            actionId: `task_update_${task.id}`
        };
    } catch (error: any) {
        console.error('Error updating task:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to update task.'
        };
    }
}

async function deleteTask(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Find task - Security: Only user's own tasks
        let task: any;

        if (params.taskId) {
            const { data, error } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('id', params.taskId)
                .single();

            if (error || !data) {
                return {
                    success: false,
                    error: 'Task not found',
                    message: 'Could not find the task you specified.'
                };
            }

            if (data.owner_id !== userId) {
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'You can only delete your own tasks.'
                };
            }
            task = data;
        } else if (params.title) {
            const { data: tasks } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('owner_id', userId)
                .ilike('title', `%${params.title}%`);
            task = tasks?.[0];
        } else if (params.index !== undefined) {
            const { data: allTasks } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('owner_id', userId)
                .order('created_at', { ascending: true });
            const index = params.index === -1 ? (allTasks?.length || 1) - 1 : params.index;
            task = allTasks?.[index];
        }

        if (!task) {
            return {
                success: false,
                error: 'Task not found',
                message: 'Could not find the task you specified.'
            };
        }

        // Security: Require confirmation for delete actions (checked in action execution)
        const { error } = await supabaseAdmin
            .from('tasks')
            .delete()
            .eq('id', task.id);

        if (error) throw error;

        return {
            success: true,
            message: `🗑️ Task "${task.title}" deleted.`,
            data: { taskId: task.id, deletedTitle: task.title },
            actionId: `task_delete_${task.id}`
        };
    } catch (error: any) {
        console.error('Error deleting task:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to delete task.'
        };
    }
}
