
const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Consultation = require('./server/models/Consultation');
const Patient = require('./server/models/Patient');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const consultations = await Consultation.find({});
    console.log(`Total consultations: ${consultations.length}`);

    for (const c of consultations) {
      if (c.labRequests && c.labRequests.length > 0) {
        console.log(`Consultation ${c._id} has ${c.labRequests.length} lab requests. Statuses: ${c.labRequests.map(r => r.status).join(', ')}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
