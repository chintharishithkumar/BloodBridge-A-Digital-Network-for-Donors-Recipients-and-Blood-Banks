const express = require("express");

const {
    getDonorProfile,
    createDonorProfile,
    updateAvailability,
    getAvailableDonors,
    getDonationHistory,
    logDonation,
    updateDonorProfile
} = require("../controllers/donorController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/available", getAvailableDonors);

router.get("/profile", authenticateToken, getDonorProfile);
router.post("/profile", authenticateToken, createDonorProfile);
router.put("/profile", authenticateToken, updateDonorProfile);
router.put("/availability", authenticateToken, updateAvailability);

router.get("/history", authenticateToken, getDonationHistory);
router.post("/donations", authenticateToken, logDonation);

module.exports = router;