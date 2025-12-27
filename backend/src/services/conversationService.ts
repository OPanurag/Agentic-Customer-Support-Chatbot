import { dbInstance } from '../db/database.js';
import { randomUUID } from 'crypto';

export interface ConversationData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageData {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export class ConversationService {
  createConversation(): ConversationData {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    dbInstance
      .prepare('INSERT INTO conversations (id, createdAt, updatedAt) VALUES (?, ?, ?)')
      .run(id, now, now);
    
    return { id, createdAt: now, updatedAt: now };
  }

  getConversation(conversationId: string): ConversationData | null {
    const row = dbInstance
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(conversationId) as ConversationData | undefined;
    
    return row || null;
  }

  getOrCreateConversation(conversationId?: string): ConversationData {
    if (conversationId) {
      const existing = this.getConversation(conversationId);
      if (existing) {
        return existing;
      }
    }
    return this.createConversation();
  }

  addMessage(conversationId: string, sender: 'user' | 'ai', text: string): MessageData {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    
    dbInstance
      .prepare('INSERT INTO messages (id, conversationId, sender, text, timestamp) VALUES (?, ?, ?, ?, ?)')
      .run(id, conversationId, sender, text, timestamp);
    
    // Update conversation's updatedAt
    dbInstance
      .prepare('UPDATE conversations SET updatedAt = ? WHERE id = ?')
      .run(timestamp, conversationId);
    
    return { id, conversationId, sender, text, timestamp };
  }

  getMessages(conversationId: string): MessageData[] {
    return dbInstance
      .prepare('SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC')
      .all(conversationId) as MessageData[];
  }
}

export const conversationService = new ConversationService();

