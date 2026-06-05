/**
 * discord-bot/src/index.js
 *
 * OpenEmbedded Bot — main entry point and public API.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  This package provides two independent systems:                      │
 * │                                                                     │
 * │  1. BotClient  — Discord Gateway WebSocket connection for the bot.  │
 * │     Sets "Playing OpenEmbedded" on the bot's profile in servers.   │
 * │     Handles button/select interactions and slash commands.          │
 * │                                                                     │
 * │  2. userPresence — Shows "Playing OpenEmbedded" on the LOGGED-IN   │
 * │     USER's real Discord profile while they use the website.        │
 * │     Works like "Listening to Spotify" — no Discord desktop app     │
 * │     required. Uses OAuth2 headless-sessions with activities.write. │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Setup (OAuth2 scopes required in your Discord Developer Portal)
 * ───────────────────────────────────────────────────────────────
 *   identify email guilds activities.write
 *
 *   Then under App Settings → Activities, enable "Embedded Activity".
 *
 * Standalone usage
 * ────────────────
 *   DISCORD_BOT_TOKEN=... DISCORD_CLIENT_ID=... node discord-bot/src/index.js
 *
 * Library usage (imported by backend)
 * ────────────────────────────────────
 *   const { BotClient, userPresence } = require('discord-bot');
 */

const { BotClient }          = require('./gateway/client');
const { userPresence, UserPresence } = require('./presence/userPresence');
const { InteractionHandler } = require('./interactions/handler');
const { deployCommands }     = require('./commands/registry');
const { makeLogger }         = require('./utils/logger');

const log = makeLogger('OpenEmbedded Bot');

module.exports = {
    BotClient,
    UserPresence,
    userPresence,       // singleton instance
    InteractionHandler,
    deployCommands,
    makeLogger,
};

// ── Standalone mode ───────────────────────────────────────────────────────────
if (require.main === module) {
    const token = process.env.DISCORD_BOT_TOKEN;
    const appId = process.env.DISCORD_CLIENT_ID;

    if (!token) {
        log.error('DISCORD_BOT_TOKEN environment variable is required');
        process.exit(1);
    }

    const bot     = new BotClient();
    const handler = new InteractionHandler(bot);

    bot.on('ready', async (user) => {
        log.info(`Logged in as ${user.username}#${user.discriminator}`);
        if (appId) {
            await deployCommands(token, appId);
        }
    });

    bot.on('error', err => log.error('Bot error:', err.message));

    bot.connect(token);

    log.info('Starting standalone bot…');
    log.info('User Rich Presence is managed by the backend — not available in standalone mode.');
}
