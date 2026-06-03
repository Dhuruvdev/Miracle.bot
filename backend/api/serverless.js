/**
 * backend/api/serverless.js
 *
 * Lightweight Express app for Vercel serverless deployment.
 *
 * Only mounts auth routes — deliberately excludes bot/gateway/WebSocket
 * code that cannot run in a stateless serverless function.
 *
 * Bot features (Discord Gateway, channel messaging) require a persistent
 * server. Set BACKEND_URL in Vercel env vars to proxy those requests to
 * a long-running backend (Replit Deploy, Render, Railway, etc.).
 */

const express           = require('express');
const cookieSession     = require('cookie-session');
const crypto            = require('crypto');
const { router: authRouter, initAuth } = require('../src/routes/auth');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

// ── Session ───────────────────────────────────────────────────────────────────
app.use(cookieSession({
    name:     'oe_session',
    keys:     [process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')],
    maxAge:   7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
}));

// ── Auth routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Auth guard for all other /api/* ──────────────────────────────────────────
app.use('/api', (req, res, next) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    next();
});

// ── Stub bot routes — unavailable in serverless mode ─────────────────────────
app.all('/api/bot/*', (_req, res) => {
    res.status(503).json({
        error: 'Bot features require a persistent backend.',
        hint:  'Set BACKEND_URL in your Vercel environment variables to enable bot functionality.',
    });
});

// ── Initialise admin credentials once on cold start ──────────────────────────
let _initialised = false;
const _init = initAuth().then(() => { _initialised = true; });

// Export as a Vercel-compatible handler
module.exports = async (req, res) => {
    if (!_initialised) await _init;
    app(req, res);
};
