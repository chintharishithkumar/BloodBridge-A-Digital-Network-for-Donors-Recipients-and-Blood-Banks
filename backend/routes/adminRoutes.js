const express = require("express");
const {
    getStats,
    getRecentRequests,
    getRecentDonations,
    getAllUsers
} = require("../controllers/adminController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", authenticateToken, getStats);
router.get("/recent-requests", authenticateToken, getRecentRequests);
router.get("/recent-donations", authenticateToken, getRecentDonations);
router.get("/users", authenticateToken, getAllUsers);

module.exports = router;
