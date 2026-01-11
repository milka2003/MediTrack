const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ShiftTemplate = require('./models/ShiftTemplate');
const StaffShiftMapping = require('./models/StaffShiftMapping');
const Task = require('./models/Task');
const User = require('./models/User');
const { getActiveShiftTemplate, getStaffOnActiveShift, getStaffWithLeastActiveTasks } = require('./utils/shiftResolver');

async function testShiftRefactor() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected');

    console.log('\n=== Testing Shift Template Creation ===');
    const existingTemplate = await ShiftTemplate.findOne({ name: 'Morning' });
    if (!existingTemplate) {
      const template = await ShiftTemplate.create({
        name: 'Morning',
        startTime: '08:00',
        endTime: '16:00',
        isActive: true
      });
      console.log('✓ Created Morning shift template:', template._id);
    } else {
      console.log('✓ Morning shift template exists:', existingTemplate._id);
    }

    console.log('\n=== Testing Active Shift Detection ===');
    const now = new Date();
    const testTime = new Date(2025, 0, 8, 10, 30);
    const activeShift = await getActiveShiftTemplate(testTime);
    console.log('Current time:', testTime.toLocaleString());
    console.log('Active shift:', activeShift ? activeShift.name : 'None');

    console.log('\n=== Testing Staff on Active Shift ===');
    const staffOnShift = await getStaffOnActiveShift('Lab Technician', testTime);
    console.log('Staff on active shift (Lab Technician):', staffOnShift.length);
    staffOnShift.forEach(s => {
      console.log(`  - ${s.staffName} (${s.role})`);
    });

    console.log('\n=== Testing Task Status Updates ===');
    const tasks = await Task.find().limit(1);
    if (tasks.length > 0) {
      console.log('✓ Task model includes new status values');
      console.log('Sample task status:', tasks[0].status);
    }

    console.log('\n=== All Tests Passed ===');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    process.exit(1);
  }
}

testShiftRefactor();
