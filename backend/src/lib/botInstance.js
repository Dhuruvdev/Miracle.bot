/**
 * Shared singleton BotClient instance.
 * Both index.js (startup) and routes/bot.js (routes) import from here
 * so they always reference the same connected bot object.
 */
const { BotClient, InteractionHandler } = require('discord-bot');

const bot     = new BotClient();
const handler = new InteractionHandler(bot);

// Prevent unhandled 'error' event from crashing Node.js
bot.on('error', err => console.error('[Bot] Gateway error:', err.message));
bot.on('ready', user => console.log(`[Bot] Ready — ${user.username}#${user.discriminator}`));

module.exports = { bot, handler };
