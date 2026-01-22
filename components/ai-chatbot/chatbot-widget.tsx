'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { MessageCircle, X, Send, Loader2, Minimize2 } from 'lucide-react';
import { db } from '@/lib/db';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function ChatbotWidget() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [quotaInfo, setQuotaInfo] = useState({ remaining: 0, resetAt: '' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load chat history from IndexedDB
    useEffect(() => {
        if (user && isOpen) {
            loadChatHistory();
        }
    }, [user, isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadChatHistory = async () => {
        // For now, keep in state. Could extend db.ts to add chat_messages table
        // Load from localStorage as simple implementation
        const saved = localStorage.getItem(`chat_history_${user?.uid}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp),
                })));
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        }
    };

    const saveChatHistory = (newMessages: ChatMessage[]) => {
        if (user) {
            localStorage.setItem(
                `chat_history_${user.uid}`,
                JSON.stringify(newMessages)
            );
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !user || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Get user context from IndexedDB
            const tasks = await db.tasks.where('owner_id').equals(user.uid).limit(5).toArray();
            const notes = await db.notes.where('owner_id').equals(user.uid).limit(3).toArray();
            const habits = await db.habits.where('owner_id').equals(user.uid).toArray();

            const context = {
                tasks: tasks.map(t => `- ${t.title}${t.completed ? ' (completed)' : ''}`).join('\n'),
                notes: notes.map(n => `- ${n.title}`).join('\n'),
                habits: habits.map(h => `- ${h.name} (${h.streak} day streak)`).join('\n'),
            };

            // Get Firebase token
            const token = await user.getIdToken();

            // Call API
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    includeContext: true,
                    context,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get response');
            }

            const data = await response.json();

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            const finalMessages = [...newMessages, assistantMessage];
            setMessages(finalMessages);
            saveChatHistory(finalMessages);
            setQuotaInfo(data.usage);

            // Sync created entities to IndexedDB
            if (data.action?.success && data.action?.data) {
                try {
                    const { entity, type, data: actionData } = data.action;

                    if (entity === 'task' && type === 'create' && actionData.taskId) {
                        // Add task to IndexedDB so it appears in dashboard immediately
                        await db.tasks.add({
                            id: actionData.taskId,
                            title: actionData.title,
                            description: '',
                            completed: false,
                            isPrimary: false,
                            isRecurring: false,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            owner_id: user.uid,
                            synced: true, // Already synced to Supabase
                        });

                        // Notify other components to refresh
                        window.dispatchEvent(new CustomEvent('tasksUpdated'));
                    } else if (entity === 'habit' && type === 'create') {
                        // Similar sync for habits
                        if (actionData.habitId) {
                            await db.habits.add({
                                id: actionData.habitId,
                                name: actionData.name || '',
                                description: '',
                                frequency: actionData.frequency || 'daily',
                                streak: 0,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                owner_id: user.uid,
                                synced: true,
                            });
                            window.dispatchEvent(new CustomEvent('habitsUpdated'));
                        }
                    } else if (entity === 'note' && type === 'create') {
                        // Similar sync for notes
                        if (actionData.noteId) {
                            await db.notes.add({
                                id: actionData.noteId,
                                title: actionData.title || '',
                                content: actionData.content || '',
                                tags: [],
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                owner_id: user.uid,
                                synced: true,
                            });
                            window.dispatchEvent(new CustomEvent('notesUpdated'));
                        }
                    } else if (entity === 'expense' && type === 'create') {
                        // Similar sync for expenses
                        if (actionData.expenseId) {
                            await db.expenses.add({
                                id: actionData.expenseId,
                                amount: actionData.amount || 0,
                                category: actionData.category || 'Other',
                                description: actionData.description || '',
                                date: new Date(),
                                createdAt: new Date(),
                                owner_id: user.uid,
                                synced: true,
                            });
                            window.dispatchEvent(new CustomEvent('expensesUpdated'));
                        }
                    }
                } catch (syncError) {
                    console.error('Failed to sync to IndexedDB:', syncError);
                    // Non-critical error - task is still in Supabase
                }
            }
        } catch (error: any) {
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${error.message}. Please try again.`,
                timestamp: new Date(),
            };
            const finalMessages = [...newMessages, errorMessage];
            setMessages(finalMessages);
            saveChatHistory(finalMessages);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        if (user) {
            localStorage.removeItem(`chat_history_${user.uid}`);
        }
    };

    // Auto-open chatbot on dashboard (first time login)
    useEffect(() => {
        if (!user || isOpen || pathname !== '/dashboard') return;

        const hasSeenChatbot = localStorage.getItem('chatbot_seen');
        if (!hasSeenChatbot) {
            const timer = setTimeout(() => {
                setIsOpen(true);
                // Add welcome message
                const welcomeMsg: ChatMessage = {
                    id: 'welcome',
                    role: 'assistant',
                    content: '👋 Hi! I\'m your AI assistant. I can help you with:\n\n• Managing your tasks\n• Tracking habits\n• Analyzing expenses\n• Organizing notes\n\nJust ask me anything!',
                    timestamp: new Date(),
                };
                setMessages([welcomeMsg]);
                localStorage.setItem('chatbot_seen', 'true');
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [user, isOpen, pathname, setMessages]);

    // CRITICAL: Early return MUST come AFTER all hooks
    // Hide chatbot on auth/login pages
    if (!user || pathname === '/') return null;

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
                    aria-label="Open AI Chat"
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
                        }`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-semibold">AI Assistant</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="hover:bg-white/20 p-1 rounded transition-colors"
                                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:bg-white/20 p-1 rounded transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Ask me anything about your tasks, notes, or habits!</p>
                                        {quotaInfo.remaining > 0 && (
                                            <p className="text-xs mt-2">
                                                {quotaInfo.remaining} requests remaining
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                    <p
                                                        className={`text-xs mt-1 ${message.role === 'user'
                                                            ? 'text-white/70'
                                                            : 'text-gray-500'
                                                            }`}
                                                    >
                                                        {message.timestamp.toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Input */}
                            <div className="border-t border-gray-200 p-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type your message..."
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-500"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={isLoading || !input.trim()}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        aria-label="Send message"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                                {messages.length > 0 && (
                                    <button
                                        onClick={clearChat}
                                        className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline"
                                    >
                                        Clear chat
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
