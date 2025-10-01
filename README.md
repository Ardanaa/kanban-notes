# Kanban Notes

A Kanban-style project notes application built with Next.js 15, Supabase, Clerk, shadcn/ui, dnd-kit, and the Vercel AI SDK. Manage boards, columns, and cards with full CRUD support, drag-and-drop interactions, and an AI assistant that helps generate and summarize card content.

## Features

- Clerk authentication with protected dashboard and board routes
- Boards, columns, and cards persisted in Supabase with RLS tied to Clerk users
- Drag-and-drop column and card reordering powered by dnd-kit
- AI assistant (OpenAI via Vercel AI SDK) for generating descriptions, summaries, and task suggestions
- Responsive shadcn/ui interface with dark mode
- Deterministic UUID bridge between Clerk IDs and Supabase records

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Clerk
- **UI:** Tailwind CSS v4 & shadcn/ui
- **Drag & Drop:** @dnd-kit/core & @dnd-kit/sortable
- **AI:** Vercel AI SDK with OpenAI models

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the values for Clerk, Supabase, and optionally `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`.

3. **Apply the Supabase schema**
   - Run the SQL in `supabase/migrations/001_example_tables_with_rls.sql` on your project.
   - The migration sets up `profiles`, `boards`, `columns`, and `cards` with RLS policies mapped to Clerk users via deterministic UUIDs.

4. **Start the app**
If you cannot configure the Clerk Supabase template immediately, supply `SUPABASE_SERVICE_ROLE_KEY` locally so dashboard data can load.
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to view the marketing page, then sign in to reach the dashboard.

## Supabase + Clerk Notes

- `profiles.id` is derived from the Clerk user ID using a UUID v5 helper to preserve referential integrity while keeping RLS policies simple.
- RLS policies ensure only the board owner can read/write the associated columns and cards.
- Server actions under `src/server/board-service.ts` encapsulate all Supabase access and revalidation logic.
 - The server can fall back to `SUPABASE_SERVICE_ROLE_KEY` when Clerk-issued Supabase tokens are unavailable; keep this key server-side only.
 - Local development requires setting `SUPABASE_SERVICE_ROLE_KEY` unless you have configured the Clerk "supabase" JWT template.

## AI Assistant

The card dialog includes an “Asisten AI” panel that calls `/api/ai` (Vercel AI SDK with OpenAI). Buttons allow you to:
- **Buat deskripsi** – generate a description from the card title.
- **Ringkas konten** – summarize the current description (requires existing content).
- **Saran tugas** – propose actionable subtasks appended to the description.

Provide `OPENAI_API_KEY` to enable these features; otherwise a friendly error is shown.

## Project Structure

```
src/
  app/
    (authenticated)/
      layout.tsx              # Shared layout for dashboard & boards
      dashboard/page.tsx      # Board list + create/update/delete
      boards/
        page.tsx              # Boards index alias
        [boardId]/
          page.tsx            # Kanban board view
          actions.ts          # Server actions for columns/cards
          not-found.tsx
    api/ai/route.ts           # Vercel AI SDK endpoint
    layout.tsx                # Root providers (Clerk, theme, toaster)
    page.tsx                  # Marketing/landing page
  components/
    dashboard/...            # Dashboard dialogs & grid
    kanban/...               # Kanban board, columns, cards, AI UI
    ui/...                   # shadcn/ui primitives
  lib/
    clerk-uuid.ts            # Clerk → UUID helper
    database.types.ts        # Supabase row types
    supabase.ts              # Supabase client factory
    env-check.ts             # Landing page environment status
  server/board-service.ts     # Supabase data operations & revalidation
supabase/migrations/...       # Database schema + RLS
```

## Scripts

- `npm run dev` – start the development server
- `npm run build` – compile for production
- `npm run start` – run the production build
- `npm run lint` – lint the project

## License

This project is licensed under the MIT License.
