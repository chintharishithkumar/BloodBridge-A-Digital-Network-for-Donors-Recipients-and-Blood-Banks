/**
 * WhatsApp Service using Twilio Sandbox (Free for testing/college projects)
 *
 * Setup:
 *  1. Sign up at twilio.com and go to the Console
 *  2. Go to Messaging > Try it out > Send a WhatsApp message
 *  3. Get your Account SID, Auth Token, and the Twilio Sandbox Number
 *  4. Add to .env:
 *       TWILIO_ACCOUNT_SID=...
 *       TWILIO_AUTH_TOKEN=...
 *       TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 (or whatever number they give you)
 */

require("dotenv").config();
const twilio = require("twilio");

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let client = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Normalize a phone number to Twilio WhatsApp format.
 * Twilio expects: whatsapp:+91XXXXXXXXXX
 * @param {string} phone
 * @returns {string|null}
 */
const normalizePhone = (phone) => {
    if (!phone) return null;

    // Strip all non-digit characters
    let digits = phone.replace(/\D/g, "");

    // If it's a 10 digit Indian number, add 91
    if (digits.length === 10) {
        digits = "91" + digits;
    }

    // Must be exactly 12 digits for Indian mobile with country code
    if (digits.length >= 10) {
        return `whatsapp:+${digits}`;
    }
    
    return null;
};

/**
 * Send a WhatsApp message via Twilio.
 * @param {string} toPhone - Recipient phone number
 * @param {string} message  - WhatsApp body text
 * @returns {Promise<boolean>}
 */
const sendSMS = async (toPhone, message) => {
    if (!client) {
        console.log("[WhatsApp] Twilio not configured — add TWILIO variables to .env");
        return false;
    }

    const normalizedPhone = normalizePhone(toPhone);
    if (!normalizedPhone) {
        console.warn(`[WhatsApp] Invalid phone number: ${toPhone} — skipping.`);
        return false;
    }

    try {
        const response = await client.messages.create({
            from: TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
            to: normalizedPhone,
            body: message
        });

        console.log(`[WhatsApp] ✅ Sent to ${normalizedPhone} — SID: ${response.sid}`);
        return true;
    } catch (err) {
        console.error(`[WhatsApp] ❌ Failed to send to ${normalizedPhone}: ${err.message}`);
        // Often fails if user hasn't opted-in to the sandbox yet
        return false;
    }
};

/**
 * Send WhatsApp to multiple recipients in parallel.
 * @param {Array<{phone: string, message: string}>} recipients
 */
const sendBulkSMS = async (recipients) => {
    if (!recipients || recipients.length === 0) return;

    if (!client) {
        console.log("[WhatsApp] Twilio not configured — skipping bulk send.");
        return;
    }

    let totalSent = 0;
    
    // Twilio doesn't have a single bulk API endpoint for WhatsApp sandbox,
    // so we just fire them off in parallel.
    const promises = recipients.map(async ({ phone, message }) => {
        const success = await sendSMS(phone, message);
        if (success) totalSent++;
    });

    await Promise.all(promises);
    
    console.log(`[WhatsApp] Bulk send complete: ~${totalSent}/${recipients.length} messages delivered.`);
};

module.exports = {
    sendSMS,
    sendBulkSMS,
    normalizePhone
};
