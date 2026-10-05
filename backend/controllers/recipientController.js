const pool = require("../config/db");

// Search both available donors and blood bank inventories
const searchBlood = async (req, res) => {
    try {
        const { blood_group, city } = req.query;

        // Query Donors
        let donorQuery = `
            SELECT
                d.donor_id,
                u.full_name,
                u.phone,
                u.city,
                u.state,
                d.blood_group,
                d.is_available,
                d.last_donation_date
            FROM donors d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.is_available = true
        `;
        const donorValues = [];
        if (blood_group) {
            donorValues.push(blood_group);
            donorQuery += ` AND d.blood_group = $${donorValues.length}`;
        }
        if (city) {
            donorValues.push(city);
            donorQuery += ` AND LOWER(u.city) LIKE LOWER($${donorValues.length})`;
        }
        donorQuery += " ORDER BY d.donor_id DESC";

        const donorRes = await pool.query(donorQuery, donorValues);

        // Query Blood Banks & Inventory
        let bankQuery = `
            SELECT
                bi.inventory_id,
                bb.blood_bank_id,
                bb.bank_name,
                bb.city,
                bb.state,
                bb.address,
                u.phone as contact_phone,
                bi.blood_group,
                bi.units_available,
                bi.last_updated
            FROM blood_inventory bi
            JOIN blood_banks bb ON bi.blood_bank_id = bb.blood_bank_id
            JOIN users u ON bb.user_id = u.user_id
            WHERE bi.units_available > 0
        `;
        const bankValues = [];
        if (blood_group) {
            bankValues.push(blood_group);
            bankQuery += ` AND bi.blood_group = $${bankValues.length}`;
        }
        if (city) {
            bankValues.push(city);
            bankQuery += ` AND LOWER(bb.city) LIKE LOWER($${bankValues.length})`;
        }
        bankQuery += " ORDER BY bi.units_available DESC";

        const bankRes = await pool.query(bankQuery, bankValues);

        res.json({
            status: "success",
            donorsCount: donorRes.rows.length,
            donors: donorRes.rows,
            bloodBanksCount: bankRes.rows.length,
            bloodBanks: bankRes.rows
        });

    } catch (error) {
        console.error("Search blood error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Submit a blood request
const createRequest = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            blood_bank_id, blood_group, units_required,
            emergency, required_by, notes,
            hospital_name, patient_name
        } = req.body;

        if (!blood_group || !units_required) {
            return res.status(400).json({
                status: "error",
                message: "Blood group and units required are mandatory"
            });
        }

        // Check or create recipient record
        let recipientRes = await pool.query(
            "SELECT recipient_id FROM recipients WHERE user_id = $1",
            [userId]
        );

        let recipientId;
        if (recipientRes.rows.length === 0) {
            const newRec = await pool.query(
                `INSERT INTO recipients (user_id, blood_group, medical_reason, hospital_name)
                 VALUES ($1, $2, $3, $4)
                 RETURNING recipient_id`,
                [userId, blood_group, notes || 'Blood request', hospital_name || null]
            );
            recipientId = newRec.rows[0].recipient_id;
        } else {
            recipientId = recipientRes.rows[0].recipient_id;
        }

        const result = await pool.query(
            `INSERT INTO blood_requests
            (recipient_id, blood_bank_id, blood_group, units_required,
             request_date, status, emergency, required_by, notes,
             hospital_name, patient_name)
            VALUES ($1, $2, $3, $4, NOW(), 'PENDING', $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                recipientId,
                blood_bank_id || null,
                blood_group,
                units_required,
                emergency || false,
                required_by || null,
                notes || '',
                hospital_name || null,
                patient_name || null
            ]
        );

        res.status(201).json({
            status: "success",
            message: "Blood request submitted successfully",
            request: result.rows[0]
        });

    } catch (error) {
        console.error("Create blood request error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get requests by current logged in recipient
const getMyRequests = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const recipientRes = await pool.query(
            "SELECT recipient_id FROM recipients WHERE user_id = $1",
            [userId]
        );

        if (recipientRes.rows.length === 0) {
            return res.json({ status: "success", requests: [] });
        }

        const recipientId = recipientRes.rows[0].recipient_id;

        const result = await pool.query(
            `SELECT
                br.request_id,
                br.blood_group,
                br.units_required,
                br.request_date,
                br.status,
                br.emergency,
                br.required_by,
                br.notes,
                br.hospital_name,
                br.patient_name,
                br.fulfilled_date,
                br.rejected_reason,
                bb.bank_name,
                bb.city as bank_city,
                bb.phone as bank_phone
             FROM blood_requests br
             LEFT JOIN blood_banks bb ON br.blood_bank_id = bb.blood_bank_id
             WHERE br.recipient_id = $1
             ORDER BY br.request_date DESC`,
            [recipientId]
        );

        res.json({
            status: "success",
            requests: result.rows
        });

    } catch (error) {
        console.error("Get my requests error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get recipient profile
const getRecipientProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let result = await pool.query(
            `SELECT
                r.recipient_id, r.user_id, u.full_name, u.email, u.phone, u.city, u.state,
                r.blood_group, r.medical_reason, r.hospital_name, r.doctor_name,
                r.contact_person, r.contact_phone, r.recipient_name
             FROM users u
             LEFT JOIN recipients r ON u.user_id = r.user_id
             WHERE u.user_id = $1`,
            [userId]
        );

        if (result.rows.length > 0 && !result.rows[0].recipient_id) {
            const userRow = result.rows[0];
            await pool.query(
                `INSERT INTO recipients (user_id, blood_group, recipient_name)
                 VALUES ($1, 'O+', $2)
                 ON CONFLICT (user_id) DO NOTHING`,
                [userId, userRow.full_name]
            );
            result = await pool.query(
                `SELECT
                    r.recipient_id, r.user_id, u.full_name, u.email, u.phone, u.city, u.state,
                    r.blood_group, r.medical_reason, r.hospital_name, r.doctor_name,
                    r.contact_person, r.contact_phone, r.recipient_name
                 FROM recipients r
                 JOIN users u ON r.user_id = u.user_id
                 WHERE r.user_id = $1`,
                [userId]
            );
        }

        res.json({
            status: "success",
            recipient: result.rows[0]
        });

    } catch (error) {
        console.error("Get recipient profile error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Update recipient profile
const updateRecipientProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            full_name, phone, city, state,
            blood_group, medical_reason,
            hospital_name, doctor_name,
            contact_person, contact_phone
        } = req.body;

        if (full_name || phone || city || state) {
            await pool.query(
                `UPDATE users
                 SET full_name = COALESCE(NULLIF($1, ''), full_name),
                     phone = COALESCE(NULLIF($2, ''), phone),
                     city = COALESCE(NULLIF($3, ''), city),
                     state = COALESCE(NULLIF($4, ''), state)
                 WHERE user_id = $5`,
                [full_name || null, phone || null, city || null, state || null, userId]
            );
        }

        await pool.query(
            `INSERT INTO recipients
             (user_id, blood_group, medical_reason, hospital_name, doctor_name, contact_person, contact_phone, recipient_name)
             VALUES ($1, COALESCE($2, 'O+'), $3, $4, $5, $6, $7, $8)
             ON CONFLICT (user_id) DO UPDATE SET
                 blood_group     = COALESCE(EXCLUDED.blood_group, recipients.blood_group),
                 medical_reason  = COALESCE(EXCLUDED.medical_reason, recipients.medical_reason),
                 hospital_name   = COALESCE(EXCLUDED.hospital_name, recipients.hospital_name),
                 doctor_name     = COALESCE(EXCLUDED.doctor_name, recipients.doctor_name),
                 contact_person  = COALESCE(EXCLUDED.contact_person, recipients.contact_person),
                 contact_phone   = COALESCE(EXCLUDED.contact_phone, recipients.contact_phone),
                 recipient_name  = COALESCE(EXCLUDED.recipient_name, recipients.recipient_name)`,
            [
                userId, blood_group || null, medical_reason || null,
                hospital_name || null, doctor_name || null,
                contact_person || null, contact_phone || null,
                full_name || null
            ]
        );

        res.json({
            status: "success",
            message: "Recipient profile updated successfully"
        });

    } catch (error) {
        console.error("Update recipient profile error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get available cities dynamically (with optional blood_group filter)
const getCities = async (req, res) => {
    try {
        const { blood_group } = req.query;

        let query;
        let params = [];

        if (blood_group) {
            query = `
                SELECT DISTINCT city FROM (
                    SELECT u.city FROM donors d JOIN users u ON d.user_id = u.user_id WHERE d.is_available = true AND d.blood_group = $1 AND u.city IS NOT NULL AND TRIM(u.city) != ''
                    UNION
                    SELECT bb.city FROM blood_inventory bi JOIN blood_banks bb ON bi.blood_bank_id = bb.blood_bank_id WHERE bi.units_available > 0 AND bi.blood_group = $1 AND bb.city IS NOT NULL AND TRIM(bb.city) != ''
                    UNION
                    SELECT u.city FROM users u WHERE u.city IS NOT NULL AND TRIM(u.city) != ''
                ) cities
                ORDER BY city ASC
            `;
            params = [blood_group];
        } else {
            query = `
                SELECT DISTINCT city FROM (
                    SELECT city FROM users WHERE city IS NOT NULL AND TRIM(city) != ''
                    UNION
                    SELECT city FROM blood_banks WHERE city IS NOT NULL AND TRIM(city) != ''
                ) cities
                ORDER BY city ASC
            `;
        }

        const result = await pool.query(query, params);
        let cities = result.rows.map(r => r.city).filter(Boolean);

        // Default cities list fallback
        const defaultCities = ["Hyderabad", "Mumbai", "Delhi", "Bengaluru", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"];
        const citySet = new Set([...cities, ...defaultCities]);
        const sortedCities = Array.from(citySet).sort();

        res.json({
            status: "success",
            cities: sortedCities
        });
    } catch (error) {
        console.error("Get cities error:", error);
        res.status(500).json({ status: "error", message: "Server error fetching cities" });
    }
};

module.exports = {
    searchBlood,
    createRequest,
    getMyRequests,
    getRecipientProfile,
    updateRecipientProfile,
    getCities
};

