const pool = require("../config/db");
const { notifyRequestStatusChange } = require("../services/notificationService");

// Get blood bank profile & inventory
const getInventory = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Find blood bank
        let bankRes = await pool.query(
            "SELECT * FROM blood_banks WHERE user_id = $1",
            [userId]
        );

        let bank;
        if (bankRes.rows.length === 0) {
            // Check if user is blood_bank role, if so create bank record
            const userRes = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
            if (userRes.rows.length === 0) {
                return res.status(404).json({ status: "error", message: "User not found" });
            }
            const u = userRes.rows[0];
            const newBank = await pool.query(
                `INSERT INTO blood_banks
                 (user_id, bank_name, license_number, address, city, state,
                  phone, email, operating_hours, is_active, verified)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, true)
                 RETURNING *`,
                [
                    userId,
                    `${u.full_name} Blood Bank`,
                    `LIC-${Date.now()}`,
                    u.city || 'Hyderabad',
                    u.city || 'Hyderabad',
                    u.state || 'Telangana',
                    u.phone || null,
                    u.email || null,
                    '9AM - 5PM, Mon-Sat'
                ]
            );
            bank = newBank.rows[0];
        } else {
            bank = bankRes.rows[0];
        }

        // Fetch inventory
        const invRes = await pool.query(
            "SELECT * FROM blood_inventory WHERE blood_bank_id = $1",
            [bank.blood_bank_id]
        );

        const standardGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        const inventoryMap = {};

        // Default all to 0
        standardGroups.forEach(bg => {
            inventoryMap[bg] = 0;
        });

        // Fill existing
        invRes.rows.forEach(item => {
            inventoryMap[item.blood_group] = item.units_available;
        });

        res.json({
            status: "success",
            bank: bank,
            inventory: inventoryMap,
            rawInventory: invRes.rows
        });

    } catch (error) {
        console.error("Get inventory error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Update blood bank inventory stock
const updateInventory = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { blood_group, units_available } = req.body;

        if (!blood_group || units_available === undefined) {
            return res.status(400).json({
                status: "error",
                message: "blood_group and units_available are required"
            });
        }

        const bankRes = await pool.query(
            "SELECT blood_bank_id FROM blood_banks WHERE user_id = $1",
            [userId]
        );

        if (bankRes.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Blood bank profile not found" });
        }

        const bankId = bankRes.rows[0].blood_bank_id;

        // Upsert inventory
        const existing = await pool.query(
            "SELECT * FROM blood_inventory WHERE blood_bank_id = $1 AND blood_group = $2",
            [bankId, blood_group]
        );

        if (existing.rows.length > 0) {
            await pool.query(
                `UPDATE blood_inventory
                 SET units_available = $1, last_updated = NOW()
                 WHERE blood_bank_id = $2 AND blood_group = $3`,
                [units_available, bankId, blood_group]
            );
        } else {
            await pool.query(
                `INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available, last_updated)
                 VALUES ($1, $2, $3, NOW())`,
                [bankId, blood_group, units_available]
            );
        }

        res.json({
            status: "success",
            message: `Updated ${blood_group} stock to ${units_available} units`
        });

    } catch (error) {
        console.error("Update inventory error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Get requests for blood bank
const getBankRequests = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const bankRes = await pool.query(
            "SELECT blood_bank_id FROM blood_banks WHERE user_id = $1",
            [userId]
        );

        if (bankRes.rows.length === 0) {
            return res.json({ status: "success", requests: [] });
        }

        const bankId = bankRes.rows[0].blood_bank_id;

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
                u.full_name as recipient_name,
                u.phone as recipient_phone,
                u.city as recipient_city
             FROM blood_requests br
             JOIN recipients r ON br.recipient_id = r.recipient_id
             JOIN users u ON r.user_id = u.user_id
             WHERE br.blood_bank_id = $1 OR (br.emergency = true AND br.blood_bank_id IS NULL AND br.status = 'PENDING')
             ORDER BY br.request_id DESC`,
            [bankId]
        );

        res.json({
            status: "success",
            requests: result.rows
        });

    } catch (error) {
        console.error("Get bank requests error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Approve or reject a request
const updateRequestStatus = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { requestId } = req.params;
        const { status } = req.body; // 'APPROVED' or 'REJECTED' or 'FULFILLED'

        if (!['APPROVED', 'REJECTED', 'FULFILLED', 'PENDING'].includes(status)) {
            return res.status(400).json({ status: "error", message: "Invalid status value" });
        }

        const bankRes = await pool.query(
            "SELECT blood_bank_id FROM blood_banks WHERE user_id = $1",
            [userId]
        );

        if (bankRes.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Blood bank profile not found" });
        }

        const bankId = bankRes.rows[0].blood_bank_id;

        // Fetch request (allow if it belongs to this bank OR if it's a global unassigned emergency)
        const reqRes = await pool.query(
            "SELECT * FROM blood_requests WHERE request_id = $1 AND (blood_bank_id = $2 OR (emergency = true AND blood_bank_id IS NULL))",
            [requestId, bankId]
        );

        if (reqRes.rows.length === 0) {
            return res.status(404).json({ status: "error", message: "Blood request not found or already claimed" });
        }

        const bloodReq = reqRes.rows[0];

        // If approving and wasn't previously approved, deduct units from inventory
        if (status === 'APPROVED' && bloodReq.status !== 'APPROVED') {
            const invRes = await pool.query(
                "SELECT units_available FROM blood_inventory WHERE blood_bank_id = $1 AND blood_group = $2",
                [bankId, bloodReq.blood_group]
            );

            if (invRes.rows.length > 0) {
                const currentUnits = invRes.rows[0].units_available;
                const newUnits = Math.max(0, currentUnits - bloodReq.units_required);
                await pool.query(
                    "UPDATE blood_inventory SET units_available = $1, last_updated = NOW() WHERE blood_bank_id = $2 AND blood_group = $3",
                    [newUnits, bankId, bloodReq.blood_group]
                );
            }
        }

        let updateQuery, updateParams;
        if (status === 'APPROVED') {
            updateQuery = `UPDATE blood_requests
                SET status = $1, fulfilled_date = NOW(), blood_bank_id = $3
                WHERE request_id = $2 RETURNING *`;
            updateParams = [status, requestId, bankId];
        } else if (status === 'REJECTED') {
            const { rejected_reason } = req.body;
            updateQuery = `UPDATE blood_requests
                SET status = $1, rejected_reason = $2, blood_bank_id = $4
                WHERE request_id = $3 RETURNING *`;
            updateParams = [status, rejected_reason || null, requestId, bankId];
        } else {
            updateQuery = "UPDATE blood_requests SET status = $1, blood_bank_id = $3 WHERE request_id = $2 RETURNING *";
            updateParams = [status, requestId, bankId];
        }

        const updated = await pool.query(updateQuery, updateParams);

        // Fetch blood bank name for SMS message
        const bankNameRes = await pool.query(
            "SELECT bank_name FROM blood_banks WHERE blood_bank_id = $1",
            [bankId]
        );
        const bankName = bankNameRes.rows[0]?.bank_name || 'Blood Bank';

        // Notify recipient via in-app notification + SMS
        if (bloodReq.recipient_id) {
            const recipientUserRes = await pool.query(
                "SELECT user_id FROM recipients WHERE recipient_id = $1",
                [bloodReq.recipient_id]
            );
            if (recipientUserRes.rows.length > 0) {
                const recipientUserId = recipientUserRes.rows[0].user_id;
                notifyRequestStatusChange({
                    requestId: Number(requestId),
                    recipientUserId,
                    newStatus: status,
                    bloodGroup: bloodReq.blood_group,
                    rejectedReason: req.body.rejected_reason || null,
                    bankName
                }).catch(err => console.error("[Notify] Status change notification error:", err));
            }
        }

        res.json({
            status: "success",
            message: `Request status updated to ${status}`,
            request: updated.rows[0]
        });

    } catch (error) {
        console.error("Update request status error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Update blood bank profile
const updateBloodBankProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const {
            bank_name, license_number, address, city, state,
            phone, email, operating_hours, pincode
        } = req.body;

        if (city || state) {
            await pool.query(
                `UPDATE users
                 SET city = COALESCE(NULLIF($1, ''), city),
                     state = COALESCE(NULLIF($2, ''), state)
                 WHERE user_id = $3`,
                [city || null, state || null, userId]
            );
        }

        await pool.query(
            `INSERT INTO blood_banks
             (user_id, bank_name, license_number, address, city, state, phone, email, operating_hours, pincode, verified, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, true)
             ON CONFLICT (user_id) DO UPDATE SET
                 bank_name       = COALESCE(EXCLUDED.bank_name, blood_banks.bank_name),
                 license_number  = COALESCE(EXCLUDED.license_number, blood_banks.license_number),
                 address         = COALESCE(EXCLUDED.address, blood_banks.address),
                 city            = COALESCE(EXCLUDED.city, blood_banks.city),
                 state           = COALESCE(EXCLUDED.state, blood_banks.state),
                 phone           = COALESCE(EXCLUDED.phone, blood_banks.phone),
                 email           = COALESCE(EXCLUDED.email, blood_banks.email),
                 operating_hours = COALESCE(EXCLUDED.operating_hours, blood_banks.operating_hours),
                 pincode         = COALESCE(EXCLUDED.pincode, blood_banks.pincode)`,
            [
                userId, bank_name || null, license_number || null, address || null,
                city || null, state || null, phone || null, email || null,
                operating_hours || null, pincode || null
            ]
        );

        res.json({
            status: "success",
            message: "Blood bank profile updated successfully"
        });

    } catch (error) {
        console.error("Update blood bank profile error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

module.exports = {
    getInventory,
    updateInventory,
    getBankRequests,
    updateRequestStatus,
    updateBloodBankProfile
};
