# Holocron

Holocron is a lightweight Gemini-only chat app built with Next.js 15, the Vercel AI SDK, and a local-first session store.

## Quick Start

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the dev server
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`
4. Add your Google AI API key from **Settings**

## Current Shape

- Gemini-only model catalog
- Single `/api/chat` streaming route
- Single npm workflow with `package-lock.json`
- Session + tab store normalized around one message shape
- API key is kept in memory only for the current browser session

See `ARCHITECTURE.md` for the current app shape.
