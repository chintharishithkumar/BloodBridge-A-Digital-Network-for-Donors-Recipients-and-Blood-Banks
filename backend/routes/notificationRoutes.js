const express = require("express");
const {
    getUserNotifications,
    markAsRead,
    markAllAsRead
} = require("../controllers/notificationController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getUserNotifications);
router.put("/read-all", authenticateToken, markAllAsRead);
router.put("/:id/read", authenticateToken, markAsRead);

module.exports = router;
