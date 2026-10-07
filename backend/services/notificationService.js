const pool = require("../config/db");
const { sendSMS, sendBulkSMS } = require("./smsService");

/**
 * Dispatch notifications (in-app + SMS) to all relevant donors and blood banks
 * when a blood request is submitted.
 */
const notifyDonorsAndBanks = async (requestData) => {
    try {
        const {
            request_id,
            blood_group,
            units_required,
            emergency,
            hospital_name,
            patient_name,
            contact_phone,
            location
        } = requestData;

        const reqUnits = units_required || 1;
        const reqHospital = hospital_name || 'Emergency Medical Center';
        const reqLocation = location || 'City Center';
        const reqPhone = contact_phone || 'N/A';
        const reqPatient = patient_name || 'Patient';

        let title, message, smsMessage, type;
        if (emergency) {
            type = 'emergency_request';
            title = `🚨 URGENT EMERGENCY BLOOD NEEDED: ${blood_group}`;
            message = `CRITICAL ALERT: ${reqUnits} unit(s) of ${blood_group} blood urgently requested for ${reqPatient} at ${reqHospital} (${reqLocation}). Emergency Phone: ${reqPhone}. Please respond immediately!`;
            smsMessage = `🚨 BLOOD BRIDGE EMERGENCY ALERT\n${reqUnits} unit(s) of ${blood_group} blood URGENTLY needed for ${reqPatient}.\nHospital: ${reqHospital}, ${reqLocation}\nContact: ${reqPhone}\nPlease respond immediately! - BloodBridge`;
        } else {
            type = 'normal_request';
            title = `🩸 New Blood Request: ${blood_group}`;
            message = `Request for ${reqUnits} unit(s) of ${blood_group} blood for ${reqPatient} at ${reqHospital}, ${reqLocation}. Contact: ${reqPhone}.`;
            smsMessage = `🩸 BLOOD BRIDGE REQUEST\n${reqUnits} unit(s) of ${blood_group} blood needed for ${reqPatient}.\nHospital: ${reqHospital}, ${reqLocation}\nContact: ${reqPhone}\n- BloodBridge`;
        }

        // 1. Get Donors matching blood_group (or all available donors if emergency)
        let donorQuery;
        let donorParams = [];
        if (emergency) {
            donorQuery = `
                SELECT DISTINCT u.user_id, u.phone
                FROM users u
                JOIN donors d ON u.user_id = d.user_id
                WHERE (d.blood_group = $1 OR d.is_available = true)
            `;
            donorParams = [blood_group];
        } else {
            donorQuery = `
                SELECT DISTINCT u.user_id, u.phone
                FROM users u
                JOIN donors d ON u.user_id = d.user_id
                WHERE d.blood_group = $1
            `;
            donorParams = [blood_group];
        }

        const donorRes = await pool.query(donorQuery, donorParams);

        // 2. Get all Blood Bank users
        const bankRes = await pool.query(
            "SELECT user_id, phone FROM users WHERE role = 'blood_bank'"
        );

        // 3. Get Admin users so admins are also notified
        const adminRes = await pool.query(
            "SELECT user_id, phone FROM users WHERE role = 'admin'"
        );

        // Build a map of user_id → phone for SMS sending
        const phoneMap = new Map();
        for (const row of [...donorRes.rows, ...bankRes.rows, ...adminRes.rows]) {
            if (row.phone && !phoneMap.has(row.user_id)) {
                phoneMap.set(row.user_id, row.phone);
            }
        }

        // Combine all unique target user_ids
        const targetUserIds = new Set([
            ...donorRes.rows.map(r => r.user_id),
            ...bankRes.rows.map(r => r.user_id),
            ...adminRes.rows.map(r => r.user_id)
        ]);

        console.log(`Sending ${type} notifications to ${targetUserIds.size} users for request #${request_id}`);

        // Batch insert in-app notifications
        for (const userId of targetUserIds) {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, request_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, title, message, type, request_id]
            );
        }

        // Send SMS to all recipients who have a phone number (async, non-blocking)
        const smsRecipients = Array.from(phoneMap.values())
            .filter(Boolean)
            .map(phone => ({ phone, message: smsMessage }));

        if (smsRecipients.length > 0) {
            console.log(`[SMS] Sending ${type} SMS to ${smsRecipients.length} recipients...`);
            // Fire-and-forget (don't block the HTTP response)
            sendBulkSMS(smsRecipients).catch(err =>
                console.error("[SMS] Bulk SMS error:", err)
            );
        }

    } catch (err) {
        console.error("Error in notifyDonorsAndBanks:", err);
    }
};

/**
 * Notify a specific donor via SMS when someone requests them directly.
 * @param {object} options
 * @param {number} options.donorUserId - user_id of the donor being contacted
 * @param {string} options.requesterName - Name of the person making the request
 * @param {string} options.bloodGroup - Required blood group
 * @param {string} options.contactPhone - Requester's contact number
 * @param {string} options.hospitalName - Hospital name
 * @param {string} options.location - Location / city
 * @param {number} options.requestId - Blood request ID
 */
