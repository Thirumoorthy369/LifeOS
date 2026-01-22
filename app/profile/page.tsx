'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Shield, Bell, Palette, Database, Trash2, LogOut, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Settings state
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [language, setLanguage] = useState('English');

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-400">Please sign in to view profile settings.</p>
            </div>
        );
    }

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('Logged out successfully!');
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout. Please try again.');
        }
    };

    const deleteAllUserData = async () => {
        if (!user) return;

        setIsDeleting(true);
        try {
            // Delete all user data from IndexedDB
            await db.tasks.where('owner_id').equals(user.uid).delete();
            await db.expenses.where('owner_id').equals(user.uid).delete();
            await db.habits.where('owner_id').equals(user.uid).delete();
            await db.notes.where('owner_id').equals(user.uid).delete();
            await db.documents.where('owner_id').equals(user.uid).delete();

            toast.success('All data deleted successfully!');

            // Sign out after deletion
            setTimeout(async () => {
                await signOut(auth);
                router.push('/');
            }, 1000);
        } catch (error) {
            console.error('Error deleting data:', error);
            toast.error('Failed to delete data. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const clearLocalCache = async () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            toast.success('Local cache cleared successfully!');
        } catch (error) {
            toast.error('Failed to clear cache');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Profile Settings</h1>
                        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
                    </div>
                    <Button onClick={() => router.push('/dashboard')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Account Information */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <User className="w-6 h-6 text-blue-500" />
                            <h2 className="text-xl font-semibold text-slate-100">Account Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
                                    <div className="bg-slate-800 text-slate-100 px-4 py-3 rounded-lg border border-slate-700">
                                        {user.displayName || 'Not set'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                                    <div className="bg-slate-800 text-slate-100 px-4 py-3 rounded-lg border border-slate-700 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        {user.email}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">User ID</label>
                                <div className="bg-slate-800 text-slate-400 px-4 py-3 rounded-lg border border-slate-700 text-sm font-mono">
                                    {user.uid}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                {user.emailVerified ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <span className="text-green-500">Email Verified</span>
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4 text-yellow-500" />
                                        <span className="text-yellow-500">Email Not Verified</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Notifications */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <Bell className="w-6 h-6 text-purple-500" />
                            <h2 className="text-xl font-semibold text-slate-100">Notifications</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-100 font-medium">Email Notifications</p>
                                    <p className="text-sm text-slate-400">Receive updates via email</p>
                                </div>
                                <button
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-blue-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-100 font-medium">Push Notifications</p>
                                    <p className="text-sm text-slate-400">Receive browser notifications</p>
                                </div>
                                <button
                                    onClick={() => setPushNotifications(!pushNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? 'bg-blue-600' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </Card>

                    {/* Appearance */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <Palette className="w-6 h-6 text-pink-500" />
                            <h2 className="text-xl font-semibold text-slate-100">Appearance</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Theme</label>
                                <select
                                    value={darkMode ? 'dark' : 'light'}
                                    onChange={(e) => setDarkMode(e.target.value === 'dark')}
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="dark">Dark Mode</option>
                                    <option value="light">Light Mode (Coming Soon)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi (Coming Soon)</option>
                                    <option value="Tamil">Tamil (Coming Soon)</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    {/* Data Management */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <Database className="w-6 h-6 text-green-500" />
                            <h2 className="text-xl font-semibold text-slate-100">Data Management</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                <h3 className="text-slate-100 font-medium mb-2">Clear Local Cache</h3>
                                <p className="text-sm text-slate-400 mb-3">
                                    Clear stored preferences and cached data from your browser
                                </p>
                                <Button onClick={clearLocalCache} variant="outline" size="sm">
                                    Clear Cache
                                </Button>
                            </div>

                            <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                                <h3 className="text-red-300 font-medium mb-2 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Delete All Data
                                </h3>
                                <p className="text-sm text-red-400 mb-3">
                                    Permanently delete all your tasks, expenses, habits, notes, and documents. This action cannot be undone.
                                </p>
                                {!showDeleteConfirm ? (
                                    <Button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        variant="outline"
                                        size="sm"
                                        className="border-red-500 text-red-400 hover:bg-red-500/20"
                                    >
                                        Delete All My Data
                                    </Button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-red-300">
                                            Are you absolutely sure? This will delete everything!
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={deleteAllUserData}
                                                disabled={isDeleting}
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                                            </Button>
                                            <Button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Logout */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <LogOut className="w-6 h-6 text-orange-500" />
                            <h2 className="text-xl font-semibold text-slate-100">Logout</h2>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-400">
                                Sign out of your account. All your data will remain safe and you can log back in anytime.
                            </p>
                            <Button
                                onClick={handleLogout}
                                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </Card>

                    {/* App Info */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="text-center">
                            <h3 className="text-slate-100 font-semibold mb-2">LifeOS</h3>
                            <p className="text-sm text-slate-400">Version 2.0.0</p>
                            <p className="text-xs text-slate-500 mt-2">
                                © 2026 LifeOS. Your personal productivity dashboard.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
