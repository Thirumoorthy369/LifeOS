'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, CheckCircle2, Circle, Calendar, Trash2, Tag, ChevronDown, ChevronRight, Filter, Search, X, Clock, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
    id?: string;
    title: string;
    description?: string;
    completed: boolean;
    isPrimary: boolean;
    isRecurring: boolean;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
    category?: string;
    parentTaskId?: string;
    estimatedTime?: number;
    actualTime?: number;
    createdAt: Date;
    updatedAt: Date;
    owner_id: string;
    synced: boolean;
}

const PRIORITIES = [
    { value: 'low', label: 'Low', color: 'bg-gray-500', textColor: 'text-gray-500' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-500' },
];

const CATEGORIES = ['Work', 'Personal', 'Shopping', 'Health', 'Learning', 'Other'];

export default function TasksPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [category, setCategory] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [newTag, setNewTag] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date');

    useEffect(() => {
        if (user) {
            loadTasks();
        }

        const handleTaskUpdate = () => {
            if (user) {
                loadTasks();
            }
        };

        window.addEventListener('tasksUpdated', handleTaskUpdate);

        return () => {
            window.removeEventListener('tasksUpdated', handleTaskUpdate);
        };
    }, [user]);

    const loadTasks = async () => {
        if (!user) return;

        const allTasks = await db.tasks
            .where('owner_id')
            .equals(user.uid)
            .reverse()
            .sortBy('createdAt');

        setTasks(allTasks as any);
    };

    const addTask = async () => {
        if (!newTask.trim() || !user) return;

        const task: Omit<Task, 'id'> = {
            title: newTask,
            description: description || undefined,
            completed: false,
            isPrimary: false,
            isRecurring: false,
            priority,
            tags: selectedTags,
            category: category || undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            owner_id: user.uid,
            synced: false,
        };

        await db.tasks.add(task as any);
        resetForm();
        loadTasks();
        toast.success('Task added!');
    };

    const resetForm = () => {
        setNewTask('');
        setDescription('');
        setPriority('medium');
        setCategory('');
        setDueDate('');
        setSelectedTags([]);
        setShowForm(false);
    };

    const toggleTask = async (task: Task) => {
        if (!task.id) return;

        await db.tasks.update(task.id, {
            completed: !task.completed,
            updatedAt: new Date(),
        });

        loadTasks();
        toast.success(task.completed ? 'Task reopened!' : 'Task completed!');
    };

    const deleteTask = async (task: Task) => {
        if (!task.id) return;

        await db.tasks.delete(task.id);
        loadTasks();
        toast.success('Task deleted!');
    };

    const addTag = () => {
        if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
            setSelectedTags([...selectedTags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tag: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const toggleExpanded = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-400">Please sign in to view tasks.</p>
            </div>
        );
    }

    // Filter and sort tasks
    let filteredTasks = tasks.filter(task => {
        // Search filter
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description?.toLowerCase().includes(searchQuery.toLowerCase()));

        // Priority filter
        const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

        // Category filter
        const matchesCategory = filterCategory === 'all' || task.category === filterCategory;

        // Status filter
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'completed' && task.completed) ||
            (filterStatus === 'pending' && !task.completed);

        return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
    });

    // Sort tasks
    filteredTasks = filteredTasks.sort((a, b) => {
        if (sortBy === 'priority') {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority || 'medium'] || 0) - (priorityOrder[a.priority || 'medium'] || 0);
        } else if (sortBy === 'title') {
            return a.title.localeCompare(b.title);
        } else {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const completedTasks = filteredTasks.filter(t => t.completed);
    const pendingTasks = filteredTasks.filter(t => !t.completed);

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Advanced Task Manager</h1>
                        <p className="text-slate-400 mt-1">
                            {pendingTasks.length} pending • {completedTasks.length} completed
                        </p>
                    </div>
                    <Button onClick={() => router.push('/dashboard')} variant="outline" className="cursor-pointer hover:bg-slate-800 hover:scale-105 transition-all duration-200">
                        ← Dashboard
                    </Button>
                </div>

                {/* Search and Filters */}
                <Card className="p-4 mb-6 bg-slate-900 border-slate-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full bg-slate-800 text-slate-100 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Priority Filter */}
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="bg-slate-800 text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Priorities</option>
                            {PRIORITIES.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="bg-slate-800 text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-slate-800 text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="priority">Sort by Priority</option>
                            <option value="title">Sort by Title</option>
                        </select>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={() => setFilterStatus('all')}
                            variant={filterStatus === 'all' ? 'default' : 'outline'}
                            size="sm"
                            className={filterStatus === 'all' ? 'bg-blue-600' : ''}
                        >
                            All
                        </Button>
                        <Button
                            onClick={() => setFilterStatus('pending')}
                            variant={filterStatus === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            className={filterStatus === 'pending' ? 'bg-blue-600' : ''}
                        >
                            Pending
                        </Button>
                        <Button
                            onClick={() => setFilterStatus('completed')}
                            variant={filterStatus === 'completed' ? 'default' : 'outline'}
                            size="sm"
                            className={filterStatus === 'completed' ? 'bg-blue-600' : ''}
                        >
                            Completed
                        </Button>
                    </div>
                </Card>

                {/* Add Task Button */}
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="w-full mb-6 bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Task
                    </Button>
                )}

                {/* Add Task Form */}
                {showForm && (
                    <Card className="p-6 mb-6 bg-slate-900 border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">New Task</h3>

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="What needs to be done?"
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add details..."
                                    rows={3}
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Priority */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {PRIORITIES.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">None</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tags</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Add tag..."
                                        className="flex-1 bg-slate-800 text-slate-100 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button onClick={addTag} size="sm" type="button">
                                        <Tag className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-blue-300">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={addTask} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Task
                            </Button>
                            <Button onClick={resetForm} variant="outline">
                                Cancel
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-300 mb-4">To Do ({pendingTasks.length})</h2>
                        <div className="space-y-2">
                            {pendingTasks.map((task) => {
                                const priorityConfig = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1];
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

                                return (
                                    <Card
                                        key={task.id}
                                        className={`p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors ${isOverdue ? 'border-l-4 border-l-red-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <button
                                                onClick={() => toggleTask(task)}
                                                className="text-slate-400 hover:text-blue-500 transition-colors mt-1"
                                            >
                                                <Circle className="w-6 h-6" />
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-slate-100 font-medium">{task.title}</h3>
                                                    <button
                                                        onClick={() => deleteTask(task)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {/* Priority Badge */}
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityConfig.color} bg-opacity-20 ${priorityConfig.textColor}`}>
                                                        {priorityConfig.label}
                                                    </span>

                                                    {/* Category */}
                                                    {task.category && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                                            <FolderOpen className="w-3 h-3" />
                                                            {task.category}
                                                        </span>
                                                    )}

                                                    {/* Due Date */}
                                                    {task.dueDate && (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'
                                                            }`}>
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}

                                                    {/* Tags */}
                                                    {task.tags?.map(tag => (
                                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                                            <Tag className="w-3 h-3" />
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-slate-300 mb-4">Completed ({completedTasks.length})</h2>
                        <div className="space-y-2">
                            {completedTasks.map((task) => (
                                <Card
                                    key={task.id}
                                    className="p-4 bg-slate-900/50 border-slate-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleTask(task)}
                                            className="text-green-500"
                                        >
                                            <CheckCircle2 className="w-6 h-6" />
                                        </button>
                                        <div className="flex-1">
                                            <p className="text-slate-400 line-through">{task.title}</p>
                                        </div>
                                        <button
                                            onClick={() => deleteTask(task)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {filteredTasks.length === 0 && (
                    <Card className="p-12 text-center bg-slate-900 border-slate-800">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">
                            {searchQuery || filterPriority !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                                ? 'No tasks match your filters'
                                : 'No tasks yet'}
                        </h3>
                        <p className="text-slate-400">
                            {searchQuery || filterPriority !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Click "Add New Task" to create your first task'}
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
