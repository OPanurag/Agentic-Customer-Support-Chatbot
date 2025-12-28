import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:10000';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		
		const response = await fetch(`${BACKEND_URL}/chat/message`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Unknown error' }));
			return json(
				{ error: error.message || error.error || 'Failed to send message' },
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

