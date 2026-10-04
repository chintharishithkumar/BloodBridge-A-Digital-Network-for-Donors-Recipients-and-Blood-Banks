require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function testRegister() {
    try {
        const passwordHash = await bcrypt.hash('password123', 10);
        const email = 'testuser_' + Date.now() + '@test.com';
        const phone = '9' + Math.floor(100000000 + Math.random()*900000000);
        
        const result = await pool.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role, city, state)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING user_id, role`,
            ['Test User', email, phone, passwordHash, 'donor', 'Hyderabad', 'Telangana']
        );
        console.log('✅ Registration SUCCESS:', result.rows[0]);

        // Cleanup
        await pool.query('DELETE FROM users WHERE email = $1', [email]);
        console.log('✅ Cleanup done');

    } catch(e) {
        console.error('❌ ERROR:', e.message);
        console.error('Detail:', e.detail);
    } finally {
        await pool.end();
    }
}

testRegister();
