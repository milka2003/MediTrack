const mongoose = require('mongoose');
const Doctor = require('./server/models/Doctor');
const User = require('./server/models/User');
const StaffShiftMapping = require('./server/models/StaffShiftMapping');
const ShiftTemplate = require('./server/models/ShiftTemplate');

async function checkDoctor() {
  try {
    // Check .env for mongo uri if needed, but assuming localhost default
    await mongoose.connect('mongodb://localhost:27017/meditrack');
    
    const user = await User.findOne({ name: /Regi Jacob/i });
    if (!user) {
      console.log('Doctor user not found');
      return;
    }
    
    const doctor = await Doctor.findOne({ user: user._id });
    const mapping = await StaffShiftMapping.findOne({ staffId: user._id, isActive: true }).populate('shiftTemplateId');
    
    console.log('--- Doctor Information ---');
    console.log('Name:', user.name);
    console.log('Doctor ID:', doctor._id);
    console.log('Schedule:', JSON.stringify(doctor.schedule, null, 2));
    console.log('Shift Mapping:', JSON.stringify(mapping, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkDoctor();
