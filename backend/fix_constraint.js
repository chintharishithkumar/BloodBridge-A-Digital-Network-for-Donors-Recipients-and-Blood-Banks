require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

async function fixConstraint() {
    try {
        // Check current constraint
        const check = await pool.query(
            `SELECT conname, pg_get_constraintdef(oid) as def 
             FROM pg_constraint 
             WHERE conname = 'users_role_check'`
        );
        console.log('Current constraint:', JSON.stringify(check.rows));

        // Drop old constraint
        await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
        console.log('Dropped old constraint');

        // Update any existing uppercase roles
        const upd = await pool.query(`UPDATE users SET role = LOWER(role) WHERE role != LOWER(role)`);
        console.log('Updated rows:', upd.rowCount);

        // Add new lowercase constraint
        await pool.query(`
            ALTER TABLE users ADD CONSTRAINT users_role_check 
            CHECK (role IN ('donor', 'recipient', 'blood_bank', 'admin'))
        `);
        console.log('New lowercase constraint added!');

        // Verify
        const verify = await pool.query(
            `SELECT conname, pg_get_constraintdef(oid) as def 
             FROM pg_constraint 
             WHERE conname = 'users_role_check'`
        );
        console.log('Verified constraint:', JSON.stringify(verify.rows));

    } catch(e) {
        console.error('ERROR:', e.message);
    } finally {
        await pool.end();
    }
}

fixConstraint();
