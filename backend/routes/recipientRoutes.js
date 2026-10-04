const express = require("express");
const {
    searchBlood,
    createRequest,
    getMyRequests,
    getRecipientProfile,
    updateRecipientProfile
} = require("../controllers/recipientController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/search", searchBlood);
router.post("/requests", authenticateToken, createRequest);
router.get("/my-requests", authenticateToken, getMyRequests);
router.get("/profile", authenticateToken, getRecipientProfile);
router.put("/profile", authenticateToken, updateRecipientProfile);

module.exports = router;
