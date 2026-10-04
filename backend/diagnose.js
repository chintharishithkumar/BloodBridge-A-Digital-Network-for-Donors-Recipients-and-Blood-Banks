const http = require('http');

function post(path, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        const req = http.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function testRegistration() {
    console.log("\n=== TESTING REGISTRATION API ===\n");

    // Test: Register a new donor with ALL fields
    const testData = {
        full_name: "Test Donor Debug",
        email: `testdebug_${Date.now()}@test.com`,
        phone: "9999999999",
        password: "test123",
        role: "donor",
        city: "Hyderabad",
        state: "Telangana",
        blood_group: "B+",
        date_of_birth: "1995-06-15",
        gender: "Male",
        weight_kg: 72,
        medical_conditions: "Diabetes",
        id_proof_number: "1234-5678-9012"
    };

    console.log("Sending registration with data:");
    console.log(JSON.stringify(testData, null, 2));

    const result = await post('/api/auth/register', testData);
    console.log("\nRegistration response:", result.status, JSON.stringify(result.body, null, 2));

    process.exit(0);
}

testRegistration().catch(err => {
    console.error("FATAL:", err.message);
    process.exit(1);
});
