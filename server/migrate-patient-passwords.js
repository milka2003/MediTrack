/**
 * Migration Script: Generate passwords for existing patients
 * Run this once to enable portal access for all existing patients
 * 
 * Usage: node migrate-patient-passwords.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Patient = require('./models/Patient');
const { generateTempPassword } = require('./utils/generatePassword');

async function migratePatients() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find all patients without passwordHash
    const patientsWithoutPassword = await Patient.find({
      $or: [
        { passwordHash: { $exists: false } },
        { passwordHash: null },
        { passwordHash: '' }
      ]
    });

    console.log(`\n📊 Found ${patientsWithoutPassword.length} patients without passwords`);

    if (patientsWithoutPassword.length === 0) {
      console.log('✅ All patients already have passwords!');
      await mongoose.connection.close();
      return;
    }

    // Generate passwords and update
    const results = [];
    for (let patient of patientsWithoutPassword) {
      try {
        const tempPassword = generateTempPassword(10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        patient.passwordHash = passwordHash;
        patient.portalAccess = true;
        await patient.save();

        results.push({
          name: `${patient.firstName} ${patient.lastName}`,
          opNumber: patient.opNumber,
          phone: patient.phone,
          password: tempPassword // Only shown once during migration
        });

        console.log(`✅ Updated: ${patient.firstName} ${patient.lastName} (${patient.opNumber})`);
      } catch (err) {
        console.error(`❌ Failed to update ${patient.firstName}: ${err.message}`);
      }
    }

    // Save results to file for reference
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `migrated-patient-passwords-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));

    console.log(`\n✅ Migration complete!`);
    console.log(`📁 Results saved to: ${filename}`);
    console.log(`\n📋 Summary:`);
    console.log(`   - Patients updated: ${results.length}`);
    console.log(`   - Portal access enabled: ${results.length}`);
    console.log(`\n⚠️  IMPORTANT: Share the passwords from ${filename} with patients via WhatsApp or phone`);

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

// Run migration
migratePatients();