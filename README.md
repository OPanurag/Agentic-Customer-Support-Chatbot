# AI Customer Support Chatbot

A full-stack AI-powered customer support chatbot built for live chat interactions. This application simulates a customer support experience where an AI agent answers user questions using Google's Gemini API.

## 🚀 Features

- **Real-time Chat Interface**: Clean, modern chat UI with user and AI message distinction
- **Conversation Persistence**: All conversations are saved to a SQLite database
- **Session Management**: Conversations persist across page reloads
- **LLM Integration**: Powered by Google Gemini API for intelligent responses
- **Domain Knowledge**: Pre-configured with FAQ knowledge about shipping, returns, and support policies
- **Error Handling**: Robust error handling for API failures, timeouts, and invalid inputs
- **Input Validation**: Prevents empty messages and handles long messages gracefully
- **Typing Indicators**: Visual feedback when the AI is generating a response

## 🛠️ Tech Stack

### Backend
- **Node.js** + **TypeScript**
- **Express.js** for REST API
- **SQLite** (better-sqlite3) for database
- **Google Gemini API** for LLM integration
- **Zod** for input validation

### Frontend
- **SvelteKit** with TypeScript
- **Vite** for build tooling
- Modern CSS with responsive design

## 📋 Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## 🚦 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Agentic-Customer-Support-Chatbot
```

### 2. Install Dependencies

Install all dependencies for root, backend, and frontend:

```bash
npm run install:all
```

Or install them separately:

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```env
PORT=3001
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_PATH=./chatbot.db
NODE_ENV=development
```

**Important**: Replace `your_gemini_api_key_here` with your actual Gemini API key.

### 4. Initialize the Database

Run the database migration to create the necessary tables:

```bash
cd backend
npm run migrate
```

This will create a `chatbot.db` file in the backend directory with the required schema.

### 5. Run the Application

**Recommended: Use the master runner script (handles everything automatically):**

```bash
npm start
```

This will automatically check dependencies, set up the environment, initialize the database, and start both servers.

**Alternative: Manual start**

You can run both backend and frontend together:

```bash
# From the root directory
npm run dev
```

Or run them separately in different terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The backend will run on `http://localhost:3001` and the frontend on `http://localhost:5173`.

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📁 Project Structure

```
Agentic-Customer-Support-Chatbot/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts          # Database setup and schema
│   │   │   └── migrate.ts           # Database migration script
│   │   ├── services/
│   │   │   ├── conversationService.ts  # Conversation & message management
│   │   │   └── llmService.ts          # Gemini API integration
│   │   ├── routes/
│   │   │   ├── chatRoutes.ts         # Chat API endpoints
│   │   │   └── dataRoutes.ts         # Data viewing endpoints
│   │   └── index.ts                  # Express server setup
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                          # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts                # API client functions
│   │   │   └── components/
│   │   │       └── ChatWidget.svelte # Main chat component
│   │   ├── routes/
│   │   │   ├── +page.svelte          # Main page
│   │   │   └── +layout.svelte        # Layout wrapper
│   │   └── app.html                  # HTML template
│   ├── package.json
│   └── vite.config.ts
├── package.json
└── README.md
```

## 🏗️ Architecture Overview

### Backend Architecture

The backend follows a layered architecture:

1. **Routes Layer** (`routes/chatRoutes.ts`):
   - Handles HTTP requests and responses
   - Input validation using Zod
   - Error handling and status codes

2. **Service Layer**:
   - **ConversationService**: Manages conversations and messages in the database
   - **LLMService**: Handles Gemini API integration, prompt construction, and error handling

3. **Data Layer** (`db/database.ts`):
   - Database initialization and schema definition
   - SQLite database with foreign key constraints

### Key Design Decisions

1. **SQLite over PostgreSQL**: Chosen for simplicity and ease of setup. The schema is designed to be easily portable to PostgreSQL if needed.

2. **Session-based Conversations**: Each conversation has a unique UUID that persists in localStorage, allowing users to resume conversations after page reload.

3. **Conversation History Context**: The LLM receives the last 10 messages as context to maintain conversation continuity while managing token costs.

4. **Error Resilience**: All LLM API errors are caught and converted to user-friendly messages. The app never crashes on API failures.

5. **Input Validation**: Multiple layers of validation:
   - Frontend: Prevents empty messages and disables send button
   - Backend: Zod schema validation with length limits
   - LLM Service: Additional validation and truncation

### Frontend Architecture

- **Component-based**: Main chat logic in `ChatWidget.svelte`
- **API Abstraction**: All API calls abstracted in `lib/api.ts`
- **State Management**: Local component state with Svelte reactivity
- **Session Persistence**: Uses localStorage to maintain session across reloads

## 🤖 LLM Integration

### Provider
- **Google Gemini API** (gemini-pro model)

### Prompting Strategy

The system prompt includes:
1. **Domain Knowledge**: Hardcoded FAQ information about:
   - Shipping policies and rates
   - Return/refund policies
   - Support hours and contact information
   - Product information

2. **Conversation History**: Last 10 messages are included for context

3. **Persona**: The AI is instructed to be helpful, friendly, and concise

### Configuration

- **Max Tokens**: 500 (configurable in `llmService.ts`)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Message Length**: 2000 characters (truncated if longer)
- **Max History Messages**: 10 (for context window management)

### Error Handling

The LLM service handles:
- Invalid API keys
- Rate limiting
- Timeouts
- Empty responses
- Network errors

All errors are caught and converted to user-friendly messages.

## 📊 Database Schema

### Conversations Table
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```

### Messages Table
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
  text TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
)
```

## 🔌 API Endpoints

