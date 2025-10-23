// Test script to verify nurse workflow
const mongoose = require('mongoose');
const Visit = require('./models/Visit');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
require('dotenv').config();

async function testNurseWorkflow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if there are any visits for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayVisits = await Visit.find({
      appointmentDate: { $gte: today, $lt: tomorrow }
    })
    .populate('patientId', 'firstName lastName opNumber age gender')
    .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } });

    console.log(`\nFound ${todayVisits.length} visits for today:`);
    todayVisits.forEach(visit => {
      console.log(`- Token ${visit.tokenNumber}: ${visit.patientId?.firstName} ${visit.patientId?.lastName} (${visit.patientId?.opNumber}) - Status: ${visit.status}`);
      console.log(`  Doctor: ${visit.doctorId?.user?.name || 'Unknown'}`);
      console.log(`  Vitals: ${visit.vitals ? 'Recorded' : 'Not recorded'}`);
      if (visit.vitals) {
        console.log(`    BP: ${visit.vitals.bp}, Temp: ${visit.vitals.temperature}, O2: ${visit.vitals.oxygen}, Weight: ${visit.vitals.weight}`);
      }
      console.log('');
    });

    // Check total visits in database
    const totalVisits = await Visit.countDocuments();
    console.log(`Total visits in database: ${totalVisits}`);

    // Check patients and doctors
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    console.log(`Total patients: ${totalPatients}`);
    console.log(`Total doctors: ${totalDoctors}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testNurseWorkflow();