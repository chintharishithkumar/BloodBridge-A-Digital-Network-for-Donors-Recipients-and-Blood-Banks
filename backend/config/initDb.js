const pool = require("./db");

const initDb = async () => {
    try {
        console.log("Checking and updating DB schema...");

        // Donors table columns
        await pool.query(`
            ALTER TABLE donors ADD COLUMN IF NOT EXISTS donor_name VARCHAR(255);
            ALTER TABLE donors ADD COLUMN IF NOT EXISTS weight_kg NUMERIC;
            ALTER TABLE donors ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
            ALTER TABLE donors ADD COLUMN IF NOT EXISTS id_proof_number VARCHAR(100);
            ALTER TABLE donors ADD COLUMN IF NOT EXISTS next_eligible_date DATE;
            ALTER TABLE donors ADD COLUMN IF NOT EXISTS total_donations INT DEFAULT 0;
        `);

        // Recipients table columns
        await pool.query(`
            ALTER TABLE recipients ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
            ALTER TABLE recipients ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
            ALTER TABLE recipients ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
            ALTER TABLE recipients ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255);
        `);

        // Blood banks table columns
        await pool.query(`
            ALTER TABLE blood_banks ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
            ALTER TABLE blood_banks ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
            ALTER TABLE blood_banks ADD COLUMN IF NOT EXISTS email VARCHAR(255);
            ALTER TABLE blood_banks ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(100);
            ALTER TABLE blood_banks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        `);

        // Blood requests table columns & nullability
        await pool.query(`
            ALTER TABLE blood_requests ALTER COLUMN recipient_id DROP NOT NULL;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS blood_bank_id INT REFERENCES blood_banks(blood_bank_id) ON DELETE SET NULL;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS units_required INT DEFAULT 1;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS emergency BOOLEAN DEFAULT false;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS required_by DATE;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS notes TEXT;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255);
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255);
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS location VARCHAR(255);
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS fulfilled_date TIMESTAMP;
            ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS rejected_reason TEXT;
        `);

        // Notifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'normal_request',
                request_id INT REFERENCES blood_requests(request_id) ON DELETE CASCADE,
                is_read BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add UNIQUE constraints on user_id if not present
        await pool.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'donors_user_id_key'
                ) THEN
                    ALTER TABLE donors ADD CONSTRAINT donors_user_id_key UNIQUE (user_id);
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'recipients_user_id_key'
                ) THEN
                    ALTER TABLE recipients ADD CONSTRAINT recipients_user_id_key UNIQUE (user_id);
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'blood_banks_user_id_key'
                ) THEN
                    ALTER TABLE blood_banks ADD CONSTRAINT blood_banks_user_id_key UNIQUE (user_id);
                END IF;
            END $$;
        `);

        // Backfill missing donor_name and recipient_name
        await pool.query(`
            UPDATE donors d SET donor_name = u.full_name FROM users u WHERE d.user_id = u.user_id AND (d.donor_name IS NULL OR d.donor_name = '');
            UPDATE recipients r SET recipient_name = u.full_name FROM users u WHERE r.user_id = u.user_id AND (r.recipient_name IS NULL OR r.recipient_name = '');
            UPDATE donors SET total_donations = 0 WHERE total_donations IS NULL;
            UPDATE donors SET next_eligible_date = CURRENT_DATE WHERE next_eligible_date IS NULL;
        `);

        // Seed default Demo Accounts if missing
        await seedDemoAccounts();

        console.log("✅ DB schema verified and auto-updated successfully.");
    } catch (err) {
        console.error("❌ DB init schema error:", err);
    }
};

const bcrypt = require("bcrypt");

const seedDemoAccounts = async () => {
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const demoUsers = [
        {
            full_name: 'John Donor',
            email: 'john.donor@example.com',
            phone: '9876543210',
            role: 'donor',
            city: 'Hyderabad',
            state: 'Telangana',
            blood_group: 'O+'
        },
        {
            full_name: 'Rahul Recipient',
            email: 'rahul.recipient@example.com',
            phone: '9876543211',
            role: 'recipient',
            city: 'Hyderabad',
            state: 'Telangana',
            blood_group: 'B+'
        },
        {
            full_name: 'Red Cross Blood Bank',
            email: 'hyd.redcross@bloodbank.com',
            phone: '9876543212',
            role: 'blood_bank',
            city: 'Hyderabad',
            state: 'Telangana',
            bank_name: 'Red Cross Hyderabad',
            license_number: 'BB-HYD-001'
        },
        {
            full_name: 'System Admin',
            email: 'admin@bloodbridge.com',
            phone: '9876543213',
            role: 'admin',
            city: 'Hyderabad',
            state: 'Telangana'
        }
    ];

    for (const demo of demoUsers) {
        let userRes = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [demo.email]);
        let userId;

        if (userRes.rows.length === 0) {
            const insRes = await pool.query(
                `INSERT INTO users (full_name, email, phone, password_hash, role, city, state)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING user_id`,
                [demo.full_name, demo.email, demo.phone, defaultPasswordHash, demo.role, demo.city, demo.state]
            );
            userId = insRes.rows[0].user_id;
        } else {
            userId = userRes.rows[0].user_id;
            // Always update password hash to ensure password123 works
            await pool.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [defaultPasswordHash, userId]);
        }

        // Ensure role table entries exist
        if (demo.role === 'donor') {
            await pool.query(
                `INSERT INTO donors (user_id, blood_group, donor_name, is_available)
                 VALUES ($1, $2, $3, true)
                 ON CONFLICT (user_id) DO UPDATE SET blood_group = EXCLUDED.blood_group, donor_name = EXCLUDED.donor_name`,
                [userId, demo.blood_group, demo.full_name]
            );
        } else if (demo.role === 'recipient') {
            await pool.query(
                `INSERT INTO recipients (user_id, blood_group, recipient_name, medical_reason, hospital_name)
                 VALUES ($1, $2, $3, 'Emergency Surgery', 'Apollo Hospital Hyderabad')
                 ON CONFLICT (user_id) DO UPDATE SET blood_group = EXCLUDED.blood_group, recipient_name = EXCLUDED.recipient_name`,
                [userId, demo.blood_group, demo.full_name]
            );
        } else if (demo.role === 'blood_bank') {
            const bbRes = await pool.query(
                `INSERT INTO blood_banks (user_id, bank_name, license_number, address, city, state, phone, email, verified, is_active)
                 VALUES ($1, $2, $3, 'MG Road, Secunderabad', $4, $5, $6, $7, true, true)
                 ON CONFLICT (user_id) DO UPDATE SET bank_name = EXCLUDED.bank_name
                 RETURNING blood_bank_id`,
                [userId, demo.bank_name, demo.license_number, demo.city, demo.state, demo.phone, demo.email]
            );
            
            const bankId = bbRes.rows[0]?.blood_bank_id;
            if (bankId) {
                const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                for (const bg of groups) {
                    await pool.query(
                        `INSERT INTO blood_inventory (blood_bank_id, blood_group, units_available, last_updated)
                         VALUES ($1, $2, 10, NOW())
                         ON CONFLICT (blood_bank_id, blood_group) DO UPDATE SET units_available = GREATEST(blood_inventory.units_available, 10)`,
                        [bankId, bg]
                    );
                }
            }
        }
    }
};

module.exports = initDb;

