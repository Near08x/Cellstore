# Copilot / AI agent instructions for this repository

Keep these instructions concise and specific to the repository so an AI assistant can be productive immediately.

## Quick context
- Framework: Next.js (App Router) with TypeScript. Source lives under `src/app` (routes, server /api handlers) and UI components under `src/components`.
- Data: Supabase is used as primary DB (`src/lib/supabaseClient.ts`).
- Scripts: dev uses `next dev --turbopack -p 9002` (see `package.json`) — default dev port is 9002.

## What frequently comes up (patterns & examples)
- App Router: API endpoints follow Next App Router conventions: `src/app/api/.../route.ts` exports request handlers. Keep these server-side only.
- Client vs Server components: many files use `"use client"` at the top for client-side UI. Default is server; add the directive when using hooks or window APIs.
- Types dual-format: `src/lib/types.ts` uses both snake_case (backend/Supabase) and camelCase (frontend) fields — e.g. `due_date` and `dueDate` co-exist. Prefer preserving compatibility when mapping data between client and Supabase.

### Example (printing pattern)
- `src/components/loans/loan-payment-card.tsx` shows a common pattern: a forwardRef printable component plus a wrapper that renders the card off-screen (`style={{ position: 'absolute', left: '-9999px' }}`) and triggers `react-to-print`. Follow this pattern for printable-only components to avoid mounting UI into visible layout.

## Build / dev / utilities
- Start dev: `npm run dev` (runs on port 9002). Use `npm run build` then `npm start` for production.
- Typecheck: `npm run typecheck` (invokes `tsc --noEmit`). ESLint is configured but build ignores linting errors in `next.config.ts`.
- Genkit: AI assistant related dev commands available: `npm run genkit:dev` and `npm run genkit:watch` (see `package.json`). Use these when working on `src/ai/*`.
- Admin scripts: `npm run create-admin` runs `ts-node scripts/create-admin.ts`; `npm run register` executes `register-user.js`.

## Environment & integrations
- Supabase env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `src/lib/supabaseClient.ts`). Don't hardcode keys.
- (Firebase config removed; all features now use Supabase.)
- The app enables PWA via `next-pwa` and uses an intentionally permissive CSP/CORS in `next.config.ts`. Be careful when modifying -- the config intentionally relaxes headers for local/dev features.

## Project-specific conventions
- UI primitives live under `src/components/ui/*` and should be reused for consistent styling (e.g., `button.tsx`, `input.tsx`).
- Domain components are grouped (clients, loans, pos, inventory). When adding features, follow the same folder structure and add route handlers under `src/app/api/<domain>/route.ts`.
- Use the `types.ts` canonical types for payload shapes. When persisting or reading from Supabase, be explicit about converting snake_case ↔ camelCase where necessary.

## Where to look for related examples
- Authentication & server helpers: `src/lib/supabaseServer.ts` and `src/lib/supabaseClient.ts`.
- Domain types and field naming: `src/lib/types.ts` (loans, installments, clients) — important for data shape consistency.
- Print / forwardRef pattern: `src/components/loans/loan-payment-card.tsx` (see wrapper that renders off-screen and calls `useReactToPrint`).

## Dev safety notes for AI edits
- Avoid changing global security headers in `next.config.ts` without a clear reason — they are permissive by design for this project.
- Respect the dual-format fields in `types.ts` when converting objects between DB and UI.
- If you add dependencies, update `package.json` and ensure `npm install` and `npm run typecheck` are run; mention here if changes touch native modules (e.g., thermal printers) so a human can verify environment compatibility.

## Quick checklist for PRs from AI edits
1. Preserve `"use client"` and `forwardRef` usage in client components that require them.  
2. Keep data shape compatibility (snake_case ↔ camelCase).  
3. Run `npm run typecheck`.  
4. Run `npm run dev` locally (port 9002) and verify the modified route or component loads.

---
If any of these sections are unclear or you want more examples (API handler, Supabase queries, or a sample snake_case→camelCase mapper), tell me which area and I'll expand with concrete code snippets and tests.
