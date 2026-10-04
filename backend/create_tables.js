const { Client } = require('pg');

// PASTE YOUR RENDER EXTERNAL DATABASE URL BELOW
const DATABASE_URL = process.argv[2];

if (!DATABASE_URL) {
    console.error('Usage: node create_tables.js <RENDER_EXTERNAL_DATABASE_URL>');
    process.exit(1);
}

const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createTables() {
    try {
        await client.connect();
        console.log('✅ Connected to Render DB');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK (role IN ('donor', 'recipient', 'blood_bank')),
                city VARCHAR(100),
                state VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ users table created');

        await client.query(`
            CREATE TABLE IF NOT EXISTS donors (
                donor_id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
                donor_name VARCHAR(255),
                blood_type VARCHAR(10) NOT NULL,
                date_of_birth DATE,
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
            CREATE TABLE IF NOT EXISTS recipients (
                recipient_id SERIAL PRIMARY KEY,
                user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
                recipient_name VARCHAR(255),
                blood_type VARCHAR(10) NOT NULL,
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
            CREATE TABLE IF NOT EXISTS blood_banks (
                bank_id SERIAL PRIMARY KEY,
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
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ blood_banks table created');

        await client.query(`
            CREATE TABLE IF NOT EXISTS blood_inventory (
                inventory_id SERIAL PRIMARY KEY,
                bank_id INT REFERENCES blood_banks(bank_id) ON DELETE CASCADE,
                blood_type VARCHAR(10) NOT NULL,
                units_available INT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(bank_id, blood_type)
            );
        `);
        console.log('✅ blood_inventory table created');

        await client.query(`
            CREATE TABLE IF NOT EXISTS blood_requests (
                request_id SERIAL PRIMARY KEY,
                recipient_id INT REFERENCES recipients(recipient_id) ON DELETE CASCADE,
                blood_type VARCHAR(10) NOT NULL,
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
            CREATE TABLE IF NOT EXISTS donations (
                donation_id SERIAL PRIMARY KEY,
                donor_id INT REFERENCES donors(donor_id) ON DELETE CASCADE,
                bank_id INT REFERENCES blood_banks(bank_id) ON DELETE SET NULL,
                blood_type VARCHAR(10) NOT NULL,
                units_donated INT DEFAULT 1,
                donation_date DATE DEFAULT CURRENT_DATE,
                status VARCHAR(50) DEFAULT 'completed',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ donations table created');

        await client.query(`
            CREATE TABLE IF NOT EXISTS request_fulfillments (
                fulfillment_id SERIAL PRIMARY KEY,
                request_id INT REFERENCES blood_requests(request_id) ON DELETE CASCADE,
                bank_id INT REFERENCES blood_banks(bank_id) ON DELETE SET NULL,
                donor_id INT REFERENCES donors(donor_id) ON DELETE SET NULL,
                units_provided INT NOT NULL,
                fulfilled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT
            );
        `);
        console.log('✅ request_fulfillments table created');

        console.log('\n🎉 ALL TABLES CREATED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

createTables();
