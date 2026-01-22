'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, DollarSign, TrendingUp, Calendar, Trash2, Download, Filter, PieChart, BarChart3, Wallet, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
    id?: string;
    amount: number;
    category: string;
    categoryIcon?: string;
    categoryColor?: string;
    description?: string;
    date: Date;
    isRecurring?: boolean;
    recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    createdAt: Date;
    owner_id: string;
    synced: boolean;
}

interface Budget {
    category: string;
    limit: number;
    period: 'monthly' | 'weekly' | 'yearly';
}

const CATEGORY_CONFIGS = [
    { name: 'Food & Dining', icon: '🍔', color: 'bg-red-500' },
    { name: 'Transportation', icon: '🚗', color: 'bg-blue-500' },
    { name: 'Shopping', icon: '🛍️', color: 'bg-purple-500' },
    { name: 'Entertainment', icon: '🎮', color: 'bg-pink-500' },
    { name: 'Bills & Utilities', icon: '💡', color: 'bg-yellow-500' },
    { name: 'Healthcare', icon: '🏥', color: 'bg-green-500' },
    { name: 'Education', icon: '📚', color: 'bg-indigo-500' },
    { name: 'Groceries', icon: '🛒', color: 'bg-emerald-500' },
    { name: 'Fitness', icon: '💪', color: 'bg-orange-500' },
    { name: 'Travel', icon: '✈️', color: 'bg-cyan-500' },
    { name: 'Other', icon: '📝', color: 'bg-gray-500' },
];

