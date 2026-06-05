# OpenEmbedded

A visual editor and preview tool for Discord message components (embeds, buttons, select menus). Users can build rich Discord messages, preview them exactly as they appear in Discord, send them via webhooks or a bot, and generate code for multiple Discord libraries.

## Architecture

- **Frontend**: React + Vite app (`frontend/`) on port 5000
- **Backend**: Express.js API server (`backend/`) on port 3001 — proxies non-API routes to Vite in dev
- **Discord Bot**: Custom Gateway client (`discord-bot/`) — shares DB with backend
- **Database**: PostgreSQL via Drizzle ORM (`database/`) — uses Replit's built-in PostgreSQL (`DATABASE_URL`)
- **Monorepo**: Yarn 4 workspaces

## Running the app

```bash
bash start-dev.sh
```

This installs dependencies, builds the `database` package, starts the Express backend, then starts the Vite dev server.

The Replit preview pane should point to **port 5000** (Vite) — the backend proxies non-API requests from port 3001 to Vite in dev mode.

## Auth

The app uses its own custom auth (not Replit Auth) because it's a Discord-centric tool:
- **Email (magic link)**: Requires `GMAIL_USER` + `GMAIL_APP_PASSWORD` secrets. Without them, falls back to direct session login.
- **Discord OAuth2**: Requires `DISCORD_CLIENT_ID` + `DISCORD_CLIENT_SECRET` secrets.

Sessions use `cookie-session` with the `SESSION_SECRET` Replit secret (already set).

## Database

Uses Replit PostgreSQL (`DATABASE_URL` — auto-provisioned). Schema is created on startup via `backend/src/lib/initDb.js` (CREATE TABLE IF NOT EXISTS — safe to re-run).

Required tables: `button_actions`, `verification_tokens`, `sent_messages`, `sessions`.

## Required secrets

Already set by Replit:
- `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — Replit PostgreSQL
- `SESSION_SECRET` — cookie session signing
- `REPL_ID`, `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS` — Replit environment

Optional (app degrades gracefully without):
- `DISCORD_CLIENT_ID` — enables Discord OAuth login + bot features
- `DISCORD_CLIENT_SECRET` — required alongside CLIENT_ID for Discord OAuth
- `DISCORD_BOT_TOKEN` — auto-connects the Discord bot on startup
- `GMAIL_USER` — Gmail address for sending magic-link emails
- `GMAIL_APP_PASSWORD` — Gmail app password for SMTP

## User preferences
