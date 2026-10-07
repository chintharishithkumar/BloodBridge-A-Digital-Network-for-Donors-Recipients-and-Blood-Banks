const pool = require("../config/db");

// Get notifications for current logged in user
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const result = await pool.query(
            `SELECT 
                n.notification_id,
                n.title,
                n.message,
                n.type,
                n.request_id,
                n.is_read,
                n.created_at,
                br.blood_group,
                br.units_required,
                br.hospital_name,
                br.contact_phone,
                br.location,
                br.status as request_status
             FROM notifications n
             LEFT JOIN blood_requests br ON n.request_id = br.request_id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT 50`,
            [userId]
        );

        const unreadCountRes = await pool.query(
            `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
            [userId]
        );

        res.json({
            status: "success",
            unreadCount: parseInt(unreadCountRes.rows[0].count) || 0,
            notifications: result.rows
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;

        await pool.query(
            `UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({ status: "success", message: "Notification marked as read" });
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

// Mark all notifications for user as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.user_id;

        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [userId]
        );

        res.json({ status: "success", message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

module.exports = {
    getUserNotifications,
    markAsRead,
    markAllAsRead
};
