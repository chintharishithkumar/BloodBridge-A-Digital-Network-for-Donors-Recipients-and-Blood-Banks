 /**
 * Telegram Notification Service (100% Free, No Limits)
 *
 * Setup for College Project:
 *  1. Open Telegram, search for @BotFather, and send /newbot
 *  2. Follow steps and copy the HTTP API Token
 *  3. Search for @userinfobot in Telegram and click Start to get your numeric Chat ID
 *  4. Add to .env:
 *       TELEGRAM_BOT_TOKEN=your_bot_token_here
 *       TELEGRAM_CHAT_ID=your_chat_id_here
 *
 *  (For the demo, all alerts will be sent to this Chat ID)
 */

require("dotenv").config();
const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Normalizes phone number (Not used for Telegram, but kept for compatibility with notificationService.js)
 */
const normalizePhone = (phone) => phone;

/**
 * Send a Telegram message.
 * @param {string} toPhone - Ignored for this demo, we send everything to the global TELEGRAM_CHAT_ID
 * @param {string} message  - The alert text
 * @returns {Promise<boolean>}
 */
const sendSMS = async (toPhone, message) => {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log("[Telegram] Not configured — add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env");
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "HTML"
        });

        console.log(`[Telegram] ✅ Alert sent to Telegram Chat ID: ${TELEGRAM_CHAT_ID}`);
        return true;
    } catch (err) {
        console.error(`[Telegram] ❌ Failed to send: ${err.response?.data?.description || err.message}`);
        return false;
    }
};

/**
 * Send Bulk Telegram Messages.
 * @param {Array<{phone: string, message: string}>} recipients
 */
const sendBulkSMS = async (recipients) => {
    if (!recipients || recipients.length === 0) return;

    // For the demo, we just send ONE message to the group instead of spamming it for every "recipient"
    // We pick the first message from the recipients array
    const message = recipients[0].message;
    await sendSMS(null, message);
};

module.exports = {
    sendSMS,
    sendBulkSMS,
    normalizePhone
};
