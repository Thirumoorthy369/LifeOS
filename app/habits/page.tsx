'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Flame, CheckCircle2, Target, Trash2, Calendar, TrendingUp, Award, Star, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Habit {
    id?: string;
    name: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'custom';
    customDays?: number[];
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    color?: string;
    icon?: string;
    streak: number;
    longestStreak?: number;
    completionCount?: number;
    lastCompleted?: Date;
    completionHistory?: { date: Date; note?: string; count?: number }[];
    createdAt: Date;
    updatedAt: Date;
    owner_id: string;
    synced: boolean;
}

const HABIT_CATEGORIES = [
    { name: 'Health', icon: '💪', color: 'bg-green-500' },
    { name: 'Productivity', icon: '⚡', color: 'bg-blue-500' },
    { name: 'Learning', icon: '📚', color: 'bg-purple-500' },
    { name: 'Mindfulness', icon: '🧘', color: 'bg-pink-500' },
    { name: 'Social', icon: '👥', color: 'bg-yellow-500' },
    { name: 'Fitness', icon: '🏃', color: 'bg-red-500' },
    { name: 'Other', icon: '⭐', color: 'bg-gray-500' },
];

const MOTIVATIONAL_MESSAGES = [
    "🔥 You're on fire! Keep it up!",
    "🌟 Amazing streak! You're unstoppable!",
    "💪 Consistency is key - you're crushing it!",
    "🎯 Perfect! Another day, another win!",
    "🚀 Your dedication is inspiring!",
    "⭐ Small steps lead to big changes!",
    "🏆 Champion mindset right there!",
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [newHabit, setNewHabit] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
    const [category, setCategory] = useState('');
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [customDays, setCustomDays] = useState<number[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [completionNote, setCompletionNote] = useState('');

    useEffect(() => {
        if (user) {
            loadHabits();
        }
    }, [user]);

    const loadHabits = async () => {
        if (!user) return;

        const allHabits = await db.habits
            .where('owner_id')
            .equals(user.uid)
            .reverse()
            .sortBy('createdAt');

        setHabits(allHabits as any);
    };

    const addHabit = async () => {
        if (!newHabit.trim() || !user) return;

        const categoryConfig = HABIT_CATEGORIES.find(c => c.name === category);

        const habit: Omit<Habit, 'id'> = {
            name: newHabit,
            description: description || undefined,
            frequency,
            customDays: frequency === 'custom' ? customDays : undefined,
            category: category || undefined,
            difficulty,
            color: categoryConfig?.color,
            icon: categoryConfig?.icon,
            streak: 0,
            longestStreak: 0,
            completionCount: 0,
            completionHistory: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            owner_id: user.uid,
            synced: false,
        };

        await db.habits.add(habit as any);
        resetForm();
        loadHabits();
        toast.success('Habit added!');
    };

    const resetForm = () => {
        setNewHabit('');
        setDescription('');
        setFrequency('daily');
        setCategory('');
        setDifficulty('medium');
        setCustomDays([]);
        setShowForm(false);
    };

    const completeHabit = async (habit: Habit) => {
        if (!habit.id) return;

        const now = new Date();
        const newStreak = habit.streak + 1;
        const longestStreak = Math.max(newStreak, habit.longestStreak || 0);
        const completionCount = (habit.completionCount || 0) + 1;
        const completionHistory = [
            ...(habit.completionHistory || []),
            { date: now, note: completionNote, count: 1 }
        ];

        await db.habits.update(habit.id, {
            streak: newStreak,
            longestStreak,
            completionCount,
            completionHistory,
            lastCompleted: now,
            updatedAt: now,
        });

        setCompletionNote('');
        setSelectedHabit(null);
        loadHabits();

        const message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
        toast.success(message, {
            description: `${newStreak} day streak!`
        });
    };

    const deleteHabit = async (habit: Habit) => {
        if (!habit.id) return;

        await db.habits.delete(habit.id);
        loadHabits();
        toast.success('Habit deleted!');
    };

    const toggleCustomDay = (day: number) => {
        setCustomDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort()
        );
    };

    const isCompletedToday = (habit: Habit): boolean => {
        if (!habit.lastCompleted) return false;

        const today = new Date().toDateString();
        const lastCompleted = new Date(habit.lastCompleted).toDateString();

        return today === lastCompleted;
    };

    const getCompletionRate = (habit: Habit): number => {
        if (!habit.createdAt) return 0;

        const daysSinceStart = Math.floor(
            (new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceStart === 0) return 0;

        return Math.round(((habit.completionCount || 0) / Math.max(daysSinceStart, 1)) * 100);
    };

    // Get last 7 days for mini calendar
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    };

    const isCompletedOnDate = (habit: Habit, date: Date): boolean => {
        if (!habit.completionHistory) return false;
        const dateStr = date.toDateString();
        return habit.completionHistory.some(
            completion => new Date(completion.date).toDateString() === dateStr
        );
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-400">Please sign in to view habits.</p>
            </div>
        );
    }

    const totalHabits = habits.length;
    const completedToday = habits.filter(isCompletedToday).length;
    const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
    const longestStreakEver = Math.max(...habits.map(h => h.longestStreak || 0), 0);

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Advanced Habit Tracker</h1>
                        <p className="text-slate-400 mt-1">{totalHabits} active habits</p>
                    </div>
                    <Button onClick={() => router.push('/dashboard')} variant="outline">
                        ← Dashboard
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-slate-900 border-slate-800 text-center">
                        <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                        <p className="text-2xl font-bold text-slate-100">{longestStreakEver}</p>
                        <p className="text-sm text-slate-400">Longest Streak</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-slate-900 border-slate-800 text-center">
                        <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold text-slate-100">{totalHabits}</p>
                        <p className="text-sm text-slate-400">Total Habits</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-900/20 to-slate-900 border-slate-800 text-center">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold text-slate-100">{completedToday}</p>
                        <p className="text-sm text-slate-400">Done Today</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-slate-900 border-slate-800 text-center">
                        <Award className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <p className="text-2xl font-bold text-slate-100">{totalStreak}</p>
                        <p className="text-sm text-slate-400">Total Streaks</p>
                    </Card>
                </div>

                {/* Add Habit Button */}
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="w-full mb-6 bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add New Habit
                    </Button>
                )}

                {/* Add Habit Form */}
                {showForm && (
                    <Card className="p-6 mb-6 bg-slate-900 border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">New Habit</h3>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Habit Name *</label>
                                <input
                                    type="text"
                                    value={newHabit}
                                    onChange={(e) => setNewHabit(e.target.value)}
                                    placeholder="e.g., Drink 8 glasses of water"
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    autoFocus
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Why is this habit important to you?"
                                    rows={2}
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Category */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Category</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {HABIT_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.name}
                                                onClick={() => setCategory(cat.name)}
                                                className={`p-2 rounded-lg border-2 transition-all ${category === cat.name
                                                        ? 'border-purple-500 bg-purple-500/20'
                                                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="text-xl mb-0.5">{cat.icon}</div>
                                                <div className="text-xs text-slate-300">{cat.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Difficulty</label>
                                    <div className="flex gap-2">
                                        {(['easy', 'medium', 'hard'] as const).map((diff) => (
                                            <Button
                                                key={diff}
                                                onClick={() => setDifficulty(diff)}
                                                variant={difficulty === diff ? 'default' : 'outline'}
                                                className={`flex-1 ${difficulty === diff ? 'bg-purple-600' : ''}`}
                                            >
                                                {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Frequency</label>
                                <div className="flex gap-2 mb-3">
                                    <Button
                                        onClick={() => setFrequency('daily')}
                                        variant={frequency === 'daily' ? 'default' : 'outline'}
                                        className={frequency === 'daily' ? 'bg-purple-600' : ''}
                                    >
                                        Daily
                                    </Button>
                                    <Button
                                        onClick={() => setFrequency('weekly')}
                                        variant={frequency === 'weekly' ? 'default' : 'outline'}
                                        className={frequency === 'weekly' ? 'bg-purple-600' : ''}
                                    >
                                        Weekly
                                    </Button>
                                    <Button
                                        onClick={() => setFrequency('custom')}
                                        variant={frequency === 'custom' ? 'default' : 'outline'}
                                        className={frequency === 'custom' ? 'bg-purple-600' : ''}
                                    >
                                        Custom
                                    </Button>
                                </div>

                                {/* Custom Days */}
                                {frequency === 'custom' && (
                                    <div className="flex gap-2">
                                        {DAYS_OF_WEEK.map((day, index) => (
                                            <button
                                                key={day}
                                                onClick={() => toggleCustomDay(index)}
                                                className={`flex-1 px-3 py-2 rounded-lg border-2 transition-all ${customDays.includes(index)
                                                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={addHabit} className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Habit
                            </Button>
                            <Button onClick={resetForm} variant="outline">
                                Cancel
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Habits List */}
                {habits.length > 0 ? (
                    <div className="space-y-3">
                        {habits.map((habit) => {
                            const completedToday = isCompletedToday(habit);
                            const last7Days = getLast7Days();
                            const categoryConfig = HABIT_CATEGORIES.find(c => c.name === habit.category);
                            const completionRate = getCompletionRate(habit);

                            return (
                                <Card
                                    key={habit.id}
                                    className={`p-5 border-slate-800 transition-all ${completedToday ? 'bg-green-900/20 border-green-500/30' : 'bg-slate-900'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <button
                                            onClick={() => !completedToday && setSelectedHabit(habit)}
                                            disabled={completedToday}
                                            className={`${completedToday
                                                    ? 'text-green-500 cursor-not-allowed'
                                                    : 'text-slate-400 hover:text-purple-500 hover:scale-110'
                                                } transition-all mt-1`}
                                        >
                                            {completedToday ? (
                                                <CheckCircle2 className="w-10 h-10" />
                                            ) : (
                                                <Target className="w-10 h-10" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold text-slate-100">
                                                        {habit.name}
                                                    </h3>
                                                    {categoryConfig && (
                                                        <span className="text-xl">{categoryConfig.icon}</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => deleteHabit(habit)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {habit.description && (
                                                <p className="text-sm text-slate-400 mb-3">{habit.description}</p>
                                            )}

                                            {/* Stats Row */}
                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                {habit.streak > 0 && (
                                                    <span className="flex items-center gap-1 text-sm font-medium text-orange-500">
                                                        <Flame className="w-4 h-4" />
                                                        {habit.streak} day streak
                                                    </span>
                                                )}
                                                <span className="text-sm text-slate-400 capitalize">
                                                    {habit.frequency}
                                                    {habit.difficulty && ` • ${habit.difficulty}`}
                                                </span>
                                                <span className="text-sm text-slate-400">
                                                    {completionRate}% completion rate
                                                </span>
                                                {habit.longestStreak && habit.longestStreak > 0 && (
                                                    <span className="flex items-center gap-1 text-sm text-yellow-500">
                                                        <Award className="w-4 h-4" />
                                                        Best: {habit.longestStreak}
                                                    </span>
                                                )}
                                            </div>

                                            {/* 7-Day Calendar */}
                                            <div className="flex gap-1">
                                                {last7Days.map((date, index) => {
                                                    const completed = isCompletedOnDate(habit, date);
                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`flex-1 h-8 rounded flex items-center justify-center ${completed
                                                                    ? 'bg-green-500/30 border border-green-500'
                                                                    : 'bg-slate-800 border border-slate-700'
                                                                }`}
                                                            title={date.toLocaleDateString()}
                                                        >
                                                            {completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-12 text-center bg-slate-900 border-slate-800">
                        <Flame className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">
                            No habits yet
                        </h3>
                        <p className="text-slate-400">
                            Start building positive habits today
                        </p>
                    </Card>
                )}

                {/* Completion Modal */}
                {selectedHabit && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <Card className="p-6 bg-slate-900 border-slate-800 max-w-md w-full">
                            <h3 className="text-xl font-semibold text-slate-100 mb-4">
                                Complete: {selectedHabit.name}
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm text-slate-400 mb-2">
                                    Add a note (optional)
                                </label>
                                <textarea
                                    value={completionNote}
                                    onChange={(e) => setCompletionNote(e.target.value)}
                                    placeholder="How did it go?"
                                    rows={3}
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => completeHabit(selectedHabit)}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Complete
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectedHabit(null);
                                        setCompletionNote('');
                                    }}
                                    variant="outline"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
