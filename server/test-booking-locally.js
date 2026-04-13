const mongoose = require('mongoose');
const Visit = require('./models/Visit');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const StaffShiftMapping = require('./models/StaffShiftMapping');
const { nextSeq } = require('./utils/counters');

async function test() {
  try {
    const mongoUri = 'mongodb+srv://meditrack_user:milka777@cluster0.89mtoxr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Simulate what's in the route
    const doctorId = '68c1ac573927a98209fb0283';
    const patientId = '68c2a82e756488c77064545d';
    const date = '2026-03-18';

    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId).populate('user');
    
    console.log('Patient OP:', patient.opNumber);
    console.log('Doctor Name:', doctor.user.name);

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const startDate = new Date(bookingDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(bookingDate);
    endDate.setHours(23, 59, 59, 999);

    console.log('Searching for duplicates in range:', startDate.toISOString(), 'to', endDate.toISOString());

    const existingBooking = await Visit.findOne({
      patientId: patient._id,
      doctorId: doctorId,
      appointmentDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['Registered', 'VitalsCompleted', 'ReadyForConsultation', 'InConsultation', 'open'] }
    });

    console.log('Existing booking found?', !!existingBooking);
    
    // Attempt sequence generation
    const dateKey = new Date(date).toISOString().slice(0, 10);
    const counterKey = `token_${doctorId}_${dateKey}`;
    const seq = await nextSeq(counterKey);
    console.log('Next Token Seq:', seq);

    // Attempt creation
    console.log('Attempting Visit.create...');
    try {
        const visit = await Visit.create({
            patientId: patient._id,
            opNumber: patient.opNumber,
            departmentId: doctor.department,
            doctorId,
            tokenNumber: seq,
            appointmentDate: bookingDate,
            status: 'Registered'
        });
        console.log('Created visit successfully:', visit._id);
    } catch (err) {
        console.log('Create failed as expected or error:', err.name, err.code, err.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('Test FAILED:', err);
    process.exit(1);
  }
}

test();
