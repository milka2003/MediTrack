const mongoose = require('mongoose');

const staffShiftMappingSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Staff ID is required']
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
  shiftTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShiftTemplate',
    required: [true, 'Shift template ID is required']
  },
  effectiveFrom: {
    type: Date,
    required: [true, 'Effective from date is required']
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

staffShiftMappingSchema.index({ staffId: 1, effectiveFrom: 1 });
staffShiftMappingSchema.index({ shiftTemplateId: 1, isActive: 1 });

module.exports = mongoose.model('StaffShiftMapping', staffShiftMappingSchema);
