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

        console.log("✅ DB schema verified and auto-updated successfully.");
    } catch (err) {
        console.error("❌ DB init schema error:", err);
    }
};

module.exports = initDb;
