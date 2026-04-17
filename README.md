# Holocron

Holocron is a lightweight, production-grade chat client built with Next.js 15, the Vercel AI SDK, and a local-first session store. It follows a **Bring Your Own Key (BYOK)** architecture, keeping your API keys securely in your browser's memory and sending them directly to the server route when you chat.

## Quick Start

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the dev server
   ```bash
   npm run dev
   ```
3. Open `http://localhost:xxxx` (or whichever port Next.js uses)
4. Click the **Settings** icon in the top right to add your Google AI or OpenRouter API key.

## Current Shape

- Dual-provider model catalog (Google AI + OpenRouter)
- Single `/api/chat` streaming route that multiplexes requests based on the selected model
- Session + tab store normalized around one message shape
- API keys are kept in memory only for the current browser session

