# Quick Start Guide

## One-Command Setup & Run

Simply run:

```bash
npm start
```

Or directly:

```bash
node start.js
```

## What the Script Does

The master runner script (`start.js`) automatically:

1. ✅ **Checks Node.js version** (requires 18+)
2. ✅ **Checks npm installation**
3. ✅ **Installs missing dependencies** (root, backend, frontend)
4. ✅ **Creates .env file** if it doesn't exist
5. ✅ **Initializes database** if it doesn't exist
6. ✅ **Starts backend server** (port 3001)
7. ✅ **Starts frontend server** (port 5173)

## First Time Setup

1. **Get your Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey)

2. **Run the script:**
   ```bash
   npm start
   ```

3. **Edit the .env file** (if prompted):
   - Open `backend/.env`
   - Replace `your_gemini_api_key_here` with your actual API key

4. **Restart the script** if you updated the API key

## Access the Application

Once the script is running, open your browser:

```
http://localhost:5173
```

## Stop the Application

Press `Ctrl+C` in the terminal to stop both servers.

## Manual Setup (Alternative)

If you prefer to set up manually, see the main [README.md](README.md) for detailed instructions.

