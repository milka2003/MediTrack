const mongoose = require('mongoose');

const shiftTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Shift template name is required'],
    enum: ['Morning', 'Evening', 'Night', 'Custom'],
    trim: true,
    unique: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: /^([01]\d|2[0-3]):[0-5]\d$/
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: /^([01]\d|2[0-3]):[0-5]\d$/
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

module.exports = mongoose.model('ShiftTemplate', shiftTemplateSchema);
