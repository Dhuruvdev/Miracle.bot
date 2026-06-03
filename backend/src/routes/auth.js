const express = require('express');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const postgres = require('postgres');

const { createToken, consumeToken, pruneExpiredTokens, EXPIRES_MINUTES } = require('../lib/tokens');
const { sendEmail }             = require('../lib/email');
const { verificationEmailHtml } = require('../lib/emailTemplate');

const router = express.Router();

// ── DB singleton ──────────────────────────────────────────────────────────────
let _sql = null;
function getSql() {
    if (_sql) return _sql;
    const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!url) return null;
    _sql = postgres(url, {
        ssl: process.env.NEON_DATABASE_URL ? 'require' : undefined,
        max: 5,
    });
    return _sql;
}

// no-op kept for backward compat with index.js
async function initAuth() {
    pruneExpiredTokens().catch(() => {});
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim())
        return res.status(400).json({ error: 'Email is required.' });
    if (!password || typeof password !== 'string' || password.trim().length < 6)
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const sql = getSql();
    if (!sql) return res.status(503).json({ error: 'Database not configured.' });

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const existing = await sql`SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1`;
        if (existing.length > 0)
            return res.status(409).json({ error: 'An account with this email already exists.' });

        const id           = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password.trim(), 12);
        await sql`INSERT INTO users (id, email, password_hash) VALUES (${id}, ${normalizedEmail}, ${passwordHash})`;

        const token = await createToken(normalizedEmail);
        if (!token) {
            await sql`UPDATE users SET email_verified = true WHERE id = ${id}`;
            req.session.user = { id, email: normalizedEmail, provider: 'password' };
            return res.json({ ok: true, direct: true });
        }

        const appUrl    = buildAppUrl(req);
        const verifyUrl = `${appUrl}/verify?token=${token}`;
        const html      = verificationEmailHtml({ verifyUrl, expiresMinutes: EXPIRES_MINUTES, appUrl });
        const sent      = await sendEmail({ to: normalizedEmail, subject: 'Verify your OpenEmbedded account', html });

        if (!sent) {
            await sql`UPDATE users SET email_verified = true WHERE id = ${id}`;
            req.session.user = { id, email: normalizedEmail, provider: 'password' };
            return res.json({ ok: true, direct: true });
        }

        res.json({ ok: true, requiresVerification: true, email: normalizedEmail });
    } catch (err) {
        console.error('[Auth] Register error:', err.message);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim())
        return res.status(400).json({ error: 'Email is required.' });
    if (!password || typeof password !== 'string' || !password.trim())
        return res.status(400).json({ error: 'Password is required.' });

    const sql = getSql();
    if (!sql) return res.status(503).json({ error: 'Database not configured.' });

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const rows = await sql`SELECT id, password_hash, email_verified FROM users WHERE email = ${normalizedEmail} LIMIT 1`;

        if (rows.length === 0) {
            await bcrypt.compare('dummy', '$2a$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.');
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user          = rows[0];
        const passwordMatch = await bcrypt.compare(password.trim(), user.password_hash);

        if (!passwordMatch)
            return res.status(401).json({ error: 'Invalid email or password.' });

        if (!user.email_verified) {
            const token = await createToken(normalizedEmail);
            if (token) {
                const appUrl    = buildAppUrl(req);
                const verifyUrl = `${appUrl}/verify?token=${token}`;
                const html      = verificationEmailHtml({ verifyUrl, expiresMinutes: EXPIRES_MINUTES, appUrl });
                await sendEmail({ to: normalizedEmail, subject: 'Verify your OpenEmbedded account', html });
            }
            return res.status(403).json({
                error:                'Please verify your email first. Check your inbox.',
                requiresVerification: true,
                email:                normalizedEmail,
            });
        }

        const token = await createToken(normalizedEmail);
        if (!token) {
            req.session.user = { id: user.id, email: normalizedEmail, provider: 'password' };
            return res.json({ ok: true, direct: true });
        }

        const appUrl    = buildAppUrl(req);
        const verifyUrl = `${appUrl}/verify?token=${token}`;
        const html      = verificationEmailHtml({ verifyUrl, expiresMinutes: EXPIRES_MINUTES, appUrl });
        const sent      = await sendEmail({ to: normalizedEmail, subject: 'Verify your OpenEmbedded login', html });

        if (!sent) {
            req.session.user = { id: user.id, email: normalizedEmail, provider: 'password' };
            return res.json({ ok: true, direct: true });
        }

        res.json({ ok: true, requiresVerification: true, email: normalizedEmail });
    } catch (err) {
        console.error('[Auth] Login error:', err.message);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});

