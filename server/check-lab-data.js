
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Consultation = require('./models/Consultation');
const Patient = require('./models/Patient');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const consultations = await Consultation.find({});
    console.log(`Total consultations: ${consultations.length}`);

    for (const c of consultations) {
      if (c.labRequests && c.labRequests.length > 0) {
        console.log(`Consultation ${c._id} (visit: ${c.visitId}) has ${c.labRequests.length} lab requests.`);
        c.labRequests.forEach((r, i) => {
          console.log(`  [${i}] ${r.testName} - Status: ${r.status}`);
        });
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
