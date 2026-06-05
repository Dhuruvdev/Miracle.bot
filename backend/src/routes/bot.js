const express = require('express');
const { bot, handler } = require('../lib/botInstance');
const { discordFetch } = require('../lib/discordFetch');
const { saveActionsToDb } = require('../lib/db');

const router = express.Router();

// ── POST /api/bot/presence ────────────────────────────────────────────────────
// Update the bot's own Gateway presence (what servers see on the bot's profile).
// Body: { activity: { type, name, url? } | null }
router.post('/presence', (req, res) => {
    if (!bot._token) return res.status(400).json({ error: 'Bot not connected.' });
    const { activity } = req.body || {};
    bot.updatePresence(activity ?? null);
    res.json({ ok: true });
});

// ── POST /api/bot/actions — register button → action-step mappings ────────────
router.post('/actions', async (req, res) => {
    const { actions } = req.body || {};
    if (actions && typeof actions === 'object') {
        bot.setButtonActions(actions);
        handler.setActions(actions);
        console.log(`[Actions] Registered ${Object.keys(actions).length} button action(s): ${Object.keys(actions).join(', ') || '(none)'}`);
        await saveActionsToDb(actions);
    }
    res.json({ ok: true });
});

// ── POST /api/bot/start ───────────────────────────────────────────────────────
router.post('/start', async (req, res) => {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string' || !token.trim())
        return res.status(400).json({ error: 'Bot token is required.' });

    const trimmed = token.trim();
    let guilds;
    try {
        guilds = await discordFetch('/users/@me/guilds', trimmed);
    } catch (e) {
        return res.status(401).json({ error: e.message || 'Invalid bot token.' });
    }

    bot.disconnect();
    bot.guilds = guilds.sort((a, b) => a.name.localeCompare(b.name));
    bot.connect(trimmed);

    res.json({ ok: true, guilds: bot.guilds });
});

// ── POST /api/bot/stop ────────────────────────────────────────────────────────
router.post('/stop', (req, res) => {
    bot.disconnect();
    res.json({ ok: true });
});

// ── GET /api/bot/status ───────────────────────────────────────────────────────
router.get('/status', (req, res) => {
    res.json({
        status:   bot.status,
        error:    bot.error,
        guilds:   bot.guilds,
        hasToken: !!bot._token,
        botUser:  bot.botUser,
    });
});

// ── GET /api/bot/guilds/:guildId/channels ─────────────────────────────────────
router.get('/guilds/:guildId/channels', async (req, res) => {
    if (!bot._token) return res.status(401).json({ error: 'Bot not connected.' });
    try {
        const channels = await discordFetch(`/guilds/${req.params.guildId}/channels`, bot._token);
        if (!Array.isArray(channels)) {
            console.error('[Channels] Unexpected response:', channels);
            return res.status(500).json({ error: 'Unexpected response from Discord.' });
        }
        res.json(channels);
    } catch (e) {
        const status = e.httpStatus || 500;
        const body   = e.discordBody || { message: e.message };
        console.error(`[Channels] ✗ HTTP ${status}:`, JSON.stringify(body));
        res.status(status).json(body);
    }
});

// ── POST /api/bot/channels/:channelId/messages ────────────────────────────────
router.post('/channels/:channelId/messages', async (req, res) => {
    if (!bot._token) return res.status(401).json({ error: 'Bot not connected.' });

    const channelId = req.params.channelId;
    const { attachments, ...discordPayload } = req.body;

    console.log(`[Send] → channel ${channelId}  flags=${discordPayload.flags}  components=${discordPayload.components?.length ?? 0}  files=${attachments?.length ?? 0}`);

    try {
        let fetchOptions;
        if (attachments && attachments.length > 0) {
            const form = new FormData();
            form.append('payload_json', JSON.stringify(discordPayload));
            for (let i = 0; i < attachments.length; i++) {
                const { name, data, type } = attachments[i];
                const binary = Buffer.from(data, 'base64');
                const blob   = new Blob([binary], { type });
                form.append(`files[${i}]`, blob, name);
            }
            fetchOptions = { method: 'POST', body: form };
        } else {
            fetchOptions = { method: 'POST', body: JSON.stringify(discordPayload) };
        }

        const result = await discordFetch(
            `/channels/${channelId}/messages`,
            bot._token,
            fetchOptions
        );
        console.log(`[Send] ✓ Success`);
        res.json(result || { status: 'Success' });
    } catch (e) {
        const status = e.httpStatus || 500;
        const body   = e.discordBody || { message: e.message };
        console.error(`[Send] ✗ HTTP ${status}:`, JSON.stringify(body));
        res.status(status).json(body);
    }
});

module.exports = router;
