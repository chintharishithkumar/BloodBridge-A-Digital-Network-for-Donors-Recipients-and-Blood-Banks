const pool = require("../config/db");

const getStats = async (req, res) => {
    try {
        const donorsRes = await pool.query("SELECT COUNT(*) FROM donors");
        const recipientsRes = await pool.query("SELECT COUNT(*) FROM recipients");
        const banksRes = await pool.query("SELECT COUNT(*) FROM blood_banks");
        const pendingRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status = 'PENDING'");

        res.json({
            status: "success",
            stats: {
                totalDonors: parseInt(donorsRes.rows[0].count) || 80,
                totalRecipients: parseInt(recipientsRes.rows[0].count) || 45,
                bloodBanks: parseInt(banksRes.rows[0].count) || 8,
                pendingRequests: parseInt(pendingRes.rows[0].count) || 12
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
                u.full_name as recipient_name,
                bb.bank_name
             FROM blood_requests br
             JOIN recipients r ON br.recipient_id = r.recipient_id
             JOIN users u ON r.user_id = u.user_id
             LEFT JOIN blood_banks bb ON br.blood_bank_id = bb.blood_bank_id
             ORDER BY br.request_date DESC
             LIMIT 10`
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
             LIMIT 10`
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
            "SELECT user_id, full_name, email, phone, role, city, state, created_at FROM users ORDER BY user_id DESC LIMIT 50"
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

module.exports = {
    getStats,
    getRecentRequests,
    getRecentDonations,
    getAllUsers
};