export default function ExpensesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORY_CONFIGS[0].name);
    const [description, setDescription] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [budgets, setBudgets] = useState<Budget[]>([
        { category: 'Food & Dining', limit: 10000, period: 'monthly' },
        { category: 'Transportation', limit: 5000, period: 'monthly' },
        { category: 'Entertainment', limit: 3000, period: 'monthly' },
    ]);
    const [showBudgetForm, setShowBudgetForm] = useState(false);

    useEffect(() => {
        if (user) {
            loadExpenses();
        }
    }, [user]);

    const loadExpenses = async () => {
        if (!user) return;

        const allExpenses = await db.expenses
            .where('owner_id')
            .equals(user.uid)
            .reverse()
            .sortBy('date');

        setExpenses(allExpenses as any);
    };

    const addExpense = async () => {
        if (!amount || parseFloat(amount) <= 0 || !user) {
            toast.error('Please enter a valid amount');
            return;
        }

        const categoryConfig = CATEGORY_CONFIGS.find(c => c.name === category);

        const expense: Omit<Expense, 'id'> = {
            amount: parseFloat(amount),
            category,
            categoryIcon: categoryConfig?.icon,
            categoryColor: categoryConfig?.color,
            description: description || undefined,
            date: new Date(selectedDate),
            isRecurring,
            recurringFrequency: isRecurring ? recurringFrequency : undefined,
            createdAt: new Date(),
            owner_id: user.uid,
            synced: false,
        };

        await db.expenses.add(expense as any);
        resetForm();
        loadExpenses();
        toast.success('Expense added!');
    };

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setIsRecurring(false);
        setShowForm(false);
    };

    const deleteExpense = async (expense: Expense) => {
        if (!expense.id) return;

        await db.expenses.delete(expense.id);
        loadExpenses();
        toast.success('Expense deleted!');
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Category', 'Amount', 'Description'];
        const rows = expenses.map(exp => [
            new Date(exp.date).toLocaleDateString(),
            exp.category,
            exp.amount.toFixed(2),
            exp.description || ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Exported to CSV!');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-400">Please sign in to view expenses.</p>
            </div>
        );
    }

    // Calculate statistics
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const getExpensesInRange = (start: Date, end: Date) => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= start && expDate <= end;
        });
    };

    const todayExpenses = getExpensesInRange(startOfDay, new Date());
    const weekExpenses = getExpensesInRange(startOfWeek, new Date());
    const monthExpenses = getExpensesInRange(startOfMonth, new Date());
    const yearExpenses = getExpensesInRange(startOfYear, new Date());

    const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const weekTotal = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const yearTotal = yearExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown
    const categoryTotals = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Budget alerts
    const budgetAlerts = budgets.map(budget => {
        const spent = monthExpenses
            .filter(exp => exp.category === budget.category)
            .reduce((sum, exp) => sum + exp.amount, 0);
        const percentage = (spent / budget.limit) * 100;
        return { ...budget, spent, percentage };
    }).filter(alert => alert.percentage >= 80);

    // Display expenses based on view mode
    let displayExpenses = expenses;
    if (viewMode === 'daily') displayExpenses = todayExpenses;
    else if (viewMode === 'weekly') displayExpenses = weekExpenses;
    else if (viewMode === 'monthly') displayExpenses = monthExpenses;
    else if (viewMode === 'yearly') displayExpenses = yearExpenses;

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Advanced Expense Tracker</h1>
                        <p className="text-slate-400 mt-1">{expenses.length} total expenses</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={exportToCSV} variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                        <Button onClick={() => router.push('/dashboard')} variant="outline">
                            ← Dashboard
                        </Button>
                    </div>
                </div>

                {/* Budget Alerts */}
                {budgetAlerts.length > 0 && (
                    <div className="mb-6">
                        {budgetAlerts.map(alert => (
                            <Card key={alert.category} className="p-4 bg-red-900/20 border-red-500/50 mb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        <span className="text-red-400 font-medium">
                                            Budget Alert: {alert.category}
                                        </span>
                                    </div>
                                    <span className="text-red-400">
                                        ₹{alert.spent.toFixed(0)} / ₹{alert.limit} ({alert.percentage.toFixed(0)}%)
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-slate-900 border-slate-800">
                        <Calendar className="w-6 h-6 mb-2 text-blue-500" />
                        <p className="text-2xl font-bold text-slate-100">₹{todayTotal.toFixed(0)}</p>
                        <p className="text-sm text-slate-400">Today</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-900/20 to-slate-900 border-slate-800">
                        <TrendingUp className="w-6 h-6 mb-2 text-green-500" />
                        <p className="text-2xl font-bold text-slate-100">₹{weekTotal.toFixed(0)}</p>
                        <p className="text-sm text-slate-400">This Week</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-slate-900 border-slate-800">
                        <Wallet className="w-6 h-6 mb-2 text-purple-500" />
                        <p className="text-2xl font-bold text-slate-100">₹{monthTotal.toFixed(0)}</p>
                        <p className="text-sm text-slate-400">This Month</p>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-slate-900 border-slate-800">
                        <BarChart3 className="w-6 h-6 mb-2 text-orange-500" />
                        <p className="text-2xl font-bold text-slate-100">₹{yearTotal.toFixed(0)}</p>
                        <p className="text-sm text-slate-400">This Year</p>
                    </Card>
                </div>

                {/* Top Categories */}
                {topCategories.length > 0 && (
                    <Card className="p-6 mb-6 bg-slate-900 border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-500" />
                            Top Spending Categories
                        </h3>
                        <div className="space-y-3">
                            {topCategories.map(([category, total]) => {
                                const config = CATEGORY_CONFIGS.find(c => c.name === category);
                                const percentage = (total / monthTotal) * 100;
                                return (
                                    <div key={category}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-slate-300 flex items-center gap-2">
                                                <span className="text-xl">{config?.icon}</span>
                                                {category}
                                            </span>
                                            <span className="text-slate-100 font-semibold">₹{total.toFixed(0)}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${config?.color}`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* View Mode Tabs */}
                <div className="flex gap-2 mb-4">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(mode => (
                        <Button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            variant={viewMode === mode ? 'default' : 'outline'}
                            size="sm"
                            className={viewMode === mode ? 'bg-blue-600' : ''}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Button>
                    ))}
                </div>

                {/* Add Expense Button */}
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="w-full mb-6 bg-green-600 hover:bg-green-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Expense
                    </Button>
                )}

                {/* Add Expense Form */}
                {showForm && (
                    <Card className="p-6 mb-6 bg-slate-900 border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">New Expense</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Amount (₹) *</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Category *</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {CATEGORY_CONFIGS.map((cat) => (
                                        <button
                                            key={cat.name}
                                            onClick={() => setCategory(cat.name)}
                                            className={`p-3 rounded-lg border-2 transition-all ${category === cat.name
                                                    ? 'border-green-500 bg-green-500/20'
                                                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{cat.icon}</div>
                                            <div className="text-xs text-slate-300">{cat.name.split(' ')[0]}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., Lunch at cafe"
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                                    />
                                    <span className="text-sm text-slate-300">Recurring Expense</span>
                                </label>

                                {isRecurring && (
                                    <select
                                        value={recurringFrequency}
                                        onChange={(e) => setRecurringFrequency(e.target.value as any)}
                                        className="bg-slate-800 text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={addExpense} className="bg-green-600 hover:bg-green-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Expense
                            </Button>
                            <Button onClick={resetForm} variant="outline">
                                Cancel
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Expenses List */}
                {displayExpenses.length > 0 ? (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-300 mb-3">
                            {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Expenses ({displayExpenses.length})
                        </h3>
                        {displayExpenses.map((expense) => {
                            const config = CATEGORY_CONFIGS.find(c => c.name === expense.category);
                            return (
                                <Card
                                    key={expense.id}
                                    className="p-4 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config?.color} bg-opacity-20`}>
                                            <span className="text-2xl">{config?.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-slate-100 text-lg">
                                                    ₹{expense.amount.toFixed(2)}
                                                </h3>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">{expense.category}</p>
                                            {expense.description && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {expense.description}
                                                </p>
                                            )}
                                            {expense.isRecurring && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                                    Recurring: {expense.recurringFrequency}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteExpense(expense)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="p-12 text-center bg-slate-900 border-slate-800">
                        <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">
                            No expenses for {viewMode} view
                        </h3>
                        <p className="text-slate-400">
                            Start tracking your spending
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
