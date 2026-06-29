const assert = require('assert');
const db = require('../backend-node/db');
const resolvers = require('../backend-node/resolvers');

// Save original query function
const originalQuery = db.query;

// Mock database query returns
db.query = async (text, params) => {
  if (text.includes('SELECT * FROM users WHERE id = $1')) {
    return {
      rows: [{
        id: 1,
        name: 'Sarah Connor',
        age: 34,
        gender: 'Female',
        language: 'en',
        reminder_channel: 'Telegram',
        created_at: new Date('2026-06-29T10:00:00Z')
      }]
    };
  }
  
  if (text.includes('SELECT * FROM medical_profiles WHERE user_id = $1')) {
    return {
      rows: [{
        id: 1,
        user_id: 1,
        allergies: ['NSAIDs'],
        conditions: ['Hypertension'],
        pregnancy_status: false,
        emergency_contacts: { name: 'John Connor', relation: 'Son' }
      }]
    };
  }
  
  if (text.includes('SELECT * FROM prescriptions WHERE user_id = $1')) {
    return {
      rows: [{
        id: 1,
        user_id: 1,
        uploaded_at: new Date('2026-06-29T11:00:00Z'),
        ocr_raw: 'Mock OCR content',
        verified: true
      }]
    };
  }

  return { rows: [] };
};

async function runTests() {
  console.log('--- 🔬 Running Node.js GraphQL Resolvers Tests 🔬 ---');
  
  try {
    // 1. Test getUser resolver
    console.log('Testing Query.getUser resolver...');
    const user = await resolvers.Query.getUser(null, { id: '1' });
    assert.ok(user);
    assert.strictEqual(user.name, 'Sarah Connor');
    assert.strictEqual(user.reminderChannel, 'Telegram');
    console.log('  * Query getUser passed!');

    // 2. Test User.medicalProfile resolver
    console.log('Testing User.medicalProfile field resolver...');
    const profile = await resolvers.User.medicalProfile({ id: '1' });
    assert.ok(profile);
    assert.deepStrictEqual(profile.allergies, ['NSAIDs']);
    assert.deepStrictEqual(profile.conditions, ['Hypertension']);
    assert.strictEqual(profile.pregnancyStatus, false);
    console.log('  * User medicalProfile resolver passed!');

    // 3. Test User.prescriptions resolver
    console.log('Testing User.prescriptions field resolver...');
    const prescriptions = await resolvers.User.prescriptions({ id: '1' });
    assert.ok(prescriptions);
    assert.strictEqual(prescriptions.length, 1);
    assert.strictEqual(prescriptions[0].ocrRaw, 'Mock OCR content');
    console.log('  * User prescriptions resolver passed!');

    console.log('\n✅ All Node.js GraphQL resolver tests completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Assertions Failed:', err.message);
    process.exit(1);
  } finally {
    // Restore original query function
    db.query = originalQuery;
  }
}

runTests().catch(err => {
  console.error('\n❌ Unexpected resolver test execution error:', err);
  process.exit(1);
});
