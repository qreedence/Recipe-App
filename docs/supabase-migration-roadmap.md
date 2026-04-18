# Supabase Migration Roadmap

Tracking the staged migration from local-only (Dexie/IndexedDB) to Supabase-backed storage with Dexie as a write-behind offline cache.

## Why

- Enable auth (email/password first; OAuth later)
- External/cloud storage so data isn't tied to a single device
- Unlocks sharing, multi-device, and future social features
- Keep offline-first: Dexie stays, demoted to cache + pending-write queue

## Decisions already made

- **Auth:** email + password for v1. OAuth (Google) is a fast-follow.
- **Sync model:** write-behind. Dexie accepts writes immediately; a sync worker flushes to Supabase in the background.
- **IDs:** already client-generated UUIDs, no change.
- **Supabase client:** `@supabase/ssr` + publishable key (new API key system, not legacy anon).
- **UI:** all new UI uses shadcn components already in `components/ui/`.

## PR stack

Each PR ships independently. Pause/redirect between them.

### PR #1 — Auth scaffolding (this branch: `feat/supabase-auth`)

- Supabase client helpers (browser + server)
- Middleware for session refresh
- `/login` + `/signup` pages (shadcn form components)
- Email confirmation callback route
- `useUser` hook
- User menu in nav
- Example protected route (`/account`) showing user info + sign out
- **No data-layer changes.** App continues to work with Dexie as source of truth.

### PR #2 — Schema + storage layer rewrite

- Postgres schema + RLS policies for all 5 tables (recipes, shoppingItems, mealPlanEntries, mealTypeConfig, recipeDrafts)
- Add `user_id` foreign key to every table
- Rewrite `lib/storage.ts` to call Supabase; keep function signatures identical so hooks/components don't change
- Add write-behind queue primitive in Dexie (`pending_writes` table)
- Sync worker that drains the queue when online

### PR #3 — Per-entity sync wiring

One PR per table. Each wires read-through cache (Dexie first, Supabase refetch) + write-behind (Dexie immediate, queue Supabase).

- 3a. recipes
- 3b. shoppingItems
- 3c. mealPlanEntries
- 3d. mealTypeConfig
- 3e. recipeDrafts (may stay local-only — drafts are ephemeral)

### PR #4 — Data migration wizard

- First-login flow: detect existing local Dexie data, prompt user to push up to their new account
- Conflict handling if the account already has cloud data

### PR #5 — Cleanup

- Fix direct Dexie access in `components/image-migration.tsx` (route through storage layer)
- Remove dead code, dedupe abstractions
- Docs update

## Open questions / deferred

- Realtime subscriptions vs polling: deferred to PR #3; start with polling + SWR revalidation, add realtime if needed.
- Multi-table transaction loss on import: `lib/import-db.ts` uses Dexie transactions. Decide in PR #2 between Postgres RPC or accepting eventual consistency during restore.
- OAuth: after PR #1 ships.
- Shared/public recipes: out of scope for this migration.
