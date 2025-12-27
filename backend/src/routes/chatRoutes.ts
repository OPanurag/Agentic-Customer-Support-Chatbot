import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { conversationService } from '../services/conversationService.js';
import { llmService } from '../services/llmService.js';

const router = Router();

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
});

router.post('/message', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = messageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { message, sessionId } = validationResult.data;

    // Get or create conversation
    const conversation = conversationService.getOrCreateConversation(sessionId);

    // Save user message
    conversationService.addMessage(conversation.id, 'user', message);

    // Get conversation history for context
    const history = conversationService.getMessages(conversation.id);

    // Generate AI reply
    let aiReply: string;
    try {
      aiReply = await llmService.generateReply(message, history);
    } catch (error: any) {
      console.error('LLM Error:', error);
      // Return a friendly error message to the user
      aiReply = "I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment, or contact our support team at support@spurstore.com for immediate assistance.";
    }

    // Save AI reply
    conversationService.addMessage(conversation.id, 'ai', aiReply);

    // Return response
    res.json({
      reply: aiReply,
      sessionId: conversation.id,
    });
  } catch (error: any) {
    console.error('Chat route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

router.get('/history/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Validate sessionId format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      return res.status(400).json({
        error: 'Invalid session ID format',
      });
    }

    const conversation = conversationService.getConversation(sessionId);
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    const messages = conversationService.getMessages(sessionId);

    res.json({
      sessionId: conversation.id,
      createdAt: conversation.createdAt,
      messages,
    });
  } catch (error: any) {
    console.error('History route error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve conversation history.',
    });
  }
});

export default router;

