const pool = require("../config/db");

const getStats = async (req, res) => {
    try {
        const donorsRes = await pool.query("SELECT COUNT(*) FROM donors");
        const recipientsRes = await pool.query("SELECT COUNT(*) FROM recipients");
        const banksRes = await pool.query("SELECT COUNT(*) FROM blood_banks");
        const pendingRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE UPPER(status) = 'PENDING'");
        const usersRes = await pool.query("SELECT COUNT(*) FROM users");

        res.json({
            status: "success",
            stats: {
                totalDonors: parseInt(donorsRes.rows[0].count) || 0,
                totalRecipients: parseInt(recipientsRes.rows[0].count) || 0,
                bloodBanks: parseInt(banksRes.rows[0].count) || 0,
                pendingRequests: parseInt(pendingRes.rows[0].count) || 0,
                totalUsers: parseInt(usersRes.rows[0].count) || 0
            }
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

const getRecentRequests = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                br.request_id,
                br.blood_group,
                br.units_required,
                br.request_date,
                br.status,
                br.emergency,
                br.hospital_name,
                br.patient_name,
                u.full_name as recipient_name,
                bb.bank_name
             FROM blood_requests br
             JOIN recipients r ON br.recipient_id = r.recipient_id
             JOIN users u ON r.user_id = u.user_id
             LEFT JOIN blood_banks bb ON br.blood_bank_id = bb.blood_bank_id
             ORDER BY br.request_date DESC
             LIMIT 20`
        );

        res.json({
            status: "success",
            requests: result.rows
        });
    } catch (error) {
        console.error("Admin recent requests error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

const getRecentDonations = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                dn.donation_id,
                dn.donation_date,
                dn.blood_group,
                dn.units_donated,
                u.full_name as donor_name,
                bb.bank_name
             FROM donations dn
             JOIN donors d ON dn.donor_id = d.donor_id
             JOIN users u ON d.user_id = u.user_id
             LEFT JOIN blood_banks bb ON dn.blood_bank_id = bb.blood_bank_id
             ORDER BY dn.donation_date DESC
             LIMIT 20`
        );

        res.json({
            status: "success",
            donations: result.rows
        });
    } catch (error) {
        console.error("Admin recent donations error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, full_name, email, phone, role, city, state, created_at
             FROM users
             ORDER BY user_id DESC
             LIMIT 100`
        );
        res.json({
            status: "success",
            users: result.rows
        });
    } catch (error) {
        console.error("Admin get users error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get all donors with full details (blood group, availability, last donation, etc.)
const getAllDonors = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                d.donor_id,
                d.blood_group,
                d.is_available,
                d.last_donation_date,
                d.next_eligible_date,
                d.total_donations,
                d.gender,
                d.weight_kg,
                d.donor_name,
                u.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.city,
                u.state,
                u.created_at
             FROM donors d
             JOIN users u ON d.user_id = u.user_id
             ORDER BY u.user_id DESC
             LIMIT 200`
        );

        res.json({
            status: "success",
            donors: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error("Admin get donors error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get all recipients with full details
const getAllRecipients = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                r.recipient_id,
                r.blood_group,
                r.medical_reason,
                r.hospital_name,
                r.doctor_name,
                r.recipient_name,
                u.user_id,
                u.full_name,
                u.email,
                u.phone,
                u.city,
                u.state,
                u.created_at
             FROM recipients r
             JOIN users u ON r.user_id = u.user_id
             ORDER BY u.user_id DESC
             LIMIT 200`
        );

        res.json({
            status: "success",
            recipients: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error("Admin get recipients error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get all blood banks with inventory summary
const getAllBloodBanks = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                bb.blood_bank_id,
                bb.bank_name,
                bb.license_number,
                bb.address,
                bb.city,
                bb.state,
                bb.phone,
                bb.email,
                bb.verified,
                bb.is_active,
                u.full_name,
                u.created_at,
                COALESCE(SUM(bi.units_available), 0) AS total_units
             FROM blood_banks bb
             JOIN users u ON bb.user_id = u.user_id
             LEFT JOIN blood_inventory bi ON bb.blood_bank_id = bi.blood_bank_id
             GROUP BY bb.blood_bank_id, u.full_name, u.created_at
             ORDER BY bb.blood_bank_id DESC`
        );

        res.json({
            status: "success",
            bloodBanks: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error("Admin get blood banks error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

module.exports = {
    getStats,
    getRecentRequests,
    getRecentDonations,
    getAllUsers,
    getAllDonors,
    getAllRecipients,
    getAllBloodBanks
};
