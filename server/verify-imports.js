try {
  require('./models/ShiftTemplate');
  console.log('✓ ShiftTemplate model OK');
  
  require('./models/StaffShiftMapping');
  console.log('✓ StaffShiftMapping model OK');
  
  require('./utils/shiftResolver');
  console.log('✓ shiftResolver utility OK');
  
  require('./routes/task.routes');
  console.log('✓ task.routes.js OK');
  
  require('./routes/admin');
  console.log('✓ admin.js OK');
  
  console.log('\n✓ All imports successful!');
  process.exit(0);
} catch (error) {
  console.error('✗ Import failed:', error.message);
  process.exit(1);
}
