'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, FileText, Search, Trash2, Edit3, Pin, Folder, FolderOpen, Tag, Star, Eye, Code, List, CheckSquare, Type, Image as ImageIcon, X, PinOff } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
    id?: string;
    title: string;
    content: string;
    folder?: string;
    tags?: string[];
    color?: string;
    isPinned?: boolean;
    isMarkdown?: boolean;
    createdAt: Date;
    updatedAt: Date;
    owner_id: string;
    synced: boolean;
}

const NOTE_COLORS = [
    { name: 'Default', value: '', bg: 'bg-slate-900', border: 'border-slate-800' },
    { name: 'Blue', value: 'blue', bg: 'bg-blue-900/30', border: 'border-blue-500/30' },
    { name: 'Green', value: 'green', bg: 'bg-green-900/30', border: 'border-green-500/30' },
    { name: 'Purple', value: 'purple', bg: 'bg-purple-900/30', border: 'border-purple-500/30' },
    { name: 'Orange', value: 'orange', bg: 'bg-orange-900/30', border: 'border-orange-500/30' },
    { name: 'Pink', value: 'pink', bg: 'bg-pink-900/30', border: 'border-pink-500/30' },
];

const DEFAULT_FOLDERS = ['Personal', 'Work', 'Ideas', 'Archive'];

