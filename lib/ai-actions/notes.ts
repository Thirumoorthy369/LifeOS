// Note CRUD Operations with Security
// Professional implementation with search and content management

import { db } from '@/lib/db';
import type { AIAction, ActionResult } from './index';
import { sanitizeInput } from './index';

interface Note {
    id?: string;
    title: string;
    content: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    owner_id: string;
    synced: boolean;
}

/**
 * Execute note-related actions
 * @security All operations validate ownership
 */
export async function executeNoteAction(action: AIAction): Promise<ActionResult> {
    const { type, parameters, userId } = action;

    try {
        switch (type) {
            case 'create':
                return await createNote(parameters, userId);
            case 'read':
                return await readNotes(parameters, userId);
            case 'update':
                return await updateNote(parameters, userId);
            case 'delete':
                return await deleteNote(parameters, userId);
            default:
                return {
                    success: false,
                    error: 'Invalid action type',
                    message: 'I can create, read, update, or delete notes.'
                };
        }
    } catch (error: any) {
        console.error('Note action error:', error);
        return {
            success: false,
            error: error.message || 'Failed to execute note action',
            message: 'Sorry, I encountered an error with notes. Please try again.'
        };
    }
}

async function createNote(params: Record<string, any>, userId: string): Promise<ActionResult> {
    // Security: Validate required fields
    if (!params.title) {
        return {
            success: false,
            error: 'Title is required',
            message: 'Please provide a note title. For example: "Create note: Meeting notes"'
        };
    }

    // Security: Sanitize input
    const sanitizedTitle = sanitizeInput(params.title);
    const sanitizedContent = params.content ? sanitizeInput(params.content) : '';

    if (sanitizedTitle.length === 0) {
        return {
            success: false,
            error: 'Invalid title',
            message: 'The note title contains invalid characters.'
        };
    }

    // Create note with secure defaults
    const note: Omit<Note, 'id'> = {
        title: sanitizedTitle,
        content: sanitizedContent,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        owner_id: userId, // Security: Enforce ownership
        synced: false,
    };

    try {
        const noteId = await db.notes.add(note as any);

        return {
            success: true,
            message: `✅ Note created: "${sanitizedTitle}"`,
            data: { noteId, title: sanitizedTitle },
            actionId: `note_create_${noteId}`
        };
    } catch (error: any) {
        console.error('Error creating note:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to create note. Please try again.'
        };
    }
}

async function readNotes(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Security: Only fetch user's own notes
        let notes = await db.notes
            .where('owner_id').equals(userId)
            .reverse()
            .sortBy('updatedAt');

        // Filter by search query if provided
        if (params.search) {
            const searchTerm = sanitizeInput(params.search).toLowerCase();
            notes = notes.filter(note =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm)
            );
        }

        if (notes.length === 0) {
            const message = params.search
                ? `No notes found matching "${params.search}"`
                : 'You don\'t have any notes yet.';
            return {
                success: true,
                message,
                data: { notes: [], count: 0 }
            };
        }

        let message = `📝 **Your Notes:**\n\n`;
        message += `Total: ${notes.length} note${notes.length !== 1 ? 's' : ''}\n\n`;

        notes.slice(0, 5).forEach((note, idx) => {
            message += `${idx + 1}. **${note.title}**\n`;
            if (note.content) {
                const preview = note.content.substring(0, 60);
                message += `   ${preview}${note.content.length > 60 ? '...' : ''}\n`;
            }
            message += `   _Updated: ${new Date(note.updatedAt).toLocaleDateString()}_\n`;
        });

        if (notes.length > 5) {
            message += `\n...and ${notes.length - 5} more`;
        }

        return {
            success: true,
            message,
            data: { notes, count: notes.length }
        };
    } catch (error: any) {
        console.error('Error reading notes:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to retrieve notes.'
        };
    }
}

async function updateNote(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Find note - Security: Only user's own notes
        let note: any;

        if (params.noteId) {
            note = await db.notes.get(params.noteId);
            if (note && note.owner_id !== userId) {
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'You can only update your own notes.'
                };
            }
        } else if (params.title) {
            const notes = await db.notes
                .where('owner_id').equals(userId)
                .filter(n => n.title.toLowerCase().includes(params.title.toLowerCase()))
                .toArray();
            note = notes[0];
        } else {
            // Get most recent note
            const notes = await db.notes
                .where('owner_id').equals(userId)
                .reverse()
                .sortBy('updatedAt');
            note = notes[0];
        }

        if (!note) {
            return {
                success: false,
                error: 'Note not found',
                message: 'Could not find the note you specified.'
            };
        }

        // Update note
        const updates: Partial<Note> = {
            updatedAt: new Date(),
            synced: false,
        };

        if (params.content) {
            updates.content = sanitizeInput(params.content);
        }
        if (params.newTitle) {
            updates.title = sanitizeInput(params.newTitle);
        }

        await db.notes.update(note.id, updates);

        return {
            success: true,
            message: `✅ Note "${note.title}" updated!`,
            data: { noteId: note.id, updates },
            actionId: `note_update_${note.id}`
        };
    } catch (error: any) {
        console.error('Error updating note:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to update note.'
        };
    }
}

async function deleteNote(params: Record<string, any>, userId: string): Promise<ActionResult> {
    try {
        // Find note - Security: Only user's own notes
        let note: any;

        if (params.noteId) {
            note = await db.notes.get(params.noteId);
            if (note && note.owner_id !== userId) {
                return {
                    success: false,
                    error: 'Unauthorized',
                    message: 'You can only delete your own notes.'
                };
            }
        } else if (params.title) {
            const notes = await db.notes
                .where('owner_id').equals(userId)
                .filter(n => n.title.toLowerCase().includes(params.title.toLowerCase()))
                .toArray();
            note = notes[0];
        } else {
            // Get most recent note
            const notes = await db.notes
                .where('owner_id').equals(userId)
                .reverse()
                .sortBy('updatedAt');
            note = notes[0];
        }

        if (!note) {
            return {
                success: false,
                error: 'Note not found',
                message: 'Could not find the note you specified.'
            };
        }

        await db.notes.delete(note.id);

        return {
            success: true,
            message: `🗑️ Note "${note.title}" deleted.`,
            data: { noteId: note.id, deletedTitle: note.title },
            actionId: `note_delete_${note.id}`
        };
    } catch (error: any) {
        console.error('Error deleting note:', error);
        return {
            success: false,
            error: error.message,
            message: 'Failed to delete note.'
        };
    }
}
