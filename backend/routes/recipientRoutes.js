const express = require("express");
const {
    searchBlood,
    createRequest,
    createEmergencyRequest,
    getMyRequests,
    getRecipientProfile,
    updateRecipientProfile,
    getCities,
    contactDonor
} = require("../controllers/recipientController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/cities", getCities);
router.get("/search", searchBlood);
router.post("/emergency-request", createEmergencyRequest); // Unauthenticated emergency blood request!
router.post("/requests", authenticateToken, createRequest);
router.get("/my-requests", authenticateToken, getMyRequests);
router.get("/profile", authenticateToken, getRecipientProfile);
router.put("/profile", authenticateToken, updateRecipientProfile);
router.post("/contact-donor", authenticateToken, contactDonor); // Notify a specific donor via SMS

module.exports = router;

