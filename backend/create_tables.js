const { Client } = require('pg');

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL || 'postgresql://blood_bridge_db_kdjr_user:8LS25a5ZUoSch78ftrNin0shYMjVOX47@dpg-db1644navr4c73aetl80-a.singapore-postgres.render.com/blood_bridge_db_kdjr';

const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function recreateTables() {
    try {
        await client.connect();
        console.log('✅ Connected to Render DB');

        // Drop all in reverse order
        await client.query(`
            DROP TABLE IF EXISTS request_fulfillments CASCADE;
            DROP TABLE IF EXISTS blood_requests CASCADE;
            DROP TABLE IF EXISTS donations CASCADE;
            DROP TABLE IF EXISTS blood_inventory CASCADE;
            DROP TABLE IF EXISTS blood_banks CASCADE;
            DROP TABLE IF EXISTS recipients CASCADE;
            DROP TABLE IF EXISTS donors CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);
        console.log('✅ Old tables dropped');

        await client.query(`
            CREATE TABLE users (
                user_id SERIAL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('donor', 'recipient', 'blood_bank', 'admin')),
                city VARCHAR(100),
                state VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ users table created');

        await client.query(`
            CREATE TABLE donors (
                donor_id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
                donor_name VARCHAR(255),
                blood_group VARCHAR(10),
                date_of_birth DATE,
                gender VARCHAR(20),
                weight_kg NUMERIC,
                medical_conditions TEXT,
                id_proof_number VARCHAR(100),
                last_donation_date DATE,
                next_eligible_date DATE,
                total_donations INT DEFAULT 0,
                is_available BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ donors table created');

        await client.query(`
            CREATE TABLE recipients (
                recipient_id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
                recipient_name VARCHAR(255),
                blood_group VARCHAR(10),
                medical_reason TEXT,
                hospital_name VARCHAR(255),
                contact_person VARCHAR(255),
                contact_phone VARCHAR(50),
                doctor_name VARCHAR(255),
                urgency_level VARCHAR(50) DEFAULT 'normal',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ recipients table created');

        await client.query(`
            CREATE TABLE blood_banks (
                blood_bank_id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
                bank_name VARCHAR(255) NOT NULL,
                license_number VARCHAR(100) UNIQUE NOT NULL,
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(20),
                phone VARCHAR(50),
                email VARCHAR(255),
                operating_hours VARCHAR(100),
                verified BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ blood_banks table created');

        await client.query(`
            CREATE TABLE blood_inventory (
                inventory_id SERIAL PRIMARY KEY,
                blood_bank_id INT REFERENCES blood_banks(blood_bank_id) ON DELETE CASCADE,
                blood_group VARCHAR(10) NOT NULL,
                units_available INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(blood_bank_id, blood_group)
            );
        `);
        console.log('✅ blood_inventory table created');

        await client.query(`
            CREATE TABLE blood_requests (
                request_id SERIAL PRIMARY KEY,
                recipient_id INT REFERENCES recipients(recipient_id) ON DELETE CASCADE,
                blood_group VARCHAR(10) NOT NULL,
                units_needed INT NOT NULL,
                urgency_level VARCHAR(50) DEFAULT 'normal',
                hospital_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ blood_requests table created');

        await client.query(`
            CREATE TABLE donations (
                donation_id SERIAL PRIMARY KEY,
                donor_id INT REFERENCES donors(donor_id) ON DELETE CASCADE,
                blood_bank_id INT REFERENCES blood_banks(blood_bank_id) ON DELETE SET NULL,
                blood_group VARCHAR(10) NOT NULL,
                units_donated INT DEFAULT 1,
                donation_date DATE DEFAULT CURRENT_DATE,
                status VARCHAR(50) DEFAULT 'completed',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ donations table created');

        await client.query(`
            CREATE TABLE request_fulfillments (
                fulfillment_id SERIAL PRIMARY KEY,
                request_id INT REFERENCES blood_requests(request_id) ON DELETE CASCADE,
                blood_bank_id INT REFERENCES blood_banks(blood_bank_id) ON DELETE SET NULL,
                donor_id INT REFERENCES donors(donor_id) ON DELETE SET NULL,
                units_provided INT NOT NULL,
                fulfilled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            );
        `);
        console.log('✅ request_fulfillments table created');

        console.log('\n🎉 ALL TABLES RECREATED WITH CORRECT SCHEMA!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

recreateTables();
