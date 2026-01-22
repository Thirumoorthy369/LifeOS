'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { db } from '@/lib/db';
import { Upload, FileText, Image, Loader2, BookOpen, Brain } from 'lucide-react';
import { validateFile } from '@/lib/ai-security';

interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'image';
    url: string;
    extractedText?: string;
    subjectId?: string;
    createdAt: Date;
}

interface Subject {
    id: string;
    name: string;
    description?: string;
}

export default function StudyPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const [aiResponse, setAiResponse] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [quotaInfo, setQuotaInfo] = useState({ remaining: 0, resetAt: '' });

    // Load documents and subjects from IndexedDB
    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        try {
            const docs = await db.documents
                .where('owner_id')
                .equals(user.uid)
                .toArray();

            const subs = await db.subjects
                .where('owner_id')
                .equals(user.uid)
                .toArray();

            setDocuments(docs as any);
            setSubjects(subs as any);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // Client-side validation
        const validation = validateFile(file);
        if (!validation.valid) {
            setUploadError(validation.error || 'Invalid file');
            return;
        }

        setIsUploading(true);
        setUploadError('');

        try {
            // Get Firebase token
            const token = await user.getIdToken();

            // Prepare form data
            const formData = new FormData();
            formData.append('file', file);
            if (selectedSubject) {
                formData.append('subjectId', selectedSubject);
            }

            // Upload to server
            const response = await fetch('/api/ai/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }

            const data = await response.json();

            // Save to IndexedDB
            await db.documents.add({
                id: data.document.id,
                name: data.document.name,
                type: data.document.type,
                url: data.document.url,
                extractedText: data.document.extractedText,
                subjectId: selectedSubject || undefined,
                createdAt: new Date(),
                owner_id: user.uid,
                synced: true,
            });

            // Update quota info
            setQuotaInfo(data.usage);

            // Reload documents
            await loadData();

            // Select the uploaded document
            setSelectedDocument(data.document);
        } catch (error: any) {
            setUploadError(error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const processDocument = async (taskType: 'summary' | 'quiz' | 'explain') => {
        if (!selectedDocument || !user) return;

        setIsProcessing(true);
        setAiResponse('');

        try {
            const token = await user.getIdToken();

            const response = await fetch('/api/ai/document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    taskType,
                    documentId: selectedDocument.id,
                    text: selectedDocument.extractedText || '',
                    numQuestions: 5,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Processing failed');
            }

            const data = await response.json();
            setAiResponse(data.response);
            setQuotaInfo(data.usage);
        } catch (error: any) {
            setAiResponse(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <p className="text-slate-400">Please sign in to access the study planner.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                            <BookOpen className="w-10 h-10 text-blue-500" />
                            Study Planner
                        </h1>
                        <p className="text-slate-400 mt-2">Upload documents and use AI to study smarter</p>
                        {quotaInfo.remaining > 0 && (
                            <p className="text-sm text-slate-500 mt-1">
                                AI requests remaining: {quotaInfo.remaining}
                            </p>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Upload and Documents */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Upload Section */}
                        <Card className="p-6 bg-slate-900 border-slate-800">
                            <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-blue-500" />
                                Upload Document
                            </h2>

                            {/* Subject Selector */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Subject (optional)
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">No subject</option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* File Input */}
                            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-slate-800/50">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                                >
                                    {isUploading ? (
                                        <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-500 animate-spin" />
                                    ) : (
                                        <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                    )}
                                    <p className="text-sm text-slate-300">
                                        {isUploading ? 'Uploading...' : 'Click to upload PDF or image'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">Max 10MB</p>
                                </label>
                            </div>

                            {uploadError && (
                                <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-sm text-red-400">
                                    <strong className="block mb-1">Upload Error:</strong>
                                    {uploadError}
                                    <p className="text-xs mt-2 text-red-300">
                                        Make sure your file is under 10MB and in supported format (PDF, PNG, JPG)
                                    </p>
                                </div>
                            )}
                        </Card>

                        {/* Documents List */}
                        <Card className="p-6 bg-slate-900 border-slate-800">
                            <h2 className="text-xl font-semibold mb-4 text-slate-100">Your Documents</h2>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {documents.length === 0 ? (
                                    <p className="text-slate-500 text-sm">No documents yet</p>
                                ) : (
                                    documents.map((doc) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => setSelectedDocument(doc)}
                                            className={`w-full p-3 rounded-lg text-left transition-colors ${selectedDocument?.id === doc.id
                                                ? 'bg-blue-500/20 border-2 border-blue-500'
                                                : 'bg-slate-800 hover:bg-slate-700 border-2 border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {doc.type === 'pdf' ? (
                                                    <FileText className="w-5 h-5 text-red-400" />
                                                ) : (
                                                    <Image className="w-5 h-5 text-green-400" />
                                                )}
                                                <span className="text-sm font-medium truncate text-slate-100">{doc.name}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                                )}
                            </div>
                    </div>
                </div>

                {/* Right: AI Interaction */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-600" />
                            AI Study Assistant
                        </h2>

                        {!selectedDocument ? (
                            <div className="text-center py-16 text-gray-500">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p>Select a document to start studying</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Document Info */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-900">{selectedDocument.name}</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {selectedDocument.extractedText
                                            ? `${selectedDocument.extractedText.length} characters extracted`
                                            : 'No text extracted'}
                                    </p>
                                </div>

                                {/* AI Action Buttons */}
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => processDocument('summary')}
                                        disabled={isProcessing || !selectedDocument.extractedText}
                                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    >
                                        Summarize
                                    </button>
                                    <button
                                        onClick={() => processDocument('quiz')}
                                        disabled={isProcessing || !selectedDocument.extractedText}
                                        className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    >
                                        Create Quiz
                                    </button>
                                    <button
                                        onClick={() => processDocument('explain')}
                                        disabled={isProcessing || !selectedDocument.extractedText}
                                        className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                    >
                                        Explain
                                    </button>
                                </div>

                                {/* AI Response */}
                                {(isProcessing || aiResponse) && (
                                    <div className="bg-gray-50 rounded-lg p-6 min-h-64">
                                        {isProcessing ? (
                                            <div className="flex items-center justify-center py-16">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                                <span className="ml-3 text-gray-600">Processing with AI...</span>
                                            </div>
                                        ) : (
                                            <div className="prose max-w-none">
                                                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                                                    {aiResponse}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div >
    );
}
