// OpenRouter API client for AI interactions

export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenRouterRequest {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
}

export interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export class OpenRouterClient {
    private apiKey: string;
    private model: string;
    private baseURL = 'https://openrouter.ai/api/v1/chat/completions';

    constructor(apiKey?: string, model?: string) {
        this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
        this.model = model || process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

        if (!this.apiKey) {
            throw new Error('OpenRouter API key is required');
        }
    }

    /**
     * Send a chat completion request
     */
    async chat(
        messages: OpenRouterMessage[],
        options: {
            temperature?: number;
            max_tokens?: number;
            top_p?: number;
        } = {}
    ): Promise<string> {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://lifeos.app', // Optional: helps with analytics
                    'X-Title': 'LifeOS', // Optional: shows in OpenRouter dashboard
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    temperature: options.temperature ?? 0.7,
                    max_tokens: options.max_tokens ?? 1000,
                    top_p: options.top_p ?? 1,
                } as OpenRouterRequest),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
            }

            const data: OpenRouterResponse = await response.json();

            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from OpenRouter');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenRouter API error:', error);
            throw error;
        }
    }

    /**
     * Generate a summary from text
     */
    async summarize(text: string, maxLength: number = 200): Promise<string> {
        const messages: OpenRouterMessage[] = [
            {
                role: 'system',
                content: 'You are a helpful assistant that creates clear, concise summaries.',
            },
            {
                role: 'user',
                content: `Please summarize the following text in approximately ${maxLength} words:\n\n${text}`,
            },
        ];

        return this.chat(messages, { max_tokens: maxLength * 2 });
    }

    /**
     * Generate quiz questions from text
     */
    async generateQuiz(
        text: string,
        numQuestions: number = 5
    ): Promise<string> {
        const messages: OpenRouterMessage[] = [
            {
                role: 'system',
                content: 'You are an educational assistant that creates quiz questions. Format your response as a numbered list with questions and multiple choice answers (A, B, C, D). Include an answer key at the end.',
            },
            {
                role: 'user',
                content: `Create ${numQuestions} multiple choice quiz questions based on this text:\n\n${text}`,
            },
        ];

        return this.chat(messages, { max_tokens: 1500 });
    }

    /**
     * Answer questions about text
     */
    async answerQuestion(context: string, question: string): Promise<string> {
        const messages: OpenRouterMessage[] = [
            {
                role: 'system',
                content: 'You are a helpful assistant that answers questions based on provided context. Be accurate and cite the context when relevant.',
            },
            {
                role: 'user',
                content: `Context:\n${context}\n\nQuestion: ${question}`,
            },
        ];

        return this.chat(messages, { max_tokens: 800 });
    }

    /**
     * Explain a concept from text
     */
    async explain(text: string, concept?: string): Promise<string> {
        const messages: OpenRouterMessage[] = [
            {
                role: 'system',
                content: 'You are an educational tutor that explains concepts clearly and thoroughly.',
            },
            {
                role: 'user',
                content: concept
                    ? `Explain the concept of "${concept}" based on this text:\n\n${text}`
                    : `Explain the main concepts in this text:\n\n${text}`,
            },
        ];

        return this.chat(messages, { max_tokens: 1200 });
    }

    /**
     * General chat with context about user's LifeOS data
     */
    async chatWithContext(
        userMessage: string,
        context: {
            tasks?: string;
            notes?: string;
            habits?: string;
        }
    ): Promise<string> {
        const contextParts: string[] = [];

        if (context.tasks) {
            contextParts.push(`Tasks:\n${context.tasks}`);
        }
        if (context.notes) {
            contextParts.push(`Notes:\n${context.notes}`);
        }
        if (context.habits) {
            contextParts.push(`Habits:\n${context.habits}`);
        }

        const systemMessage = contextParts.length > 0
            ? `You are a personal assistant for LifeOS, helping users manage their tasks, notes, and habits. Here's the user's current data:\n\n${contextParts.join('\n\n')}`
            : 'You are a helpful personal assistant for LifeOS, helping users with productivity, task management, and organization.';

        const messages: OpenRouterMessage[] = [
            {
                role: 'system',
                content: systemMessage,
            },
            {
                role: 'user',
                content: userMessage,
            },
        ];

        return this.chat(messages);
    }
}

// Singleton instance (server-side only)
let openRouterClient: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
    if (!openRouterClient) {
        openRouterClient = new OpenRouterClient();
    }
    return openRouterClient;
}
