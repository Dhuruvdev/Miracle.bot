---
name: OpenEmbedded auth architecture
description: How sign-in/auth is wired in this project (Replit OIDC, plain-JS Express, express-session).
---

Auth is implemented in `server/src/index.js` using only Node.js built-ins (`crypto`, `fetch`) + `express-session`.

**Why:** The Express server is plain CommonJS JS (not TypeScript, no build step). The Replit Auth blueprint files use TypeScript and drizzle-orm — too heavy. A hand-rolled PKCE OIDC flow against `https://replit.com/oidc` keeps the server simple.

**How to apply:** 
- Sessions stored in memory (not a DB) — users get logged out on server restart unless SESSION_SECRET is stable (it is: stored as Replit secret).
- Auth routes: GET /api/login → GET /api/callback → stores `req.session.user` → redirect /.
- Auth guard: `app.use('/api', requireAuth)` placed AFTER the four public auth routes so they bypass the guard.
- Frontend: `useAuth` hook in `website/src/hooks/useAuth.ts` fetches `/api/auth/user`; `AuthGate` in `main.tsx` shows `<SignIn />` on 401.
- `REPL_ID` (auto-provided by Replit) is used as the OIDC `client_id`.
