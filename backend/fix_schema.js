const pool = require('./config/db');

async function fixSchema() {
  try {
    console.log('Adding missing urgency_level column to blood_requests...');
    await pool.query(`ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(50) DEFAULT 'normal'`);
    console.log('✅ urgency_level column added/verified!');

    // Verify the fix works
    console.log('\nRunning emergency insert test...');
    const result = await pool.query(
      `INSERT INTO blood_requests
       (recipient_id, blood_group, units_required, units_needed, emergency, urgency_level, is_guest,
        hospital_name, patient_name, contact_phone, location, notes, status, request_date)
       VALUES (NULL, $1, $2, COALESCE($2, 1), true, 'critical', true, $3, $4, $5, $6, $7, 'PENDING', NOW())
       RETURNING request_id, blood_group, hospital_name, status`,
      ['O+', 2, 'Apollo Hospital', 'Test Patient', '9876543210', 'Hyderabad', 'Test emergency']
    );
    console.log('✅ Emergency insert SUCCESSFUL! Row:', result.rows[0]);
    
    // Clean up test row
    await pool.query('DELETE FROM blood_requests WHERE request_id = $1', [result.rows[0].request_id]);
    console.log('✅ Test row cleaned up. Emergency requests will now work!');
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    pool.end();
  }
}

fixSchema();
