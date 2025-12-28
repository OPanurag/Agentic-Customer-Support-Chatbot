<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';
	import { sendMessage, getConversationHistory, type Message } from '../api';

	let messages: Message[] = [];
	let inputValue = '';
	let isLoading = false;
	let sessionId: string | null = null;
	let isTyping = false;
	let error: string | null = null;

	onMount(() => {
		// Try to restore session from localStorage
		const savedSessionId = localStorage.getItem('chatSessionId');
		if (savedSessionId) {
			loadHistory(savedSessionId);
		}
	});

	async function loadHistory(sessionIdToLoad: string) {
		try {
			const history = await getConversationHistory(sessionIdToLoad);
			if (history && history.messages) {
				messages = history.messages;
				sessionId = history.sessionId;
				localStorage.setItem('chatSessionId', sessionId);
				scrollToBottom();
			} else {
				// If no messages, keep the session but clear messages
				sessionId = sessionIdToLoad;
				messages = [];
			}
		} catch (err) {
			console.error('Failed to load history:', err);
			// If history fails (e.g., session doesn't exist), start a new session
			sessionId = null;
			localStorage.removeItem('chatSessionId');
			messages = [];
		}
	}

	async function handleSend() {
		const message = inputValue.trim();
		if (!message || isLoading) return;

		// Clear error
		error = null;

		// Add user message to UI immediately for optimistic update
		const userMessage: Message = {
			id: `temp-${Date.now()}`,
			conversationId: sessionId || '',
			sender: 'user',
			text: message,
			timestamp: new Date().toISOString(),
		};
		messages = [...messages, userMessage];
		inputValue = '';
		isLoading = true;
		isTyping = true;

		// Scroll to bottom
		scrollToBottom();

		try {
			const response = await sendMessage(message, sessionId || undefined);
			
			// Update session ID
			sessionId = response.sessionId;
			localStorage.setItem('chatSessionId', sessionId);

			// Reload full conversation history from backend to ensure we have all messages
			// This ensures proper sync and shows complete history
			await loadHistory(sessionId);
			
		} catch (err: any) {
			error = err.message || 'Failed to send message. Please try again.';
			// Remove the temp user message on error
			messages = messages.filter(m => m.id !== userMessage.id);
		} finally {
			isLoading = false;
			isTyping = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function scrollToBottom() {
		setTimeout(() => {
			const messagesContainer = document.getElementById('messages-container');
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}, 100);
	}

	function clearChat() {
		if (confirm('Are you sure you want to start a new conversation?')) {
			messages = [];
			sessionId = null;
			localStorage.removeItem('chatSessionId');
			error = null;
		}
	}

	// Format message text - convert markdown to HTML for AI messages
	function formatMessage(text: string, sender: 'user' | 'ai'): string {
		if (sender === 'ai') {
			// Configure marked for safe rendering
			marked.setOptions({
				breaks: true, // Convert line breaks to <br>
				gfm: true, // GitHub Flavored Markdown
			});
			return marked.parse(text) as string;
		}
		// User messages stay as plain text (escape HTML)
		return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

<div class="chat-widget">
	<div class="chat-header">
		<h2>Chat with Support</h2>
		<button class="clear-btn" on:click={clearChat} title="Start new conversation">
			New Chat
		</button>
	</div>

	<div id="messages-container" class="messages-container">
		{#if messages.length === 0}
			<div class="welcome-message">
				<p>👋 Hi! I'm your AI support agent. How can I help you today?</p>
				<div class="suggestions">
					<button
						class="suggestion-btn"
						on:click={() => {
							inputValue = "What's your return policy?";
							handleSend();
						}}
					>
						What's your return policy?
					</button>
					<button
						class="suggestion-btn"
						on:click={() => {
							inputValue = "Do you ship to USA?";
							handleSend();
						}}
					>
						Do you ship to USA?
					</button>
					<button
						class="suggestion-btn"
						on:click={() => {
							inputValue = "What are your support hours?";
							handleSend();
						}}
					>
						What are your support hours?
					</button>
				</div>
			</div>
		{/if}

		{#each messages as message (message.id)}
			<div class="message message-{message.sender}">
				<div class="message-content">
					<div class="message-text">
						{#if message.sender === 'ai'}
							{@html formatMessage(message.text, message.sender)}
						{:else}
							{message.text}
						{/if}
					</div>
					<div class="message-time">
						{new Date(message.timestamp).toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</div>
				</div>
			</div>
		{/each}

		{#if isTyping}
			<div class="message message-ai">
				<div class="message-content">
					<div class="typing-indicator">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error-message">
			⚠️ {error}
		</div>
	{/if}

	<div class="input-container">
		<textarea
			bind:value={inputValue}
			on:keydown={handleKeyPress}
			placeholder="Type your message..."
			disabled={isLoading}
			rows="1"
			maxlength="2000"
		></textarea>
		<button
			class="send-btn"
			on:click={handleSend}
			disabled={isLoading || !inputValue.trim()}
			title="Send message"
		>
			{isLoading ? '⏳' : '➤'}
		</button>
	</div>
</div>

<style>
	.chat-widget {
		display: flex;
		flex-direction: column;
		height: 600px;
		max-width: 800px;
		margin: 0 auto;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		background: white;
		overflow: hidden;
	}

	.chat-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}

	.chat-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.clear-btn {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background 0.2s;
	}

	.clear-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.messages-container {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: #f9fafb;
	}

	.welcome-message {
		text-align: center;
		padding: 2rem 1rem;
		color: #666;
	}

	.welcome-message p {
		font-size: 1.1rem;
		margin-bottom: 1.5rem;
	}

	.suggestions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.suggestion-btn {
		background: white;
		border: 1px solid #e0e0e0;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;
		font-size: 0.95rem;
		color: #333;
	}

	.suggestion-btn:hover {
		background: #f0f0f0;
		border-color: #667eea;
		transform: translateX(4px);
	}

	.message {
		display: flex;
		margin-bottom: 0.5rem;
	}

	.message-user {
		justify-content: flex-end;
	}

	.message-ai {
		justify-content: flex-start;
	}

	.message-content {
		max-width: 70%;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		word-wrap: break-word;
	}

	.message-user .message-content {
		background: #667eea;
		color: white;
		border-bottom-right-radius: 4px;
	}

	.message-ai .message-content {
		background: white;
		color: #333;
		border: 1px solid #e0e0e0;
		border-bottom-left-radius: 4px;
	}

	.message-text {
		margin-bottom: 0.25rem;
		line-height: 1.6;
	}

	/* Markdown styling for AI messages */
	.message-ai .message-text {
		color: #333;
	}

	.message-ai .message-text :global(p) {
		margin: 0.5rem 0;
	}

	.message-ai .message-text :global(p:first-child) {
		margin-top: 0;
	}

	.message-ai .message-text :global(p:last-child) {
		margin-bottom: 0;
	}

	.message-ai .message-text :global(ul),
	.message-ai .message-text :global(ol) {
		margin: 0.75rem 0;
		padding-left: 1.5rem;
	}

	.message-ai .message-text :global(li) {
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	.message-ai .message-text :global(strong) {
		font-weight: 600;
		color: #1a1a1a;
	}

	.message-ai .message-text :global(em) {
		font-style: italic;
	}

	.message-ai .message-text :global(code) {
		background: #f4f4f4;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-size: 0.9em;
		font-family: 'Courier New', monospace;
	}

	.message-ai .message-text :global(hr) {
		border: none;
		border-top: 1px solid #e0e0e0;
		margin: 1rem 0;
	}

	.message-time {
		font-size: 0.75rem;
		opacity: 0.7;
		margin-top: 0.25rem;
	}

	.typing-indicator {
		display: flex;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.typing-indicator span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #999;
		animation: typing 1.4s infinite;
	}

	.typing-indicator span:nth-child(2) {
		animation-delay: 0.2s;
	}

	.typing-indicator span:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes typing {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.7;
		}
		30% {
			transform: translateY(-10px);
			opacity: 1;
		}
	}

	.error-message {
		padding: 0.75rem 1rem;
		background: #fee;
		color: #c33;
		border-top: 1px solid #fcc;
		font-size: 0.875rem;
	}

	.input-container {
		display: flex;
		gap: 0.5rem;
		padding: 1rem 1.5rem;
		background: white;
		border-top: 1px solid #e0e0e0;
		align-items: flex-end;
	}

	.input-container textarea {
		flex: 1;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 0.75rem;
		font-size: 1rem;
		font-family: inherit;
		resize: none;
		min-height: 44px;
		max-height: 120px;
	}

	.input-container textarea:focus {
		outline: none;
		border-color: #667eea;
	}

	.input-container textarea:disabled {
		background: #f5f5f5;
		cursor: not-allowed;
	}

	.send-btn {
		background: #667eea;
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		cursor: pointer;
		font-size: 1.25rem;
		transition: background 0.2s;
		min-width: 50px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.send-btn:hover:not(:disabled) {
		background: #5568d3;
	}

	.send-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Scrollbar styling */
	.messages-container::-webkit-scrollbar {
		width: 8px;
	}

	.messages-container::-webkit-scrollbar-track {
		background: #f1f1f1;
	}

	.messages-container::-webkit-scrollbar-thumb {
		background: #888;
		border-radius: 4px;
	}

	.messages-container::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>

