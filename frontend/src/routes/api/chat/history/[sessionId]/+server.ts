import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:10000';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { sessionId } = params;
		
		const response = await fetch(`${BACKEND_URL}/chat/history/${sessionId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Unknown error' }));
			return json(
				{ error: error.message || error.error || 'Failed to load history' },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error: any) {
		console.error('Proxy error:', error);
		return json(
			{ error: error.message || 'Internal server error' },
			{ status: 500 }
		);
	}
};