const notifySpecificDonor = async ({
    donorUserId,
    requesterName,
    bloodGroup,
    contactPhone,
    hospitalName,
    location,
    requestId
}) => {
    try {
        const userRes = await pool.query(
            "SELECT phone, full_name FROM users WHERE user_id = $1",
            [donorUserId]
        );

        if (userRes.rows.length === 0) return;

        const donor = userRes.rows[0];
        const reqHospital = hospitalName || 'a hospital';
        const reqLocation = location || 'your area';

        const inAppTitle = `🩸 Blood Request Directed to You`;
        const inAppMessage = `${requesterName || 'Someone'} has specifically requested your ${bloodGroup} blood donation at ${reqHospital}, ${reqLocation}. Contact: ${contactPhone || 'N/A'}.`;
        const smsText = `🩸 BLOOD BRIDGE - Personal Blood Request\nHello ${donor.full_name || 'Donor'}, ${requesterName || 'Someone'} is specifically requesting YOUR ${bloodGroup} blood donation.\nHospital: ${reqHospital}, ${reqLocation}\nContact them: ${contactPhone || 'N/A'}\nPlease help save a life! - BloodBridge`;

        // Insert in-app notification
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, request_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [donorUserId, inAppTitle, inAppMessage, 'direct_request', requestId || null]
        );

        // Send SMS to the specific donor
        if (donor.phone) {
            sendSMS(donor.phone, smsText).catch(err =>
                console.error("[SMS] Direct donor SMS error:", err)
            );
        }

    } catch (err) {
        console.error("Error in notifySpecificDonor:", err);
    }
};

/**
 * Notify a recipient via SMS when their blood request status changes.
 * @param {object} options
 * @param {number} options.requestId
 * @param {number} options.recipientUserId
 * @param {string} options.newStatus - 'APPROVED', 'REJECTED', 'FULFILLED', etc.
 * @param {string} [options.bloodGroup]
 * @param {string} [options.rejectedReason]
 * @param {string} [options.bankName] - Blood bank that responded
 */
const notifyRequestStatusChange = async ({
    requestId,
    recipientUserId,
    newStatus,
    bloodGroup,
    rejectedReason,
    bankName
}) => {
    try {
        const userRes = await pool.query(
            "SELECT phone, full_name FROM users WHERE user_id = $1",
            [recipientUserId]
        );

        if (userRes.rows.length === 0) return;

        const user = userRes.rows[0];
        const status = (newStatus || '').toUpperCase();

        let inAppTitle, inAppMessage, smsText;

        if (status === 'APPROVED' || status === 'FULFILLED') {
            inAppTitle = `✅ Blood Request ${status === 'FULFILLED' ? 'Fulfilled' : 'Approved'}`;
            inAppMessage = `Great news! Your ${bloodGroup || ''} blood request #${requestId} has been ${status === 'FULFILLED' ? 'fulfilled' : 'approved'}${bankName ? ` by ${bankName}` : ''}.`;
            smsText = `✅ BLOOD BRIDGE UPDATE\nHello ${user.full_name || 'User'}, your ${bloodGroup || ''} blood request has been ${status === 'FULFILLED' ? 'FULFILLED' : 'APPROVED'}${bankName ? ` by ${bankName}` : ''}. Please check the app for details. - BloodBridge`;
        } else if (status === 'REJECTED') {
            inAppTitle = `❌ Blood Request Rejected`;
            inAppMessage = `Your ${bloodGroup || ''} blood request #${requestId} was rejected${bankName ? ` by ${bankName}` : ''}${rejectedReason ? `: ${rejectedReason}` : ''}. Please try another blood bank.`;
            smsText = `❌ BLOOD BRIDGE UPDATE\nHello ${user.full_name || 'User'}, your ${bloodGroup || ''} blood request was REJECTED${rejectedReason ? ` (${rejectedReason})` : ''}. Please try again or contact another blood bank. - BloodBridge`;
        } else {
            inAppTitle = `🔄 Blood Request Status Update`;
            inAppMessage = `Your blood request #${requestId} status has changed to: ${newStatus}.`;
            smsText = `🔄 BLOOD BRIDGE UPDATE\nHello ${user.full_name || 'User'}, your blood request status is now: ${newStatus}. Check the app for details. - BloodBridge`;
        }

        // Insert in-app notification
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, request_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [recipientUserId, inAppTitle, inAppMessage, 'status_update', requestId]
        );

        // Send SMS
        if (user.phone) {
            sendSMS(user.phone, smsText).catch(err =>
                console.error("[SMS] Status change SMS error:", err)
            );
        }

    } catch (err) {
        console.error("Error in notifyRequestStatusChange:", err);
    }
};

module.exports = {
    notifyDonorsAndBanks,
    notifySpecificDonor,
    notifyRequestStatusChange
};
