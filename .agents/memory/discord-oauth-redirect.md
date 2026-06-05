---
name: Discord OAuth redirect_uri fix
description: buildRedirectUri must use REPLIT_DEV_DOMAIN to be consistent across proxy paths; header-based URIs cause mismatch errors.
---

**The bug:** Discord OAuth token exchange fails with `discord_token` error when `buildRedirectUri()` returns different values for the authorization request vs the callback request.

**Root cause:** In Replit dev, requests can arrive via two paths:
1. Through the Vite dev server proxy (port 5000) — sets `X-Forwarded-Host`
2. Directly to the backend (port 3001, external port 80) — different or missing `X-Forwarded-Host`

If the authorization request goes through Vite proxy but the Discord callback hits port 3001 directly (or vice versa), `buildRedirectUri` produces different hostnames and Discord rejects the token exchange.

**Fix:** `_baseUrl()` in `backend/src/routes/auth.js` prioritizes:
1. `APP_URL` env var (explicit override, best for production)
2. `REPLIT_DEV_DOMAIN` (always stable in Replit regardless of proxy path)
3. `X-Forwarded-Host` header (fallback for other hosts)
4. `req.headers.host` (last resort)

**Why:** `REPLIT_DEV_DOMAIN` is set by Replit and is constant for the repl session. Both the auth start and callback will always produce identical redirect_uris.

**How to apply:** Always use `buildRedirectUri(req)` (not a hardcoded string) for BOTH the authorization URL and the token exchange body. They call the same `_baseUrl()` function, guaranteeing they match.
