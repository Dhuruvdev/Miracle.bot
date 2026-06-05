/**
 * backend/src/lib/initDb.js
 *
 * Ensures all required tables exist in whichever database is configured
 * (NEON_DATABASE_URL or DATABASE_URL). Runs at server startup.
 *
 * Safe to run multiple times — all statements use CREATE TABLE IF NOT EXISTS.
 */
const postgres = require('postgres');

async function initDb() {
    const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
        console.warn('[DB] No database URL configured — skipping schema init');
        return;
    }

    const sql = postgres(dbUrl, { max: 1, idle_timeout: 10 });
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS button_actions (
                custom_id  TEXT PRIMARY KEY,
                steps      JSONB                    NOT NULL DEFAULT '[]',
                updated_at TIMESTAMPTZ              NOT NULL DEFAULT NOW()
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS verification_tokens (
                token      TEXT PRIMARY KEY,
                email      TEXT                     NOT NULL,
                expires_at TIMESTAMPTZ              NOT NULL,
                used       BOOLEAN                  NOT NULL DEFAULT FALSE
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS sent_messages (
                id            TEXT PRIMARY KEY,
                channel_id    TEXT                  NOT NULL,
                guild_id      TEXT,
                payload       JSONB                 NOT NULL,
                sent_at       TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
                sent_by_email TEXT
            )
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS sessions (
                id         TEXT PRIMARY KEY,
                email      TEXT                     NOT NULL,
                created_at TIMESTAMPTZ              NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMPTZ              NOT NULL,
                active     BOOLEAN                  NOT NULL DEFAULT TRUE
            )
        `;

        console.log('[DB] Schema initialised — all required tables exist');
    } catch (err) {
        console.error('[DB] Schema init failed:', err.message);
    } finally {
        await sql.end().catch(() => {});
    }
}

module.exports = { initDb };
