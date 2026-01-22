import Dexie, { Table } from 'dexie';

// Database Interfaces
export interface Task {
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

export interface Habit {
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

export interface Expense {
    id?: string;
    amount: number;
    category: string;
    description?: string;
    date: Date;
    createdAt: Date;
    owner_id: string;
    synced: boolean;
}

export interface Note {
    id?: string;
    title: string;
    content: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
    owner_id: string;
    synced: boolean;
}

export interface StudySession {
    id?: string;
    subjectId: string;
    topicId?: string;
    duration: number; // in minutes
    notes?: string;
    date: Date;
    createdAt: Date;
    owner_id: string;
    synced: boolean;
}

export interface Subject {
    id?: string;
    name: string;
    description?: string;
    createdAt: Date;
    owner_id: string;
    synced: boolean;
}

export interface Topic {
    id?: string;
    subjectId: string;
    name: string;
    description?: string;
    createdAt: Date;
    owner_id: string;
    synced: boolean;
}

export interface SyncQueue {
    id?: number;
    tableName: string;
    operation: 'create' | 'update' | 'delete';
    recordId: string;
    data?: any;
    timestamp: Date;
    attempts: number;
}

export interface AIQueue {
    id?: number;
    taskType: 'summary' | 'quiz' | 'question' | 'evaluation';
    inputType: 'note' | 'document' | 'text';
    inputRef?: string;
    inputText?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    result?: string;
    timestamp: Date;
    owner_id: string;
}

export interface Document {
    id?: string;
    name: string;
    type: 'pdf' | 'image';
    url: string;
    extractedText?: string;
    subjectId?: string;
    createdAt: Date;
    owner_id: string;
    synced: boolean;
}

// Dexie Database
export class LifeOSDatabase extends Dexie {
    tasks!: Table<Task>;
    habits!: Table<Habit>;
    expenses!: Table<Expense>;
    notes!: Table<Note>;
    studySessions!: Table<StudySession>;
    subjects!: Table<Subject>;
    topics!: Table<Topic>;
    documents!: Table<Document>;
    syncQueue!: Table<SyncQueue>;
    aiQueue!: Table<AIQueue>;

    constructor() {
        super('LifeOSDatabase');
        this.version(1).stores({
            tasks: '++id, owner_id, isPrimary, completed, synced, createdAt',
            habits: '++id, owner_id, synced, createdAt',
            expenses: '++id, owner_id, date, category, synced',
            notes: '++id, owner_id, synced, createdAt',
            studySessions: '++id, owner_id, subjectId, date, synced',
            subjects: '++id, owner_id, synced',
            topics: '++id, owner_id, subjectId, synced',
            documents: '++id, owner_id, subjectId, synced',
            syncQueue: '++id, timestamp, tableName',
            aiQueue: '++id, timestamp, status, owner_id'
        });
    }
}

export const db = new LifeOSDatabase();