// ── GET /api/auth/verify ──────────────────────────────────────────────────────
router.get('/verify', async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string')
        return res.status(400).json({ error: 'Missing token.' });

    const email = await consumeToken(token);
    if (!email)
        return res.status(400).json({ error: 'This link has expired or already been used. Please sign in again.' });

    const sql    = getSql();
    let   userId = email;

    if (sql) {
        try {
            await sql`UPDATE users SET email_verified = true WHERE email = ${email}`;
            const rows = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
            if (rows.length > 0) userId = rows[0].id;
        } catch (err) {
            console.error('[Auth] Verify DB error:', err.message);
        }
    }

    req.session.user = { id: userId, email, provider: 'password' };
    console.log(`[Auth] Verified login for: ${email}`);
    res.json({ ok: true });
});

// ── POST /api/auth/resend ─────────────────────────────────────────────────────
router.post('/resend', async (req, res) => {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string')
        return res.status(400).json({ error: 'Email is required.' });

    const normalizedEmail = email.trim().toLowerCase();
    const sql = getSql();

    if (sql) {
        const rows = await sql`SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1`.catch(() => []);
        if (rows.length === 0)
            return res.status(400).json({ error: 'No account found with that email.' });
    }

    const token = await createToken(normalizedEmail);
    if (!token) return res.status(503).json({ error: 'Service temporarily unavailable.' });

    const appUrl    = buildAppUrl(req);
    const verifyUrl = `${appUrl}/verify?token=${token}`;
    const html      = verificationEmailHtml({ verifyUrl, expiresMinutes: EXPIRES_MINUTES, appUrl });
    const sent      = await sendEmail({ to: email.trim(), subject: 'Verify your OpenEmbedded login', html });

    if (!sent) return res.status(503).json({ error: 'Failed to send email. Email service not configured.' });

    res.json({ ok: true });
});

// ── GET /api/auth/discord ─────────────────────────────────────────────────────
router.get('/discord', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId)
        return res.status(503).send('Discord login is not configured (DISCORD_CLIENT_ID missing).');

    const state = crypto.randomBytes(20).toString('hex');
    req.session.oauthState = state;

    const redirectUri = buildRedirectUri(req);
    const params = new URLSearchParams({
        client_id:     clientId,
        redirect_uri:  redirectUri,
        response_type: 'code',
        scope:         'identify email',
        state,
        prompt:        'none',
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// ── GET /api/auth/discord/callback ────────────────────────────────────────────
router.get('/discord/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        console.warn('[Auth/Discord] User denied authorization:', error);
        return res.redirect('/?error=discord_denied');
    }

    if (!state || state !== req.session.oauthState) {
        console.warn('[Auth/Discord] State mismatch — possible CSRF attempt');
        return res.redirect('/?error=state_mismatch');
    }
    req.session.oauthState = null;

    const clientId     = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    if (!clientId || !clientSecret)
        return res.status(503).send('Discord login is not configured.');

    try {
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id:     clientId,
                client_secret: clientSecret,
                grant_type:    'authorization_code',
                code,
                redirect_uri:  buildRedirectUri(req),
            }),
        });

        if (!tokenRes.ok) {
            const body = await tokenRes.text();
            console.error('[Auth/Discord] Token exchange failed:', body);
            return res.redirect('/?error=discord_token');
        }

        const { access_token, token_type } = await tokenRes.json();

        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `${token_type} ${access_token}` },
        });

        if (!userRes.ok) {
            console.error('[Auth/Discord] User fetch failed:', userRes.status);
            return res.redirect('/?error=discord_user');
        }

        const discordUser = await userRes.json();

        req.session.user = {
            id:            discordUser.id,
            email:         discordUser.email || null,
            username:      discordUser.username,
            discriminator: discordUser.discriminator,
            avatar:        discordUser.avatar,
            provider:      'discord',
        };

        console.log(`[Auth/Discord] Logged in: ${discordUser.username} (${discordUser.id})`);
        res.redirect('/');
    } catch (err) {
        console.error('[Auth/Discord] Unexpected error:', err.message);
        res.redirect('/?error=discord_error');
    }
});

// ── GET /api/auth/user ────────────────────────────────────────────────────────
router.get('/user', (req, res) => {
    if (!req.session?.user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(req.session.user);
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    req.session = null;
    res.json({ ok: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildRedirectUri(req) {
    const host  = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    return `${proto}://${host}/api/auth/discord/callback`;
}

function buildAppUrl(req) {
    const host  = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    return `${proto}://${host}`;
}

module.exports = { router, initAuth };
