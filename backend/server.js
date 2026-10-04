const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const donorRoutes = require("./routes/donorRoutes");
const recipientRoutes = require("./routes/recipientRoutes");
const bloodBankRoutes = require("./routes/bloodBankRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Authentication middleware
const authenticateToken = require("./middleware/authMiddleware");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());


// ===============================
// BASIC ROUTES
// ===============================

app.get("/", (req, res) => {
    res.json({
        message: "Blood-Bridge Backend is running"
    });
});


// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "Blood-Bridge API is working"
    });
});


// ===============================
// DATABASE TEST
// ===============================

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "success",
            message: "PostgreSQL connected successfully",
            database_time: result.rows[0].now
        });

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});


// ===============================
// API ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/donors", donorRoutes);
app.use("/donors", donorRoutes);

app.use("/api/recipients", recipientRoutes);
app.use("/recipients", recipientRoutes);

app.use("/api/blood-bank", bloodBankRoutes);
app.use("/blood-bank", bloodBankRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);


// ===============================
// PROTECTED TEST ROUTE
// ===============================

app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({
        status: "success",
        message: "You accessed a protected route",
        user: req.user
    });
});


// ===============================
// 404 ROUTE
// ===============================

app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});


// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
    console.error("Server error:", err);

    res.status(500).json({
        status: "error",
        message: "Internal server error"
    });
});


const initDb = require("./config/initDb");

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Blood-Bridge server running on port ${PORT}`);
    await initDb();
});

module.exports = app;