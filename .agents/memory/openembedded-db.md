---
name: OpenEmbedded DB setup
description: Backend uses NEON_DATABASE_URL (not DATABASE_URL) and requires initDb.js to create tables on startup.
---

The backend's `db.js` and `tokens.js` both prefer `NEON_DATABASE_URL` over `DATABASE_URL`. The Replit PostgreSQL (`DATABASE_URL`) is a separate DB that the backend does NOT use at runtime.

**Rule:** Any schema changes must target the NEON database. `initDb.js` runs `CREATE TABLE IF NOT EXISTS` for all four tables on every server startup — this is the safe migration path that avoids drift.

**Tables required in NEON DB:**
- `button_actions` — Discord component interaction mappings
- `verification_tokens` — Email magic-link tokens
- `sent_messages` — Discord message audit log
- `sessions` — Admin session audit log (cookie-session handles auth; this is just for logging)

**Why:** The project was originally hosted on Neon + Vercel. The NEON_DATABASE_URL secret was already set when imported to Replit, so the backend continued using it. The Replit PostgreSQL (`DATABASE_URL`) was provisioned later but is not used by the backend.

**How to apply:** If a new table is needed, add `CREATE TABLE IF NOT EXISTS` to `backend/src/lib/initDb.js`. It runs automatically at startup.
