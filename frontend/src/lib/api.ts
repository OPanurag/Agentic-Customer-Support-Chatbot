// Use relative URL for API calls - SvelteKit will proxy to backend
// In production, this avoids CORS issues since both are on the same origin
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface Message {
	id: string;
	conversationId: string;
	sender: 'user' | 'ai';
	text: string;
	timestamp: string;
}

export interface ChatResponse {
	reply: string;
	sessionId: string;
}

export interface ConversationHistory {
	sessionId: string;
	createdAt: string;
	messages: Message[];
}

export async function sendMessage(
	message: string,
	sessionId?: string
): Promise<ChatResponse> {
	const response = await fetch(`${API_BASE_URL}/chat/message`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ message, sessionId }),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.message || error.error || 'Failed to send message');
	}

	return response.json();
}

export async function getConversationHistory(
	sessionId: string
): Promise<ConversationHistory> {
	const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.message || error.error || 'Failed to load history');
	}

	return response.json();
}

