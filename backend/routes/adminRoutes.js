const express = require("express");
const {
    getStats,
    getRecentRequests,
    getRecentDonations,
    getAllUsers,
    getAllDonors,
    getAllRecipients,
    getAllBloodBanks,
    deleteUser
} = require("../controllers/adminController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/stats", authenticateToken, getStats);
router.get("/recent-requests", authenticateToken, getRecentRequests);
router.get("/recent-donations", authenticateToken, getRecentDonations);
router.get("/users", authenticateToken, getAllUsers);
router.get("/donors", authenticateToken, getAllDonors);
router.get("/recipients", authenticateToken, getAllRecipients);
router.get("/blood-banks", authenticateToken, getAllBloodBanks);
router.delete("/users/:userId", authenticateToken, deleteUser);

module.exports = router;
