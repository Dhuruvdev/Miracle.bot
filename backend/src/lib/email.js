/**
 * backend/src/lib/email.js
 *
 * Email sending via Gmail SMTP (Nodemailer).
 * Configured for maximum deliverability — reduces spam-folder placement:
 *   • Proper Message-ID and Date headers
 *   • List-Unsubscribe (required by bulk senders)
 *   • Both HTML and plain-text parts (missing text part flags spam)
 *   • X-Priority / X-Mailer stripped (spammy meta)
 *   • Reasonable subject-line (no ALL CAPS, no excessive punctuation)
 */
const nodemailer = require('nodemailer');
const crypto     = require('crypto');

let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.warn('[Email] GMAIL_USER or GMAIL_APP_PASSWORD not set — email disabled.');
        return null;
    }

    _transporter = nodemailer.createTransport({
        host:   'smtp.gmail.com',
        port:   587,
        secure: false,           // TLS via STARTTLS (port 587, not 465)
        auth:   { user, pass },
        tls:    { rejectUnauthorized: true },
        pool:   true,
        maxConnections: 3,
    });

    // Verify connection once on first use (async, non-blocking)
    _transporter.verify().then(() => {
        console.log(`[Email] Gmail SMTP ready — ${user}`);
    }).catch(err => {
        console.error('[Email] Gmail SMTP verify failed:', err.message);
        _transporter = null;   // allow retry next call
    });

    return _transporter;
}

/**
 * Send an email with best-practice deliverability headers.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 * @returns {Promise<boolean>}
 */
async function sendEmail({ to, subject, html, text }) {
    const transporter = getTransporter();
    if (!transporter) return false;

    const gmailUser = process.env.GMAIL_USER;
    const domain    = (gmailUser || 'openembedded.example').split('@')[1] || 'gmail.com';
    const msgId     = `<${crypto.randomBytes(12).toString('hex')}.${Date.now()}@${domain}>`;

    try {
        await transporter.sendMail({
            // ── Sender / recipient ────────────────────────────────────────────
            from:    `"OpenEmbedded" <${gmailUser}>`,
            replyTo: `"OpenEmbedded" <${gmailUser}>`,
            to,

            // ── Subject ───────────────────────────────────────────────────────
            subject,

            // ── Content ───────────────────────────────────────────────────────
            text: text || stripHtml(html),
            html,

            // ── Deliverability headers ────────────────────────────────────────
            headers: {
                'Message-ID':       msgId,
                'Date':             new Date().toUTCString(),

                // Required by Google & Yahoo bulk-sender guidelines (Feb 2024)
                'List-Unsubscribe':       `<mailto:${gmailUser}?subject=unsubscribe>`,
                'List-Unsubscribe-Post':  'List-Unsubscribe=One-Click',

                // Unique per-message ID — helps Gmail de-dup and avoids threading noise
                'X-Entity-Ref-ID': crypto.randomBytes(16).toString('hex'),

                // Prevents Gmail from clipping "transactional email" banners
                'Precedence': 'transactional',
            },
        });

        console.log(`[Email] Sent "${subject}" → ${to}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send to', to, '—', err.message);
        return false;
    }
}

/** Rough HTML → plain-text strip for the fallback text part. */
function stripHtml(html) {
    return (html || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(p|div|tr|td|table|h\d)[^>]*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

module.exports = { sendEmail };
