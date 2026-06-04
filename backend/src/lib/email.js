/**
 * backend/src/lib/email.js
 *
 * Email sending via Gmail SMTP (Nodemailer).
 * Sends both HTML and plain-text parts to avoid spam filters.
 */
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        console.warn('[Email] ⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set — emails disabled.');
        return null;
    }

    _transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
    });

    console.log(`[Email] Gmail SMTP configured for: ${user}`);
    return _transporter;
}

/**
 * Send an email with both HTML and plain-text parts.
 * @param {{ to: string, subject: string, html: string, text: string }} opts
 */
async function sendEmail({ to, subject, html, text }) {
    const transporter = getTransporter();
    if (!transporter) return false;

    try {
        const gmailUser = process.env.GMAIL_USER;
        await transporter.sendMail({
            from:     `"OpenEmbedded" <${gmailUser}>`,
            replyTo:  gmailUser,
            to,
            subject,
            text:     text || stripHtml(html),
            html,
            headers: {
                'X-Entity-Ref-ID': `openembedded-${Date.now()}`,
                'List-Unsubscribe': `<mailto:${gmailUser}?subject=unsubscribe>`,
            },
        });
        console.log(`[Email] Sent "${subject}" → ${to}`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send:', err.message);
        return false;
    }
}

/** Rough HTML → plain text strip for fallback. */
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
