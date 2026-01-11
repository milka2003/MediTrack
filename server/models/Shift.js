const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  staffName: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['Doctor', 'Nurse', 'Lab', 'Lab Technician', 'Pharmacist', 'Reception', 'Billing', 'Admin'],
    required: [true, 'Role is required']
  },
  shiftDate: {
    type: String,
    required: [true, 'Shift date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Shift', shiftSchema);
