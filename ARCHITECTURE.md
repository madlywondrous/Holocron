# System Architecture

## Overview

Holocron is a small Gemini-only chat app with an npm-first workflow.

- **Frontend:** Next.js App Router, React, Tailwind CSS
- **State:** Zustand with persisted sessions and tabs
- **AI transport:** Vercel AI SDK `useChat`
- **Backend:** one Next.js route at `app/api/chat/route.ts`

## App Flow

1. The browser stores sessions, tabs, and message history locally.
2. The Google AI API key lives only in memory for the current browser session.
3. When the user sends a prompt, `useChat` posts the current messages plus the selected Gemini model to `/api/chat`.
4. The route reads `X-Google-API-Key`, calls Gemini through `@ai-sdk/google`, and streams a UI message response back.
5. The client syncs streamed messages back into Zustand so search, timeline, and tab history all stay aligned.

## Project Hygiene

- `package-lock.json` is the source-of-truth lockfile.
- Bun-specific scripts and lockfiles are removed.
- Legacy multi-provider codepaths and stale message formats are normalized on load.

## Main Modules

- `lib/store.ts`: session, tab, and layout state
- `lib/models.ts`: Gemini model catalog
- `lib/chat.ts`: shared chat message types and helpers
- `hooks/useChat.ts`: client chat transport and tab sync
- `app/api/chat/route.ts`: Gemini streaming endpoint
- `components/chat/*`: layout, composer, message list, search, settings, and timeline UI

## Design Principles

- Keep the backend thin.
- Keep the provider surface to one clear path.
- Keep local features powered by one message shape.
- Keep the UI polished without carrying dead abstractions.
