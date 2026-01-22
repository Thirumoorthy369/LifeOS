'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { db } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Upload, FileText, Image, Loader2, BookOpen, Brain, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateFile } from '@/lib/ai-security';
import { toast } from 'sonner';

interface Document {
    id: string;
    name: string;
    type: 'pdf' | 'image';
    dataUrl: string; // Changed from url to dataUrl
    extractedText?: string;
    size: number;
    uploadedAt: string;
    owner_id: string;
}

export default function StudyPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>('');
    const [aiResponse, setAiResponse] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [quotaInfo, setQuotaInfo] = useState({ remaining: 5, resetAt: '' });

    // Load documents from IndexedDB
    useEffect(() => {
        if (user) {
            loadDocuments();
        }
    }, [user]);

    const loadDocuments = async () => {
        if (!user) return;

        try {
            const docs = await db.documents
                .where('owner_id')
                .equals(user.uid)
                .toArray();

            setDocuments(docs as Document[]);
        } catch (error) {
            console.error('Failed to load documents:', error);
            toast.error('Failed to load documents');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        // Reset input
        event.target.value = '';

        // Client-side validation
        const validation = validateFile(file);
        if (!validation.valid) {
            setUploadError(validation.error || 'Invalid file');
            toast.error(validation.error || 'Invalid file');
            return;
        }

        setIsUploading(true);
        setUploadError('');
        toast.loading('Uploading and processing document...');

        try {
            // Get Firebase token
            const token = await user.getIdToken();

            // Prepare form data
            const formData = new FormData();
            formData.append('file', file);

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

            // Save to IndexedDB with dataUrl
            await db.documents.add({
                id: data.document.id,
                name: data.document.name,
                type: data.document.type,
                dataUrl: data.document.dataUrl, // Store base64 data
                extractedText: data.document.extractedText,
                size: data.document.size,
                uploadedAt: data.document.uploadedAt,
                owner_id: user.uid,
            });

            // Update quota info
            setQuotaInfo(data.usage);

            // Reload documents
            await loadDocuments();

            // Select the uploaded document
            const newDoc = {
                ...data.document,
                owner_id: user.uid,
            };
            setSelectedDocument(newDoc);

            toast.dismiss();
            toast.success(`${data.document.name} uploaded successfully!`);
        } catch (error: any) {
            const errorMsg = error.message || 'Upload failed';
            setUploadError(errorMsg);
            toast.dismiss();
            toast.error(errorMsg);
        } finally {
            setIsUploading(false);
        }
    };

    const processDocument = async (taskType: 'summary' | 'quiz' | 'explain') => {
        if (!selectedDocument || !user) return;

        if (!selectedDocument.extractedText || selectedDocument.extractedText.includes('[Text extraction')) {
            toast.error('No text extracted from this document');
            return;
        }

        setIsProcessing(true);
        setAiResponse('');
        toast.loading(`Generating ${taskType}...`);

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
                    text: selectedDocument.extractedText,
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

            toast.dismiss();
            toast.success('AI processing complete!');
        } catch (error: any) {
            const errorMsg = error.message || 'Processing failed';
            setAiResponse(`Error: ${errorMsg}`);
            toast.dismiss();
            toast.error(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const deleteDocument = async (docId: string) => {
        try {
            await db.documents.delete(docId);
            await loadDocuments();
            if (selectedDocument?.id === docId) {
                setSelectedDocument(null);
                setAiResponse('');
            }
            toast.success('Document deleted');
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Card className="p-8 bg-slate-900 border-slate-800">
                    <p className="text-slate-400">Please sign in to access the study planner.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                        Study Planner
                    </h1>
                    <p className="text-slate-400 mt-2">Upload documents and use AI to study smarter</p>
                    {quotaInfo.remaining > 0 && (
                        <p className="text-sm text-slate-500 mt-1">
                            AI requests remaining: {quotaInfo.remaining}
                        </p>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Upload and Documents */}
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <Card className="p-6 bg-slate-900 border-slate-800">
                            <h2 className="text-xl font-semibold mb-4 text-slate-100">Upload Document</h2>

                            <label
                                className={`
                                    block w-full p-8 border-2 border-dashed rounded-lg cursor-pointer
                                    transition-all duration-200
                                    ${isUploading
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50'
                                    }
                                `}
                            >
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    className="hidden"
                                />

                                <div className="text-center">
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-3" />
                                            <p className="text-slate-300 font-medium">Uploading...</p>
                                            <p className="text-sm text-slate-500 mt-1">Processing your document</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                                            <p className="text-slate-300 font-medium">Click to upload</p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                PDF or Image (max 10MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                            </label>

                            {/* Upload Error */}
                            {uploadError && (
                                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-red-300">Upload Error</p>
                                            <p className="text-sm text-red-400 mt-1">{uploadError}</p>
                                            <p className="text-xs text-slate-500 mt-2">
                                                Supported: PDF files and images under 10MB
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Documents List */}
                        <Card className="p-6 bg-slate-900 border-slate-800">
                            <h2 className="text-xl font-semibold mb-4 text-slate-100">Your Documents</h2>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {documents.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-8">No documents yet</p>
                                ) : (
                                    documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className={`
                                                p-3 rounded-lg transition-all cursor-pointer
                                                ${selectedDocument?.id === doc.id
                                                    ? 'bg-blue-500/20 border-2 border-blue-500'
                                                    : 'bg-slate-800 hover:bg-slate-700 border-2 border-transparent'
                                                }
                                            `}
                                        >
                                            <div
                                                className="flex items-center gap-2"
                                                onClick={() => setSelectedDocument(doc)}
                                            >
                                                {doc.type === 'pdf' ? (
                                                    <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                                                ) : (
                                                    <Image className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                )}
                                                <span className="text-sm font-medium truncate text-slate-100 flex-1">
                                                    {doc.name}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteDocument(doc.id);
                                                    }}
                                                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right: AI Interaction */}
                    <div className="lg:col-span-2">
                        <Card className="p-6 bg-slate-900 border-slate-800">
                            <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-purple-500" />
                                AI Study Assistant
                            </h2>

                            {!selectedDocument ? (
                                <div className="text-center py-16 text-slate-500">
                                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                                    <p>Select a document to start studying</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Document Info */}
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            {selectedDocument.type === 'pdf' ? (
                                                <FileText className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                            ) : (
                                                <Image className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-blue-300 truncate">
                                                    {selectedDocument.name}
                                                </h3>
                                                <p className="text-sm text-blue-400 mt-1">
                                                    {selectedDocument.extractedText
                                                        ? `${selectedDocument.extractedText.length} characters extracted`
                                                        : 'No text extracted'}
                                                </p>
                                                {selectedDocument.extractedText && selectedDocument.extractedText.length > 50 && (
                                                    <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Ready for AI processing
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Action Buttons */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => processDocument('summary')}
                                            disabled={isProcessing || !selectedDocument.extractedText}
                                            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                        >
                                            Summarize
                                        </button>
                                        <button
                                            onClick={() => processDocument('quiz')}
                                            disabled={isProcessing || !selectedDocument.extractedText}
                                            className="px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                        >
                                            Create Quiz
                                        </button>
                                        <button
                                            onClick={() => processDocument('explain')}
                                            disabled={isProcessing || !selectedDocument.extractedText}
                                            className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                        >
                                            Explain
                                        </button>
                                    </div>

                                    {/* AI Response */}
                                    {(isProcessing || aiResponse) && (
                                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 min-h-64">
                                            {isProcessing ? (
                                                <div className="flex flex-col items-center justify-center py-16">
                                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                                                    <span className="text-slate-400">Processing with AI...</span>
                                                </div>
                                            ) : (
                                                <div className="prose prose-invert max-w-none">
                                                    <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans">
                                                        {aiResponse}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
