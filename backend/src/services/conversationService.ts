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

  getAllConversations(limit?: number, offset?: number): ConversationData[] {
    let query = 'SELECT * FROM conversations ORDER BY updatedAt DESC';
    const params: any[] = [];
    
    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }
    
    return dbInstance.prepare(query).all(...params) as ConversationData[];
  }

  getConversationWithMessages(conversationId: string): (ConversationData & { messages: MessageData[] }) | null {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }
    
    const messages = this.getMessages(conversationId);
    return { ...conversation, messages };
  }

  getAllMessages(limit?: number, offset?: number, conversationId?: string): MessageData[] {
    let query = 'SELECT * FROM messages';
    const params: any[] = [];
    
    if (conversationId) {
      query += ' WHERE conversationId = ?';
      params.push(conversationId);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);
      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }
    
    return dbInstance.prepare(query).all(...params) as MessageData[];
  }

  getStats(): {
    totalConversations: number;
    totalMessages: number;
    userMessages: number;
    aiMessages: number;
    averageMessagesPerConversation: number;
  } {
    const totalConversations = dbInstance
      .prepare('SELECT COUNT(*) as count FROM conversations')
      .get() as { count: number };
    
    const totalMessages = dbInstance
      .prepare('SELECT COUNT(*) as count FROM messages')
      .get() as { count: number };
    
    const userMessages = dbInstance
      .prepare("SELECT COUNT(*) as count FROM messages WHERE sender = 'user'")
      .get() as { count: number };
    
    const aiMessages = dbInstance
      .prepare("SELECT COUNT(*) as count FROM messages WHERE sender = 'ai'")
      .get() as { count: number };
    
    const avgMessages = totalConversations.count > 0
      ? totalMessages.count / totalConversations.count
      : 0;
    
    return {
      totalConversations: totalConversations.count,
      totalMessages: totalMessages.count,
      userMessages: userMessages.count,
      aiMessages: aiMessages.count,
      averageMessagesPerConversation: Math.round(avgMessages * 100) / 100,
    };
  }

  getConversationCount(): number {
    const result = dbInstance
      .prepare('SELECT COUNT(*) as count FROM conversations')
      .get() as { count: number };
    return result.count;
  }
}

export const conversationService = new ConversationService();

