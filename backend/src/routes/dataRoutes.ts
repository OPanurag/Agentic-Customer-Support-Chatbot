import { Router, Request, Response } from 'express';
import { conversationService } from '../services/conversationService.js';

const router = Router();

// GET /data/conversations - List all conversations with pagination
router.get('/conversations', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    // Validate pagination parameters
    if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
      return res.status(400).json({
        error: 'Invalid limit parameter. Must be between 1 and 100.',
      });
    }

    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      return res.status(400).json({
        error: 'Invalid offset parameter. Must be >= 0.',
      });
    }

    const conversations = conversationService.getAllConversations(limit, offset);
    const total = conversationService.getConversationCount();

    res.json({
      conversations,
      pagination: {
        total,
        limit: limit || total,
        offset: offset || 0,
        hasMore: limit !== undefined && offset !== undefined 
          ? (offset + limit) < total 
          : false,
      },
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve conversations.',
    });
  }
});

// GET /data/conversations/:id - Get a specific conversation with all messages
router.get('/conversations/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate sessionId format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        error: 'Invalid conversation ID format',
      });
    }

    const conversation = conversationService.getConversationWithMessages(id);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    res.json(conversation);
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve conversation.',
    });
  }
});

// GET /data/messages - List all messages with optional filters
router.get('/messages', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
    const conversationId = req.query.conversationId as string | undefined;

    // Validate pagination parameters
    if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 100)) {
      return res.status(400).json({
        error: 'Invalid limit parameter. Must be between 1 and 100.',
      });
    }

    if (offset !== undefined && (isNaN(offset) || offset < 0)) {
      return res.status(400).json({
        error: 'Invalid offset parameter. Must be >= 0.',
      });
    }

    // Validate conversationId format if provided
    if (conversationId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
      return res.status(400).json({
        error: 'Invalid conversation ID format',
      });
    }

    const messages = conversationService.getAllMessages(limit, offset, conversationId);

    res.json({
      messages,
      pagination: {
        limit: limit || messages.length,
        offset: offset || 0,
      },
      filters: {
        conversationId: conversationId || null,
      },
    });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve messages.',
    });
  }
});

// GET /data/stats - Get database statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = conversationService.getStats();
    res.json({
      ...stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve statistics.',
    });
  }
});

export default router;

