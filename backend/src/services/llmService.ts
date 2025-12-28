import { GoogleGenerativeAI } from '@google/generative-ai';
import { MessageData } from './conversationService.js';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TOKENS = 500;
const MAX_HISTORY_MESSAGES = 10;

// Domain knowledge about the fictional e-commerce store
const DOMAIN_KNOWLEDGE = `
You are a helpful and friendly customer support agent for "SpurStore", a small e-commerce store. 
Here's important information about our store:

SHIPPING POLICY:
- We ship worldwide via standard shipping (5-7 business days) and express shipping (2-3 business days)
- Standard shipping: $5.99 (free for orders over $50)
- Express shipping: $12.99
- We ship to USA, Canada, UK, Australia, and most European countries
- Orders are processed within 1-2 business days

RETURN/REFUND POLICY:
- 30-day return policy for unused items in original packaging
- Full refunds are processed within 5-7 business days after we receive the item
- Customers are responsible for return shipping costs unless the item is defective
- Refunds are issued to the original payment method

SUPPORT HOURS:
- Monday to Friday: 9 AM - 6 PM EST
- Saturday: 10 AM - 4 PM EST
- Sunday: Closed
- Email support: support@spurstore.com
- Response time: Within 24 hours during business hours

PRODUCT INFORMATION:
- We offer a wide range of products including electronics, clothing, home goods, and accessories
- Most items are in stock and ready to ship
- We offer gift wrapping and gift messages for orders

IMPORTANT GUIDELINES:
- Answer customer questions clearly, concisely, and in a friendly tone using ONLY the information provided above.
- Format your responses using markdown for better readability:
  * Use bullet points (- or *) for lists
  * Use **bold** for important information
  * Use line breaks to separate different topics
  * Keep paragraphs short and easy to read
- If a customer asks about something NOT covered in the knowledge base above (e.g., specific product details, pricing for individual items, technical specifications, order status, account issues, payment problems, or questions unrelated to our store policies), politely acknowledge that you don't have that specific information.
- For out-of-scope questions, respond with: "I don't have that specific information in my knowledge base, but I'd be happy to connect you with our human support team who can help you with that. Please email us at support@spurstore.com or contact us during our support hours."
- Stay focused on shipping, returns, support hours, and general product information as outlined above.
- Never make up information or guess about details not provided in the knowledge base.
- Always maintain a helpful and professional tone, even when redirecting to human support.
- When listing multiple items or topics, use markdown bullet points for clarity.
`;

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateReply(
    userMessage: string,
    conversationHistory: MessageData[]
  ): Promise<string> {
    try {
      // Validate and truncate user message
      if (!userMessage || userMessage.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      if (userMessage.length > MAX_MESSAGE_LENGTH) {
        userMessage = userMessage.substring(0, MAX_MESSAGE_LENGTH) + '...';
      }

      // Build conversation history for context
      const recentHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);
      const historyText = recentHistory
        .map((msg) => {
          const role = msg.sender === 'user' ? 'Customer' : 'Support Agent';
          return `${role}: ${msg.text}`;
        })
        .join('\n');

      // Construct the prompt
      const prompt = `${DOMAIN_KNOWLEDGE}

Previous conversation:
${historyText || 'This is the start of the conversation.'}

Customer: ${userMessage}
Support Agent:`;

      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const reply = response.text().trim();

      if (!reply || reply.length === 0) {
        throw new Error('Empty response from LLM');
      }

      return reply;
    } catch (error: any) {
      // Handle specific Gemini API errors
      if (error.message?.includes('API_KEY')) {
        throw new Error('Invalid API key. Please check your GEMINI_API_KEY environment variable.');
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
        throw new Error('API rate limit exceeded. Please try again in a moment.');
      }
      
      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        throw new Error('Request timed out. Please try again.');
      }

      // Generic error handling
      console.error('LLM Service Error:', error);
      throw new Error(
        error.message || 'Failed to generate reply. Please try again later.'
      );
    }
  }
}

// Lazy initialization to prevent server crash if API key is missing
let llmServiceInstance: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmServiceInstance) {
    try {
      llmServiceInstance = new LLMService();
    } catch (error: any) {
      console.error('Failed to initialize LLM service:', error.message);
      throw error;
    }
  }
  return llmServiceInstance;
}

export const llmService = {
  generateReply: async (userMessage: string, conversationHistory: MessageData[]) => {
    return getLLMService().generateReply(userMessage, conversationHistory);
  }
};

