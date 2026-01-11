const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskType: {
    type: String,
    enum: ['Lab Test', 'Pharmacy'],
    required: [true, 'Task type is required']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true
  },
  assignedTo: {
    type: String,
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Lab Technician', 'Pharmacist'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Pending - No Staff Available'],
    default: 'Pending'
  },
  relatedVisitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    default: null
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

module.exports = mongoose.model('Task', taskSchema);