### Chat Endpoints

#### POST `/chat/message`
Send a message to the AI agent.

**Request:**
```json
{
  "message": "What's your return policy?",
  "sessionId": "optional-uuid"
}
```

**Response:**
```json
{
  "reply": "We have a 30-day return policy...",
  "sessionId": "uuid-here"
}
```

#### GET `/chat/history/:sessionId`
Retrieve conversation history for a specific session.

**Response:**
```json
{
  "sessionId": "uuid-here",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "messages": [
    {
      "id": "msg-id",
      "conversationId": "uuid-here",
      "sender": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Data Endpoints

#### GET `/data/conversations`
List all conversations with optional pagination.

**Query Parameters:**
- `limit` (optional, 1-100): Number of results to return
- `offset` (optional): Number of results to skip

**Example:**
```bash
GET /data/conversations?limit=10&offset=0
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid-here",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET `/data/conversations/:id`
Get a specific conversation with all its messages.

**Response:**
```json
{
  "id": "uuid-here",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "messages": [
    {
      "id": "msg-id",
      "conversationId": "uuid-here",
      "sender": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET `/data/messages`
List all messages with optional filters and pagination.

**Query Parameters:**
- `limit` (optional, 1-100): Number of results to return
- `offset` (optional): Number of results to skip
- `conversationId` (optional): Filter messages by conversation ID

**Example:**
```bash
GET /data/messages?limit=20&conversationId=uuid-here
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-id",
      "conversationId": "uuid-here",
      "sender": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0
  },
  "filters": {
    "conversationId": "uuid-here"
  }
}
```

#### GET `/data/stats`
Get database statistics and analytics.

**Response:**
```json
{
  "totalConversations": 10,
  "totalMessages": 50,
  "userMessages": 25,
  "aiMessages": 25,
  "averageMessagesPerConversation": 5.0,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### System Endpoints

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing the Application

1. **Start the application** (see Getting Started section)

2. **Try sample questions**:
   - "What's your return policy?"
   - "Do you ship to USA?"
   - "What are your support hours?"
   - "How much is shipping?"

3. **Test error handling**:
   - Try sending an empty message (should be prevented)
   - Try sending a very long message (should be truncated)
   - Reload the page (conversation should persist)

4. **Test session management**:
   - Start a conversation
   - Reload the page
   - Verify the conversation history is restored

## 🚢 Deployment

### Backend Deployment

The backend can be deployed to services like:
- **Render**: Add build command `npm run build` and start command `npm start`
- **Railway**: Similar setup
- **Heroku**: Add a `Procfile` with `web: npm start`

Make sure to:
1. Set environment variables (especially `GEMINI_API_KEY`)
2. Use a production database (PostgreSQL recommended for production)
3. Update `DATABASE_PATH` or use a database URL

### Frontend Deployment

The frontend can be deployed to:
- **Vercel**: Automatic SvelteKit support
- **Netlify**: Automatic SvelteKit support
- **Cloudflare Pages**: Automatic SvelteKit support

Make sure to:
1. Set `VITE_API_URL` environment variable to your backend URL
2. Update CORS settings in backend to allow your frontend domain

## 🔒 Security Considerations

- API keys are stored in environment variables (never committed)
- Input validation on both frontend and backend
- SQL injection protection via parameterized queries
- CORS configured for API endpoints
- Message length limits to prevent abuse

## 🐛 Troubleshooting

### Backend won't start
- Check that `GEMINI_API_KEY` is set in `.env`
- Ensure port 3001 is not in use
- Run `npm run migrate` to initialize database

### Frontend can't connect to backend
- Verify backend is running on port 3001
- Check CORS settings in backend
- Verify `VITE_API_URL` in frontend (if set)

### LLM errors
- Verify your Gemini API key is valid
- Check API quota/rate limits
- Review error messages in backend console

### Database errors
- Ensure write permissions in backend directory
- Delete `chatbot.db` and run `npm run migrate` again

## 📝 Trade-offs & Future Improvements

### Current Trade-offs

1. **SQLite vs PostgreSQL**: SQLite chosen for simplicity, but PostgreSQL would be better for production with concurrent users.

2. **Hardcoded Domain Knowledge**: FAQ knowledge is in the prompt. A better approach would be:
   - Vector database for semantic search
   - RAG (Retrieval Augmented Generation) for dynamic knowledge retrieval

3. **No Authentication**: Sessions are managed via localStorage. For production, add:
   - User authentication
   - Session management on backend
   - Rate limiting per user

4. **Simple Error Handling**: Basic error messages. Could add:
   - Retry logic with exponential backoff
   - Error logging service (Sentry, etc.)
   - More granular error types

### If I Had More Time...

1. **Enhanced LLM Integration**:
   - Streaming responses for better UX
   - Token usage tracking and cost monitoring
   - Multiple model support (fallback options)

2. **Better Knowledge Management**:
   - Vector embeddings for FAQ
   - Dynamic knowledge base updates
   - Multi-source knowledge integration

3. **Advanced Features**:
   - File upload support (for order screenshots, etc.)
   - Multi-language support
   - Sentiment analysis
   - Conversation analytics dashboard

4. **Production Readiness**:
   - Comprehensive test suite
   - CI/CD pipeline
   - Monitoring and alerting
   - Rate limiting middleware
   - Request logging

5. **UX Improvements**:
   - Markdown rendering in messages
   - Image support
   - Typing indicators with better animations
   - Message reactions/feedback
   - Export conversation history

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

Built as a take-home assignment for Spur.

---

**Note**: This is a demonstration project. For production use, consider additional security measures, authentication, rate limiting, and monitoring.
