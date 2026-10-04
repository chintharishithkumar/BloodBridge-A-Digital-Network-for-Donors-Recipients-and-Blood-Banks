const express = require("express");
const {
    getInventory,
    updateInventory,
    getBankRequests,
    updateRequestStatus,
    updateBloodBankProfile
} = require("../controllers/bloodBankController");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/inventory", authenticateToken, getInventory);
router.put("/inventory", authenticateToken, updateInventory);

router.get("/requests", authenticateToken, getBankRequests);
router.put("/requests/:requestId/status", authenticateToken, updateRequestStatus);

router.put("/profile", authenticateToken, updateBloodBankProfile);

module.exports = router;
