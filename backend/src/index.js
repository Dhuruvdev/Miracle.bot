/**
 * backend/src/index.js — OpenEmbedded API server entry point
 *
 * Wires together session middleware, auth routes, and bot routes.
 * Can be run directly (node src/index.js) or required by api/index.js
 * for Vercel serverless deployment.
 */
const express           = require('express');
const path              = require('path');
const fs                = require('fs');
const sessionMiddleware = require('./middleware/session');
const { router: authRouter, initAuth } = require('./routes/auth');
const botRouter         = require('./routes/bot');
const { loadActionsFromDb } = require('./lib/db');
const { bot, handler }  = require('./lib/botInstance');
const { discordFetch }  = require('./lib/discordFetch');
const { initDb }        = require('./lib/initDb');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(sessionMiddleware);

// ── Auth routes (public — no session guard) ───────────────────────────────────
app.use('/api/auth', authRouter);

// GET /api/logout clears the cookie
app.get('/api/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// ── Auth guard for all remaining /api/* routes ────────────────────────────────
app.use('/api', (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    next();
});

// ── Bot routes ────────────────────────────────────────────────────────────────
app.use('/api/bot', botRouter);

// ── Serve built frontend in production ───────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

if (isProd && fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
    console.log(`[Server] Serving frontend from ${frontendDist}`);
} else if (!isProd) {
    // ── Dev mode: proxy non-API requests to Vite (port 5000) ─────────────────
    // This ensures that after Discord OAuth callback, redirecting to / serves
    // the React app instead of an Express 404, even when the Replit external
    // URL maps to this port (3001) rather than the Vite port (5000).
    const http = require('http');
    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();

        const options = {
            hostname: 'localhost',
            port:     5000,
            path:     req.url,
            method:   req.method,
            headers:  { ...req.headers, host: 'localhost:5000' },
        };

        const proxyReq = http.request(options, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });

        proxyReq.on('error', () => {
            // Vite not up yet — send a simple reload page
            res.setHeader('Content-Type', 'text/html');
            res.send('<!DOCTYPE html><html><head><title>Loading…</title>' +
                '<meta http-equiv="refresh" content="2"></head>' +
                '<body style="background:#202226;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
                '<p>Starting OpenEmbedded…</p></body></html>');
        });

        req.pipe(proxyReq, { end: true });
    });
    console.log('[Server] Dev proxy: non-API routes → Vite on port 5000');
}

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
    // Ensure all DB tables exist before anything else runs
    initDb().then(() => initAuth()).then(async () => {
        // Load persisted button actions and pass them to the bot
        const savedActions = await loadActionsFromDb();
        if (Object.keys(savedActions).length > 0) {
            bot.setButtonActions(savedActions);
            handler.setActions(savedActions);
        }

        // ── Auto-connect official bot from env ────────────────────────────────
        const envToken = process.env.DISCORD_BOT_TOKEN;
        if (envToken) {
            console.log('[Server] DISCORD_BOT_TOKEN found — auto-connecting bot...');
            // Prefetch guild list (nice-to-have) — connect regardless of outcome
            discordFetch('/users/@me/guilds', envToken)
                .then(guilds => {
                    bot.guilds = Array.isArray(guilds)
                        ? guilds.sort((a, b) => a.name.localeCompare(b.name))
                        : [];
                })
                .catch(err => console.warn('[Server] Guild prefetch failed (non-fatal):', err.message));
            // Always attempt Gateway connection
            bot.connect(envToken);
        }

        const PORT = process.env.PORT || process.env.BOT_SERVER_PORT || (isProd ? 8080 : 3001);
        app.listen(PORT, '0.0.0.0', () => console.log(`[Server] Running on port ${PORT} (${isProd ? 'production' : 'development'})`));
    });
}

module.exports = app;
