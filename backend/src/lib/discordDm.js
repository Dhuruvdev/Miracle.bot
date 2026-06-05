/**
 * backend/src/lib/discordDm.js
 *
 * Sends a professional welcome DM to a Discord user after they sign in.
 * Uses the bot token to open a DM channel and post a rich embed.
 */

const { discordFetch } = require('./discordFetch');

/**
 * Get a human-readable location string from request headers.
 * Uses Cloudflare CF-IPCountry if available, falls back to IP.
 */
function getLoginLocation(req) {
    const country = req.headers['cf-ipcountry'];
    const region  = req.headers['cf-region'] || req.headers['x-vercel-ip-city'];
    const ip      = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;

    if (country && country !== 'XX' && country !== 'T1') {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        try {
            const countryName = regionNames.of(country);
            return region ? `${region}, ${countryName}` : countryName;
        } catch {
            return country;
        }
    }

    return ip && ip !== '::1' && ip !== '127.0.0.1' ? ip : 'Unknown';
}

/**
 * Build the base URL for the app from environment.
 */
function getAppUrl() {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
    if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    return 'https://discord.builders';
}

/**
 * Send a professional welcome DM to a newly signed-in Discord user.
 *
 * @param {string} discordUserId   — Discord user snowflake ID
 * @param {object} discordUser     — Discord user object { username, discriminator, avatar }
 * @param {object} req             — Express request (for location info)
 */
async function sendWelcomeDm(discordUserId, discordUser, req) {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.warn('[DM] DISCORD_BOT_TOKEN not set — skipping welcome DM');
        return;
    }

    try {
        // ── 1. Open DM channel ────────────────────────────────────────────────
        const dmChannel = await discordFetch('/users/@me/channels', token, {
            method: 'POST',
            body:   JSON.stringify({ recipient_id: discordUserId }),
        });

        if (!dmChannel?.id) return;

        // ── 2. Build context ──────────────────────────────────────────────────
        const appUrl   = getAppUrl();
        const logoUrl  = `${appUrl}/logo.png`;
        const now      = new Date();
        const unixTs   = Math.floor(now.getTime() / 1000);
        const location = getLoginLocation(req);

        const displayName = discordUser.global_name
            || discordUser.username
            || 'Developer';

        // ── 3. Craft the embed ────────────────────────────────────────────────
        const embed = {
            color: 0x5865F2,

            author: {
                name:     'OpenEmbedded',
                icon_url: logoUrl,
                url:      appUrl,
            },

            title: '✅  Successful Sign In',

            description: [
                `Hey **${displayName}**! 👋 Welcome back to **OpenEmbedded**.`,
                '',
                'You have successfully signed in to the professional Discord',
                'component builder — build, preview, and deploy embeds, buttons,',
                'select menus, and action rows with a visual editor.',
                '',
                `> [**Open OpenEmbedded →**](${appUrl})`,
            ].join('\n'),

            fields: [
                {
                    name:   '🕐  Sign-in Time',
                    value:  `<t:${unixTs}:F>\n<t:${unixTs}:R>`,
                    inline: true,
                },
                {
                    name:   '🌍  Location',
                    value:  location,
                    inline: true,
                },
                {
                    name:   '🔐  Account',
                    value:  `<@${discordUserId}>`,
                    inline: true,
                },
                {
                    name:   '🚀  Quick Actions',
                    value: [
                        `[Open Builder](${appUrl})`,
                        `[Docs](${appUrl}/docs)`,
                    ].join(' · '),
                    inline: false,
                },
            ],

            thumbnail: {
                url: logoUrl,
            },

            image: {
                url: `${appUrl}/og-banner.png`,
            },

            footer: {
                text:     'OpenEmbedded · Discord Component Builder  •  You are receiving this because you signed in.',
                icon_url: logoUrl,
            },

            timestamp: now.toISOString(),
        };

        // ── 4. Send the message ───────────────────────────────────────────────
        await discordFetch(`/channels/${dmChannel.id}/messages`, token, {
            method: 'POST',
            body:   JSON.stringify({ embeds: [embed] }),
        });

        console.log(`[DM] Welcome DM sent to ${displayName} (${discordUserId})`);
    } catch (err) {
        // Non-fatal — user may have DMs disabled, bot not shared in server, etc.
        console.warn('[DM] Could not send welcome DM:', err.message);
    }
}

module.exports = { sendWelcomeDm };
