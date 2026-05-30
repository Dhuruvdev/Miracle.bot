/**
 * Vercel Serverless entry point.
 * Exports the Express app — Vercel's Node.js runtime uses it as a request handler.
 *
 * Note: The Discord Gateway WebSocket bot feature requires a persistent connection
 * and does not work reliably in a serverless environment. Webhook sending, live
 * preview, and code generation work fully.
 */
module.exports = require('../server/src/index');
