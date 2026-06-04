/**
 * backend/src/lib/presence.js
 *
 * Discord Rich Presence via the unofficial headless-sessions endpoint.
 * Uses the activities.write OAuth2 scope to display a "Playing" activity
 * on the user's real Discord profile while they are using the site.
 *
 * Sessions expire after ~20 minutes, so the frontend pings
 * POST /api/auth/presence/refresh every 15 minutes to keep them alive.
 */

const DISCORD_API = 'https://discord.com/api/v10';

// In-memory store: userId → { accessToken }
// Cleared on server restart (presence expires naturally anyway).
const tokenStore = new Map();

/**
 * Build the activity payload for OpenEmbedded.
 */
function buildActivity(applicationId) {
    return {
        type: 0,              // 0 = Playing
        name: 'OpenEmbedded',
        details: 'Building Discord components',
        state: 'Using the visual builder',
        application_id: applicationId,
        platform: 'web',
        timestamps: {
            start: Math.floor(Date.now() / 1000),
        },
    };
}

/**
 * Create (or recreate) a headless presence session for a Discord user.
 * @param {string} userId - Discord user ID (used as store key)
 * @param {string} accessToken - Discord OAuth2 access token with activities.write scope
 * @returns {Promise<boolean>} true on success
 */
async function createPresence(userId, accessToken) {
    const applicationId = process.env.DISCORD_CLIENT_ID;
    if (!applicationId) {
        console.warn('[Presence] DISCORD_CLIENT_ID not set — skipping presence creation');
        return false;
    }

    // Save the token so we can refresh later without the caller needing it
    tokenStore.set(userId, { accessToken });

    try {
        const res = await fetch(`${DISCORD_API}/users/@me/headless-sessions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ activity: buildActivity(applicationId) }),
        });

        if (res.ok) {
            console.log(`[Presence] Activity set for user ${userId}`);
            return true;
        }

        const body = await res.text();
        if (res.status === 403) {
            console.warn(`[Presence] activities.write scope not approved for this app (403). Discord partner approval may be required.`);
        } else {
            console.warn(`[Presence] Failed to set activity (${res.status}): ${body}`);
        }
        return false;
    } catch (err) {
        console.warn(`[Presence] Network error setting activity: ${err.message}`);
        return false;
    }
}

/**
 * Refresh the presence for a user using the stored access token.
 * Called every ~15 minutes from the frontend to keep the activity alive.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function refreshPresence(userId) {
    const entry = tokenStore.get(userId);
    if (!entry) {
        console.warn(`[Presence] No stored token for user ${userId} — cannot refresh`);
        return false;
    }
    return createPresence(userId, entry.accessToken);
}

/**
 * Remove the stored token for a user (called on logout).
 * The headless session will expire naturally within 20 min.
 * @param {string} userId
 */
function clearPresence(userId) {
    if (tokenStore.has(userId)) {
        tokenStore.delete(userId);
        console.log(`[Presence] Cleared presence token for user ${userId}`);
    }
}

module.exports = { createPresence, refreshPresence, clearPresence };
