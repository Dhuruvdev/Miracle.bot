---
name: OpenEmbedded DB setup
description: Backend uses NEON_DATABASE_URL || DATABASE_URL; on Replit the built-in DATABASE_URL is active. initDb.js creates tables on startup.
---

The backend's `db.js` and `initDb.js` prefer `NEON_DATABASE_URL` over `DATABASE_URL` (fallback). On Replit, only `DATABASE_URL` (Replit PostgreSQL) is set, so it is used automatically.

**Rule:** Any schema changes should add `CREATE TABLE IF NOT EXISTS` to `backend/src/lib/initDb.js`. It runs on every startup — safe to re-run.

**Tables required:**
- `button_actions` — Discord component interaction mappings
- `verification_tokens` — Email magic-link tokens
- `sent_messages` — Discord message audit log
- `sessions` — Admin session audit log

**Why:** `NEON_DATABASE_URL || DATABASE_URL` fallback means no code change was needed when migrating from Neon+Vercel to Replit PostgreSQL. The schema init confirmed "[DB] Schema initialised — all required tables exist" on startup.

**How to apply:** If a new table is needed, add `CREATE TABLE IF NOT EXISTS` to `backend/src/lib/initDb.js`.
