const bcrypt = require("bcrypt");
const pool = require("../config/db");

const registerUser = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            password,
            role,
            city,
            state
        } = req.body;

        // Check required fields
        if (
            !full_name ||
            !email ||
            !phone ||
            !password ||
            !role ||
            !city ||
            !state
        ) {
            return res.status(400).json({
                status: "error",
                message: "All fields are required"
            });
        }

        const dbRole = role.toLowerCase();

        // Check whether email or phone already exists
        const existingUser = await pool.query(
            "SELECT email, phone FROM users WHERE LOWER(email) = LOWER($1) OR phone = $2",
            [email, phone]
        );

        if (existingUser.rows.length > 0) {
            const found = existingUser.rows[0];
            if (found.email.toLowerCase() === email.toLowerCase()) {
                return res.status(400).json({
                    status: "error",
                    message: "An account with this email address already exists."
                });
            }
            if (found.phone === phone) {
                return res.status(400).json({
                    status: "error",
                    message: "An account with this phone number already exists. Try logging in or use a different phone number."
                });
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users
            (full_name, email, phone, password_hash, role, city, state)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING user_id, full_name, email, phone, role, city, state`,
            [
                full_name,
                email,
                phone,
                passwordHash,
                dbRole,
                city,
                state
            ]
        );

        const newUser = result.rows[0];
        newUser.role = newUser.role.toLowerCase();

        // Auto-create role specific entries with all new columns
        if (dbRole === 'donor') {
            const {
                blood_group, date_of_birth, gender,
                weight_kg, medical_conditions, id_proof_number
            } = req.body;

            console.log('Donor registration data received:', {
                blood_group, date_of_birth, gender,
                weight_kg, medical_conditions, id_proof_number
            });

            // Calculate next eligible donation date (90 days from today)
            const nextEligible = new Date();
            nextEligible.setDate(nextEligible.getDate() + 90);
            const nextEligibleStr = nextEligible.toISOString().split('T')[0];

            const parsedWeight = weight_kg ? parseFloat(weight_kg) : null;
            const parsedDOB = date_of_birth || '2000-01-01';

            await pool.query(
                `INSERT INTO donors
                 (user_id, blood_group, date_of_birth, gender, is_available,
                  weight_kg, medical_conditions, id_proof_number,
                  next_eligible_date, total_donations, donor_name)
                 VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8, 0, $9)
                 ON CONFLICT (user_id) DO UPDATE SET
                  blood_group        = EXCLUDED.blood_group,
                  date_of_birth      = EXCLUDED.date_of_birth,
                  gender             = EXCLUDED.gender,
                  weight_kg          = EXCLUDED.weight_kg,
                  medical_conditions = EXCLUDED.medical_conditions,
                  id_proof_number    = EXCLUDED.id_proof_number,
                  next_eligible_date = EXCLUDED.next_eligible_date,
                  donor_name         = EXCLUDED.donor_name`,
                [
                    newUser.user_id,
                    blood_group || 'O+',
                    parsedDOB,
                    gender || 'Male',
                    parsedWeight,
                    medical_conditions || null,
                    id_proof_number || null,
                    nextEligibleStr,
                    full_name
                ]
            );


        } else if (dbRole === 'recipient') {
            const {
                blood_group, medical_reason,
                hospital_name, doctor_name,
                contact_person, contact_phone
            } = req.body;

            await pool.query(
                `INSERT INTO recipients
                 (user_id, blood_group, medical_reason,
                  hospital_name, doctor_name,
                  contact_person, contact_phone, recipient_name)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (user_id) DO UPDATE SET
                  blood_group     = EXCLUDED.blood_group,
                  medical_reason  = EXCLUDED.medical_reason,
                  hospital_name   = EXCLUDED.hospital_name,
                  doctor_name     = EXCLUDED.doctor_name,
                  contact_person  = EXCLUDED.contact_person,
                  contact_phone   = EXCLUDED.contact_phone,
                  recipient_name  = EXCLUDED.recipient_name`,
                [
                    newUser.user_id,
                    blood_group || 'O+',
                    medical_reason || 'General medical request',
                    hospital_name || null,
                    doctor_name || null,
                    contact_person || null,
                    contact_phone || null,
                    full_name
                ]
            );

        } else if (dbRole === 'blood_bank') {
            const {
                bank_name, license_number, address,
                bank_phone, bank_email, operating_hours, pincode
            } = req.body;

            const bankRes = await pool.query(
                `INSERT INTO blood_banks
                 (user_id, bank_name, license_number, address, city, state,
                  phone, email, operating_hours, pincode, verified, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, true)
                 RETURNING blood_bank_id`,
                [
                    newUser.user_id,
                    bank_name || `${full_name} Blood Bank`,
                    license_number || `LIC-${Date.now()}`,
                    address || `${city}, ${state}`,
                    city,
                    state,
                    bank_phone || phone,
                    bank_email || email,
                    operating_hours || '9AM - 5PM, Mon-Sat',
                    pincode || null
                ]
            );

            // Initialize 8 standard blood groups with 0 units
            const bankId = bankRes.rows[0].blood_bank_id;
            const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            for (const bg of groups) {
                await pool.query(
                    `INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available, last_updated)
                     VALUES ($1, $2, 0, NOW())`,
                    [bankId, bg]
                );
            }
        }

        res.status(201).json({
            status: "success",
            message: "User registered successfully",
            user: newUser
        });

    } catch (error) {
        console.error("Registration error:", error);

        if (error.code === '23505') {
            if (error.constraint === 'users_phone_key' || error.detail?.includes('phone')) {
                return res.status(400).json({
                    status: "error",
                    message: "Phone number is already registered to another account."
                });
            }
            if (error.constraint === 'users_email_key' || error.detail?.includes('email')) {
                return res.status(400).json({
                    status: "error",
                    message: "Email address is already registered to another account."
                });
            }
            if (error.constraint === 'blood_banks_license_number_key' || error.detail?.includes('license_number')) {
                return res.status(400).json({
                    status: "error",
                    message: "License number is already registered to another blood bank."
                });
            }
        }

        res.status(500).json({
            status: "error",
            message: error.message || "Server error during registration"
        });
    }
};

const jwt = require("jsonwebtoken");

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email and password are required"
            });
        }

        // Find user
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        const userRole = user.role.toLowerCase();

        // Send response
        res.json({
            status: "success",
            message: "Login successful",
            token: token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: userRole,
                city: user.city,
                state: user.state
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            status: "error",
            message: "Server error during login"
        });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await pool.query(
            "SELECT user_id, full_name, email, phone, role, city, state FROM users WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        const user = result.rows[0];
        user.role = user.role.toLowerCase();
        let roleDetails = null;

        if (user.role === 'donor') {
            const d = await pool.query("SELECT * FROM donors WHERE user_id = $1", [userId]);
            if (d.rows.length > 0) roleDetails = d.rows[0];
        } else if (user.role === 'recipient') {
            const r = await pool.query("SELECT * FROM recipients WHERE user_id = $1", [userId]);
            if (r.rows.length > 0) roleDetails = r.rows[0];
        } else if (user.role === 'blood_bank') {
            const b = await pool.query("SELECT * FROM blood_banks WHERE user_id = $1", [userId]);
            if (b.rows.length > 0) roleDetails = b.rows[0];
        }

        res.json({
            status: "success",
            user: user,
            roleDetails: roleDetails
        });

    } catch (error) {
        console.error("GetMe error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};