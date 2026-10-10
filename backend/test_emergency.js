const pool = require('./config/db');

async function testEmergencyInsert() {
  try {
    console.log('Testing emergency insert...');
    const result = await pool.query(
      `INSERT INTO blood_requests (recipient_id, blood_group, units_required, units_needed, emergency, urgency_level, is_guest, hospital_name, patient_name, contact_phone, location, notes, status, request_date)
       VALUES (NULL, $1, $2, COALESCE($2, 1), true, 'critical', true, $3, $4, $5, $6, $7, 'PENDING', NOW())
       RETURNING *`,
      ['O+', 2, 'Apollo Hospital', 'Test Patient', '9876543210', 'Hyderabad', 'Test emergency']
    );
    console.log('SUCCESS - Inserted row:');
    console.log(JSON.stringify(result.rows[0], null, 2));
  } catch (e) {
    console.error('DB INSERT ERROR:', e.message);
    console.error('Detail:', e.detail);
    console.error('Code:', e.code);
    console.error('Table columns issue? Let me check the schema...');

    // Check table structure
    try {
      const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'blood_requests'
        ORDER BY ordinal_position
      `);
      console.log('\nblood_requests columns:');
      cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable} default=${c.column_default}`));
    } catch (e2) {
      console.error('Could not check schema:', e2.message);
    }
  } finally {
    pool.end();
  }
}

testEmergencyInsert();
