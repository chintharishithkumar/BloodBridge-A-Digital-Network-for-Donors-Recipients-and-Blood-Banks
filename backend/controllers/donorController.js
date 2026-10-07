const pool = require("../config/db");

// Get donor profile
const getDonorProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        let result = await pool.query(
            `SELECT
                d.donor_id,
                d.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.city,
                u.state,
                d.blood_group,
                d.date_of_birth,
                d.gender,
                d.last_donation_date,
                d.is_available,
                d.weight_kg,
                d.medical_conditions,
                d.next_eligible_date,
                d.total_donations,
                d.id_proof_number,
                d.donor_name
             FROM users u
             LEFT JOIN donors d ON u.user_id = d.user_id
             WHERE u.user_id = $1`,
            [userId]
        );

        if (result.rows.length > 0 && !result.rows[0].donor_id) {
            // Auto-create donor record for this user
            const userRow = result.rows[0];
            await pool.query(
                `INSERT INTO donors (user_id, blood_group, donor_name, is_available)
                 VALUES ($1, 'O+', true, $2)
                 ON CONFLICT (user_id) DO NOTHING`,
                [userId, userRow.full_name]
            );
            // Re-fetch
            result = await pool.query(
                `SELECT
                    d.donor_id, d.user_id, u.full_name, u.email, u.phone, u.city, u.state,
                    d.blood_group, d.date_of_birth, d.gender, d.last_donation_date, d.is_available,
                    d.weight_kg, d.medical_conditions, d.next_eligible_date, d.total_donations,
                    d.id_proof_number, d.donor_name
                 FROM donors d
                 JOIN users u ON d.user_id = u.user_id
                 WHERE d.user_id = $1`,
                [userId]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Donor profile not found"
            });
        }

        res.json({
            status: "success",
            donor: result.rows[0]
        });

    } catch (error) {
        console.error("Get donor error:", error);

        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};


// Create donor profile
const createDonorProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const {
            blood_group, date_of_birth, gender, is_available,
            weight_kg, medical_conditions, id_proof_number
        } = req.body;

        if (!blood_group || !date_of_birth || !gender) {
            return res.status(400).json({
                status: "error",
                message: "Blood group, date of birth and gender are required"
            });
        }

        const existing = await pool.query(
            "SELECT * FROM donors WHERE user_id = $1",
            [userId]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                status: "error",
                message: "Donor profile already exists"
            });
        }

        // Fetch full_name from users table to store as donor_name
        const userRes = await pool.query(
            "SELECT full_name FROM users WHERE user_id = $1",
            [userId]
        );
        const donorName = userRes.rows.length > 0 ? userRes.rows[0].full_name : null;

        const nextEligible = new Date();
        nextEligible.setDate(nextEligible.getDate() + 90);
        const nextEligibleStr = nextEligible.toISOString().split('T')[0];

        const result = await pool.query(
            `INSERT INTO donors
            (user_id, blood_group, date_of_birth, gender, is_available,
             weight_kg, medical_conditions, id_proof_number,
             next_eligible_date, total_donations, donor_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10)
            RETURNING *`,
            [
                userId,
                blood_group,
                date_of_birth,
                gender,
                is_available ?? true,
                weight_kg || null,
                medical_conditions || null,
                id_proof_number || null,
                nextEligibleStr,
                donorName
            ]
        );

        res.status(201).json({
            status: "success",
            message: "Donor profile created",
            donor: result.rows[0]
        });

    } catch (error) {
        console.error("Create donor error:", error);

        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};


// Update donor availability
const updateAvailability = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { is_available } = req.body;

        if (typeof is_available !== "boolean") {
            return res.status(400).json({
                status: "error",
                message: "is_available must be true or false"
            });
        }

        const result = await pool.query(
            `UPDATE donors
             SET is_available = $1
             WHERE user_id = $2
             RETURNING *`,
            [is_available, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Donor profile not found"
            });
        }

        res.json({
            status: "success",
            message: "Availability updated",
            donor: result.rows[0]
        });

    } catch (error) {
        console.error("Update availability error:", error);

        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};


