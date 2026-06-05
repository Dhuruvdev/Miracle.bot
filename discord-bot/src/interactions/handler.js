/**
 * discord-bot/src/interactions/handler.js
 *
 * Routes INTERACTION_CREATE payloads to the appropriate handler.
 * Attach this to BotClient's 'interaction' event:
 *
 *   const handler = new InteractionHandler(bot);
 *   handler.setActions(buttonActions);
 */

const { executeAction } = require('./actions');
const { makeLogger }    = require('../utils/logger');

const log = makeLogger('Interactions');

class InteractionHandler {
    /**
     * @param {import('../gateway/client').BotClient} bot
     */
    constructor(bot) {
        this._bot = bot;
        this._actions = {};

        bot.on('interaction', async (data) => {
            try {
                await this._handle(data);
            } catch (err) {
                log.error('Unhandled interaction error:', err.message);
            }
        });
    }

    setActions(actions) {
        this._actions = actions || {};
    }

    async _handle(interaction) {
        const { type, data } = interaction;

        // type 2 = Application Command (slash commands)
        if (type === 2) {
            log.info(`Slash command /${data?.name} invoked`);
            return;
        }

        // type 3 = Message Component (buttons, select menus)
        if (type !== 3) return;
        if (!data?.custom_id) return;

        const componentType = data.component_type;
        let action, customId;

        if (componentType === 3) {
            // Select menu — match by selected value first, then custom_id
            const selectedValues = data.values || [];
            const matchedValue   = selectedValues.find(v => this._actions[v]);
            if (matchedValue) {
                action   = this._actions[matchedValue];
                customId = matchedValue;
                log.info(`Select menu option "${matchedValue}" matched`);
            } else {
                customId = data.custom_id;
                action   = this._actions[customId];
            }
        } else {
            customId = data.custom_id;
            action   = this._actions[customId];
        }

        if (!action?.steps?.length) {
            const { respondToInteraction } = require('../utils/api');
            await respondToInteraction(interaction.id, interaction.token, { type: 6 }).catch(e =>
                log.error('ACK failed:', e.message)
            );
            return;
        }

        log.info(`"${customId}" clicked — running ${action.steps.length} step(s)`);
        await executeAction(interaction, action, this._bot._token);
    }
}

module.exports = { InteractionHandler };
