/**
 * discord-bot/src/commands/registry.js
 *
 * Registers slash commands with Discord's REST API.
 * Call deployCommands() once on bot startup (or when commands change).
 *
 * Usage:
 *   const { deployCommands } = require('discord-bot/src/commands/registry');
 *   await deployCommands(process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CLIENT_ID);
 */

const { discordFetch } = require('../utils/api');
const { makeLogger }   = require('../utils/logger');

const ping   = require('./ping');
const status = require('./status');

const log = makeLogger('Commands');

const COMMANDS = [ping, status];

/**
 * Register all slash commands as global application commands.
 * Global commands propagate to all servers within ~1 hour.
 *
 * @param {string} botToken     — bot token
 * @param {string} applicationId — Discord application (client) ID
 */
async function deployCommands(botToken, applicationId) {
    if (!botToken || !applicationId) {
        log.warn('deployCommands: missing token or applicationId — skipping');
        return;
    }

    const definitions = COMMANDS.map(c => c.definition);

    try {
        await discordFetch(
            `/applications/${applicationId}/commands`,
            botToken,
            { method: 'PUT', body: JSON.stringify(definitions) }
        );
        log.info(`Deployed ${definitions.length} command(s): ${definitions.map(c => '/' + c.name).join(', ')}`);
    } catch (err) {
        log.error('Failed to deploy commands:', err.message);
    }
}

/**
 * Handle an incoming slash command interaction.
 * Called from InteractionHandler when type === 2.
 *
 * @param {object} interaction
 * @param {object} helpers — { respond }
 */
async function handleCommand(interaction, helpers) {
    const name    = interaction.data?.name;
    const command = COMMANDS.find(c => c.definition.name === name);
    if (command) {
        await command.execute(interaction, helpers);
    }
}

module.exports = { deployCommands, handleCommand, COMMANDS };
