/**
 * Vercel Serverless entry point for /api/* routes.
 *
 * TWO MODES:
 *
 * 1. PROXY MODE (recommended for full bot support):
 *    Set the BACKEND_URL environment variable in Vercel to point to a
 *    persistent server (Replit Deploy, Render, Railway, Fly.io, etc.).
 *    All /api/* requests are forwarded there transparently — the browser
 *    never knows it's going to a different host, and session cookies work
 *    normally because the proxy forwards Set-Cookie back to the client.
 *
 *    The persistent server keeps the Discord Gateway WebSocket alive and
 *    preserves bot state between requests.
 *
 *    Example: BACKEND_URL=https://my-openembedded-server.onrender.com
 *
 * 2. SERVERLESS MODE (fallback, no BACKEND_URL):
 *    Uses the embedded Express server as a Vercel serverless function.
 *    Webhook sending, auth, and code generation work fine.
 *    The Discord Gateway bot feature is NOT available in this mode
 *    because serverless functions are stateless and can't hold a
 *    persistent WebSocket connection to the Discord Gateway.
 */

const BACKEND_URL = process.env.BACKEND_URL;

if (BACKEND_URL) {
    const base = BACKEND_URL.replace(/\/$/, '');

    module.exports = async (req, res) => {
        const target = `${base}${req.url}`;
        try {
            const isBodyless = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
            const body = isBodyless
                ? undefined
                : JSON.stringify(req.body);

            const headers = {
                'content-type': req.headers['content-type'] || 'application/json',
                'cookie': req.headers['cookie'] || '',
                'x-forwarded-for':
                    req.headers['x-forwarded-for'] ||
                    req.socket?.remoteAddress ||
                    '',
                'x-forwarded-host': req.headers['host'] || '',
                'x-forwarded-proto': 'https',
            };

            const upstreamRes = await fetch(target, {
                method: req.method,
                headers,
                body,
                redirect: 'manual', // let Express redirects pass through unchanged
            });

            // Forward response headers (strip content-encoding — fetch already decoded)
            for (const [key, value] of upstreamRes.headers.entries()) {
                if (key.toLowerCase() === 'content-encoding') continue;
                if (key.toLowerCase() === 'transfer-encoding') continue;
                res.setHeader(key, value);
            }

            // Forward redirects (OAuth dance)
            if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
                const location = upstreamRes.headers.get('location');
                if (location) return res.redirect(upstreamRes.status, location);
            }

            res.status(upstreamRes.status);
            const buffer = await upstreamRes.arrayBuffer();
            res.end(Buffer.from(buffer));
        } catch (e) {
            console.error('[Proxy] Error reaching backend:', e.message);
            res.status(502).json({
                message: 'Backend unreachable',
                hint: 'Check the BACKEND_URL environment variable on Vercel.',
                error: e.message,
            });
        }
    };
} else {
    // Serverless fallback — no Discord bot WebSocket persistence
    module.exports = require('../server/src/index');
}