export default function NotesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isMarkdown, setIsMarkdown] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFolder, setFilterFolder] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [newTag, setNewTag] = useState('');
    const [newFolder, setNewFolder] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotes();
        }
    }, [user]);

    const loadNotes = async () => {
        if (!user) return;

        const allNotes = await db.notes
            .where('owner_id')
            .equals(user.uid)
            .reverse()
            .sortBy('updatedAt');

        setNotes(allNotes as any);
    };

    const addOrUpdateNote = async () => {
        if (!title.trim() || !content.trim() || !user) {
            toast.error('Please fill in both title and content');
            return;
        }

        const noteData = {
            title: title.trim(),
            content: content.trim(),
            folder: selectedFolder || undefined,
            tags: selectedTags,
            color: selectedColor || undefined,
            isPinned,
            isMarkdown,
            updatedAt: new Date(),
            owner_id: user.uid,
            synced: false,
        };

        if (editingNote && editingNote.id) {
            await db.notes.update(editingNote.id, noteData);
            toast.success('Note updated!');
        } else {
            await db.notes.add({
                ...noteData,
                createdAt: new Date(),
            } as any);
            toast.success('Note created!');
        }

        resetForm();
        loadNotes();
    };

    const editNote = (note: Note) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setSelectedFolder(note.folder || '');
        setSelectedColor(note.color || '');
        setSelectedTags(note.tags || []);
        setIsPinned(note.isPinned || false);
        setIsMarkdown(note.isMarkdown || false);
        setShowForm(true);
    };

    const deleteNote = async (note: Note) => {
        if (!note.id) return;

        await db.notes.delete(note.id);
        loadNotes();
        toast.success('Note deleted!');
    };

    const togglePin = async (note: Note, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!note.id) return;

        await db.notes.update(note.id, {
            isPinned: !note.isPinned,
            updatedAt: new Date(),
        });

        loadNotes();
        toast.success(note.isPinned ? 'Unpinned' : 'Pinned!');
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setSelectedFolder('');
        setSelectedColor('');
        setSelectedTags([]);
        setIsPinned(false);
        setIsMarkdown(false);
        setShowForm(false);
        setEditingNote(null);
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

    const addFolder = () => {
        if (newFolder.trim() && !folders.includes(newFolder.trim())) {
            setFolders([...folders, newFolder.trim()]);
            setNewFolder('');
            toast.success('Folder created!');
        }
    };

    const formatMarkdown = (text: string): string => {
        return text
            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-slate-100 mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-slate-100 mt-4 mb-2">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-slate-100 mt-4 mb-2">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-slate-800 text-blue-400 px-1 rounded">$1</code>')
            .replace(/\n/g, '<br>');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-400">Please sign in to view notes.</p>
            </div>
        );
    }

    // Filter notes
    let filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = filterFolder === 'all' || note.folder === filterFolder;
        return matchesSearch && matchesFolder;
    });

    // Separate pinned and unpinned
    const pinnedNotes = filteredNotes.filter(n => n.isPinned);
    const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

    // Get all unique tags from notes
    const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Advanced Notes</h1>
                        <p className="text-slate-400 mt-1">{notes.length} total notes</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            variant="outline"
                            size="sm"
                        >
                            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </Button>
                        <Button onClick={() => router.push('/dashboard')} variant="outline">
                            ← Dashboard
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Search */}
                        <Card className="p-4 bg-slate-900 border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search notes..."
                                    className="w-full bg-slate-800 text-slate-100 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </Card>

                        {/* Folders */}
                        <Card className="p-4 bg-slate-900 border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                <FolderOpen className="w-4 h-4" />
                                Folders
                            </h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setFilterFolder('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${filterFolder === 'all' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
                                        }`}
                                >
                                    All Notes
                                </button>
                                {folders.map(folder => {
                                    const count = notes.filter(n => n.folder === folder).length;
                                    return (
                                        <button
                                            key={folder}
                                            onClick={() => setFilterFolder(folder)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${filterFolder === folder ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'
                                                }`}
                                        >
                                            <span>{folder}</span>
                                            <span className="text-xs">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    value={newFolder}
                                    onChange={(e) => setNewFolder(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addFolder()}
                                    placeholder="New folder..."
                                    className="flex-1 bg-slate-800 text-slate-100 px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Button onClick={addFolder} size="sm">
                                    <Plus className="w-3 h-3" />
                                </Button>
                            </div>
                        </Card>

                        {/* Tags Cloud */}
                        {allTags.length > 0 && (
                            <Card className="p-4 bg-slate-900 border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Add Note Button */}
                        {!showForm && (
                            <Button
                                onClick={() => setShowForm(true)}
                                className="w-full mb-6 bg-blue-600 hover:bg-blue-700"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                New Note
                            </Button>
                        )}

                        {/* Note Form */}
                        {showForm && (
                            <Card className="p-6 mb-6 bg-slate-900 border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-100">
                                        {editingNote ? 'Edit Note' : 'New Note'}
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => setShowPreview(!showPreview)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Editor */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Title *</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Note title..."
                                                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Content *</label>
                                            <textarea
                                                value={content}
                                                onChange={(e) => setContent(e.target.value)}
                                                placeholder="Write your note here... (Use markdown: **bold**, *italic*, `code`, # Heading)"
                                                rows={12}
                                                className="w-full bg-slate-800 text-slate-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                                            />
                                        </div>

                                        {/* Formatting Toolbar */}
                                        <div className="flex gap-2 text-xs text-slate-400">
                                            <code>**bold**</code>
                                            <code>*italic*</code>
                                            <code>`code`</code>
                                            <code># heading</code>
                                            <code>- list</code>
                                        </div>
                                    </div>

                                    {/* Settings & Preview */}
                                    <div className="space-y-4">
                                        {/* Preview */}
                                        {showPreview && (
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Preview</label>
                                                <div
                                                    className="bg-slate-800 text-slate-300 px-4 py-3 rounded-lg min-h-[200px] prose prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
                                                />
                                            </div>
                                        )}

                                        {/* Options */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Folder</label>
                                                <select
                                                    value={selectedFolder}
                                                    onChange={(e) => setSelectedFolder(e.target.value)}
                                                    className="w-full bg-slate-800 text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">None</option>
                                                    {folders.map(folder => (
                                                        <option key={folder} value={folder}>{folder}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Color</label>
                                                <div className="flex gap-2">
                                                    {NOTE_COLORS.map(color => (
                                                        <button
                                                            key={color.value}
                                                            onClick={() => setSelectedColor(color.value)}
                                                            className={`w-8 h-8 rounded-full border-2 ${color.bg} ${selectedColor === color.value ? 'border-blue-500' : 'border-slate-700'
                                                                }`}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
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
                                                    className="flex-1 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <Button onClick={addTag} size="sm">
                                                    <Tag className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTags.map(tag => (
                                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                                                        {tag}
                                                        <button onClick={() => removeTag(tag)}>
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Toggles */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isPinned}
                                                    onChange={(e) => setIsPinned(e.target.checked)}
                                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                                                />
                                                <Pin className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-300">Pin this note</span>
                                            </label>

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isMarkdown}
                                                    onChange={(e) => setIsMarkdown(e.target.checked)}
                                                    className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                                                />
                                                <Code className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-300">Markdown rendering</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <Button onClick={addOrUpdateNote} className="bg-blue-600 hover:bg-blue-700">
                                        {editingNote ? 'Update Note' : 'Create Note'}
                                    </Button>
                                    <Button onClick={resetForm} variant="outline">
                                        Cancel
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Pinned Notes */}
                        {pinnedNotes.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                    <Pin className="w-4 h-4" />
                                    Pinned
                                </h3>
                                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                                    {pinnedNotes.map((note) => {
                                        const colorConfig = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];
                                        return (
                                            <Card
                                                key={note.id}
                                                className={`p-4 ${colorConfig.bg} ${colorConfig.border} hover:border-slate-600 transition-colors cursor-pointer group relative`}
                                            >
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => togglePin(note, e)}
                                                        className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                                                    >
                                                        <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => editNote(note)}
                                                        className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                                                    >
                                                        <Edit3 className="w-3 h-3 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNote(note)}
                                                        className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                    </button>
                                                </div>
                                                <h3 className="font-semibold text-slate-100 mb-2 pr-20">{note.title}</h3>
                                                <p className="text-sm text-slate-400 line-clamp-3 mb-3">{note.content}</p>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        {note.folder && (
                                                            <span className="flex items-center gap-1">
                                                                <Folder className="w-3 h-3" />
                                                                {note.folder}
                                                            </span>
                                                        )}
                                                        {note.tags && note.tags.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Tag className="w-3 h-3" />
                                                                {note.tags.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* All Notes */}
                        {unpinnedNotes.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-300 mb-3">All Notes</h3>
                                <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                                    {unpinnedNotes.map((note) => {
                                        const colorConfig = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];
                                        return (
                                            <Card
                                                key={note.id}
                                                className={`p-4 ${colorConfig.bg} ${colorConfig.border} hover:border-slate-600 transition-colors cursor-pointer group relative`}
                                            >
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => togglePin(note, e)}
                                                        className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                                                    >
                                                        <Pin className="w-3 h-3 text-slate-400" />
                                                    </button>
                                                    <button
                                                        onClick={() => editNote(note)}
                                                        className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                                                    >
                                                        <Edit3 className="w-3 h-3 text-blue-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNote(note)}
                                                        className="p-1 bg-slate-800 rounded hover:bg-slate-700"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                    </button>
                                                </div>
                                                <h3 className="font-semibold text-slate-100 mb-2 pr-20">{note.title}</h3>
                                                <p className="text-sm text-slate-400 line-clamp-3 mb-3">{note.content}</p>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        {note.folder && (
                                                            <span className="flex items-center gap-1">
                                                                <Folder className="w-3 h-3" />
                                                                {note.folder}
                                                            </span>
                                                        )}
                                                        {note.tags && note.tags.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Tag className="w-3 h-3" />
                                                                {note.tags.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {filteredNotes.length === 0 && (
                            <Card className="p-12 text-center bg-slate-900 border-slate-800">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                                    {searchQuery || filterFolder !== 'all' ? 'No notes found' : 'No notes yet'}
                                </h3>
                                <p className="text-slate-400">
                                    {searchQuery || filterFolder !== 'all'
                                        ? 'Try a different search or folder'
                                        : 'Create your first note to get started'}
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
