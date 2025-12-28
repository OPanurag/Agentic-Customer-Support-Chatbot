# Deployment Guide

This guide covers deploying the chatbot to free open-source hosting platforms.

## 🚀 Quick Deploy Options

### Option 1: Render.com (Recommended for Free Tier)

1. **Fork this repository** to your GitHub account

2. **Create a new Web Service on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Backend Deployment:**
   - **Name:** `chatbot-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Environment Variables:**
     ```
     NODE_ENV=production
     PORT=3001
     GEMINI_API_KEY=your_gemini_api_key_here
     DATABASE_PATH=./chatbot.db
     FRONTEND_URL=https://your-frontend-url.onrender.com
     API_KEY=generate_a_secure_random_string
     ```
   - **Health Check Path:** `/health`

4. **Frontend Deployment:**
   - Create another Web Service
   - **Name:** `chatbot-frontend`
   - **Environment:** `Node`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Start Command:** `cd frontend && npm start`
   - **Environment Variables:**
     ```
     NODE_ENV=production
     PORT=3000
     VITE_API_URL=https://your-backend-url.onrender.com
     ```
   - **Health Check Path:** `/health`

5. **Update URLs:**
   - After backend deploys, update `FRONTEND_URL` in backend env vars
   - Update `VITE_API_URL` in frontend env vars with backend URL

### Option 2: Railway.app

1. **Fork this repository** to your GitHub account

2. **Create a new project on Railway:**
   - Go to [Railway Dashboard](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Backend Service:**
   - Railway will auto-detect Node.js
   - Add environment variables (same as Render)
   - Set root directory to `/backend` in service settings
   - Railway will use the `railway.json` config

4. **Frontend Service:**
   - Add another service
   - Set root directory to `/frontend`
   - Add environment variables

### Option 3: Fly.io

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Backend:**
   ```bash
   cd backend
   fly launch
   # Follow prompts, set environment variables
   fly deploy
   ```

3. **Frontend:**
   ```bash
   cd frontend
   fly launch
   # Set VITE_API_URL to backend URL
   fly deploy
   ```

### Option 4: Vercel (Frontend) + Render (Backend)

**Frontend on Vercel:**
1. Import project from GitHub
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL`
4. Vercel will auto-detect SvelteKit

**Backend on Render:**
- Follow Render backend steps above

## 📋 Environment Variables Checklist

### Backend
- [ ] `GEMINI_API_KEY` - Your Google Gemini API key
- [ ] `FRONTEND_URL` - Your frontend domain (for CORS)
- [ ] `API_KEY` - Secure random string for data endpoints
- [ ] `PORT` - Usually auto-set by platform
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_PATH` - Path to SQLite file (or use PostgreSQL)

### Frontend
- [ ] `VITE_API_URL` - Your backend API URL
- [ ] `PORT` - Usually auto-set by platform
- [ ] `NODE_ENV=production`

## 🔧 Platform-Specific Notes

### Render.com
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Custom domains
- ⚠️ Services sleep after 15 min inactivity (free tier)
- ⚠️ SQLite may have issues with ephemeral storage

### Railway.app
- ✅ Free tier with $5 credit/month
- ✅ Automatic HTTPS
- ✅ Persistent volumes available
- ✅ Better for SQLite (persistent storage)

### Fly.io
- ✅ Generous free tier
- ✅ Global edge network
- ✅ Persistent volumes
- ⚠️ Requires CLI setup

### Vercel
- ✅ Excellent for frontend
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ Serverless functions (not ideal for backend with SQLite)

## 🗄️ Database Considerations

### SQLite (Current)
- ✅ Works for small deployments
- ✅ No additional setup needed
- ⚠️ Not ideal for concurrent writes
- ⚠️ File system dependencies

### PostgreSQL (Recommended for Production)
If you need better performance:

1. **Add PostgreSQL dependency:**
   ```bash
   cd backend
   npm install pg
   ```

2. **Update database.ts** to use PostgreSQL connection

3. **Use managed PostgreSQL:**
   - Render: Add PostgreSQL database
   - Railway: Add PostgreSQL service
   - Fly.io: Use Supabase or Neon

## 🔒 Security Checklist

- [x] CORS configured with environment variables
- [x] Rate limiting enabled
- [x] API key authentication for data endpoints
- [x] Input validation with Zod
- [x] SQL injection protection (parameterized queries)
- [ ] HTTPS enforced (automatic on most platforms)
- [ ] Environment variables secured (never commit)

## 🧪 Testing Deployment

1. **Check Health Endpoint:**
   ```bash
   curl https://your-backend-url.com/health
   ```

2. **Test Chat Endpoint:**
   ```bash
   curl -X POST https://your-backend-url.com/chat/message \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

3. **Test Data Endpoint (with API key):**
   ```bash
   curl https://your-backend-url.com/data/stats \
     -H "X-API-Key: your_api_key"
   ```

## 🐛 Troubleshooting

### Backend won't start
- Check all environment variables are set
- Verify `GEMINI_API_KEY` is valid
- Check build logs for TypeScript errors
- Ensure database path is writable

### Frontend can't connect to backend
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running and accessible

### Database errors
- On Render: SQLite may not persist (use PostgreSQL)
- On Railway: Use persistent volume
- Check file permissions

### Rate limiting issues
- Adjust rate limit settings in `backend/src/index.ts`
- Check if IP is being shared (common on free tiers)

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Fly.io Documentation](https://fly.io/docs)
- [Vercel Documentation](https://vercel.com/docs)

## 🎯 Recommended Setup for Demo

**Best combination for free tier:**
- **Backend:** Railway.app (better SQLite support)
- **Frontend:** Vercel (excellent SvelteKit support)

This gives you:
- ✅ Persistent database
- ✅ Fast frontend with CDN
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ No sleeping services

