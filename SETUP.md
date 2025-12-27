# Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- npm installed
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Setup Steps

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Initialize database:**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start the application:**
   ```bash
   # From root directory
   npm run dev
   ```
   
   Or run separately:
   - Backend: `cd backend && npm run dev` (runs on port 3001)
   - Frontend: `cd frontend && npm run dev` (runs on port 5173)

5. **Open in browser:**
   Navigate to `http://localhost:5173`

## Troubleshooting

- **"GEMINI_API_KEY not set"**: Make sure you created `.env` file in the `backend` directory
- **Port already in use**: Change `PORT` in `backend/.env` or kill the process using the port
- **Database errors**: Delete `backend/chatbot.db` and run `npm run migrate` again

