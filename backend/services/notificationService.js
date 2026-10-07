const pool = require("../config/db");

/**
 * Dispatch notifications to all relevant donors and blood banks when a blood request is submitted.
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
        const reqPhone = contact_phone || 'Emergency Contact';
        const reqPatient = patient_name || 'Patient';

        let title, message, type;
        if (emergency) {
            type = 'emergency_request';
            title = `🚨 URGENT EMERGENCY BLOOD NEEDED: ${blood_group}`;
            message = `CRITICAL ALERT: ${reqUnits} unit(s) of ${blood_group} blood urgently requested for ${reqPatient} at ${reqHospital} (${reqLocation}). Emergency Phone: ${reqPhone}. Please respond immediately!`;
        } else {
            type = 'normal_request';
            title = `🩸 New Blood Request: ${blood_group}`;
            message = `Request for ${reqUnits} unit(s) of ${blood_group} blood for ${reqPatient} at ${reqHospital}, ${reqLocation}. Contact: ${reqPhone}.`;
        }

        // 1. Get Donors matching blood_group (or all donors if emergency)
        let donorQuery;
        let donorParams = [];
        if (emergency) {
            // For emergency, notify matching blood group donors as priority + all available donors
            donorQuery = `
                SELECT DISTINCT u.user_id 
                FROM users u
                JOIN donors d ON u.user_id = d.user_id
                WHERE (d.blood_group = $1 OR d.is_available = true)
            `;
            donorParams = [blood_group];
        } else {
            donorQuery = `
                SELECT DISTINCT u.user_id 
                FROM users u
                JOIN donors d ON u.user_id = d.user_id
                WHERE d.blood_group = $1
            `;
            donorParams = [blood_group];
        }

        const donorRes = await pool.query(donorQuery, donorParams);

        // 2. Get all Blood Bank users
        const bankRes = await pool.query(
            "SELECT user_id FROM users WHERE role = 'blood_bank'"
        );

        // 3. Get Admin users so admins are also notified
        const adminRes = await pool.query(
            "SELECT user_id FROM users WHERE role = 'admin'"
        );

        // Combine all unique target user_ids
        const targetUserIds = new Set([
            ...donorRes.rows.map(r => r.user_id),
            ...bankRes.rows.map(r => r.user_id),
            ...adminRes.rows.map(r => r.user_id)
        ]);

        console.log(`Sending ${type} notifications to ${targetUserIds.size} users for request #${request_id}`);

        // Batch insert notifications
        for (const userId of targetUserIds) {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, request_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, title, message, type, request_id]
            );
        }

    } catch (err) {
        console.error("Error in notifyDonorsAndBanks:", err);
    }
};

module.exports = {
    notifyDonorsAndBanks
};