// Get available donors
const getAvailableDonors = async (req, res) => {
    try {
        const { blood_group, city } = req.query;

        let query = `
            SELECT
                d.donor_id,
                u.full_name,
                u.phone,
                u.city,
                u.state,
                d.blood_group,
                d.is_available
            FROM donors d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.is_available = true
        `;

        const values = [];

        if (blood_group) {
            values.push(blood_group);
            query += ` AND d.blood_group = $${values.length}`;
        }

        if (city) {
            values.push(city);
            query += ` AND LOWER(u.city) = LOWER($${values.length})`;
        }

        query += " ORDER BY d.donor_id DESC";

        const result = await pool.query(query, values);

        res.json({
            status: "success",
            count: result.rows.length,
            donors: result.rows
        });

    } catch (error) {
        console.error("Get donors error:", error);

        res.status(500).json({
            status: "error",
            message: "Server error"
        });
    }
};


// Get donor donation history
const getDonationHistory = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const donorRes = await pool.query(
            "SELECT donor_id FROM donors WHERE user_id = $1",
            [userId]
        );

        if (donorRes.rows.length === 0) {
            return res.json({ status: "success", donations: [] });
        }

        const donorId = donorRes.rows[0].donor_id;

        const result = await pool.query(
            `SELECT
                dn.donation_id,
                dn.donation_date,
                dn.blood_group,
                dn.units_donated,
                bb.bank_name,
                bb.city
             FROM donations dn
             LEFT JOIN blood_banks bb ON dn.blood_bank_id = bb.blood_bank_id
             WHERE dn.donor_id = $1
             ORDER BY dn.donation_date DESC`,
            [donorId]
        );

        res.json({
            status: "success",
            donations: result.rows
        });

    } catch (error) {
        console.error("Get donation history error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Log a new donation for donor
const logDonation = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { blood_bank_id, donation_date, units_donated, blood_group } = req.body;

        const donorRes = await pool.query(
            "SELECT donor_id, blood_group FROM donors WHERE user_id = $1",
            [userId]
        );

        if (donorRes.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Donor profile not found" });
        }

        const donor = donorRes.rows[0];
        const bg = blood_group || donor.blood_group;

        const result = await pool.query(
            `INSERT INTO donations (donor_id, blood_bank_id, donation_date, blood_group, units_donated)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                donor.donor_id,
                blood_bank_id || 1,
                donation_date || new Date().toISOString().split('T')[0],
                bg,
                units_donated || 1
            ]
        );

        // Update last donation date in donors table
        await pool.query(
            "UPDATE donors SET last_donation_date = $1 WHERE donor_id = $2",
            [donation_date || new Date().toISOString().split('T')[0], donor.donor_id]
        );

        res.status(201).json({
            status: "success",
            message: "Donation logged successfully",
            donation: result.rows[0]
        });

    } catch (error) {
        console.error("Log donation error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Update donor profile details
const updateDonorProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            full_name, phone, city, state,
            blood_group, is_available,
            weight_kg, medical_conditions, id_proof_number
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

        const parsedWeight = (weight_kg !== undefined && weight_kg !== null && weight_kg !== '') ? parseFloat(weight_kg) : null;
        const cleanMed = (medical_conditions !== undefined && medical_conditions !== '') ? medical_conditions : null;
        const cleanIdProof = (id_proof_number !== undefined && id_proof_number !== '') ? id_proof_number : null;
        const cleanFullName = (full_name !== undefined && full_name !== '') ? full_name : null;

        await pool.query(
            `INSERT INTO donors
             (user_id, blood_group, is_available, weight_kg, medical_conditions, id_proof_number, donor_name)
             VALUES ($1, COALESCE($2, 'O+'), COALESCE($3, true), $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET
                 blood_group        = COALESCE(EXCLUDED.blood_group, donors.blood_group),
                 is_available       = COALESCE(EXCLUDED.is_available, donors.is_available),
                 weight_kg          = COALESCE(EXCLUDED.weight_kg, donors.weight_kg),
                 medical_conditions = COALESCE(EXCLUDED.medical_conditions, donors.medical_conditions),
                 id_proof_number    = COALESCE(EXCLUDED.id_proof_number, donors.id_proof_number),
                 donor_name         = COALESCE(EXCLUDED.donor_name, donors.donor_name)`,
            [userId, blood_group || null, is_available ?? true, parsedWeight, cleanMed, cleanIdProof, cleanFullName]
        );

        res.json({
            status: "success",
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

module.exports = {
    getDonorProfile,
    createDonorProfile,
    updateAvailability,
    getAvailableDonors,
    getDonationHistory,
    logDonation,
    updateDonorProfile
};