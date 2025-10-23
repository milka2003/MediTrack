// models/LabTest.js
const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g., WBC, RBC, Hemoglobin
  unit: { type: String, trim: true }, // e.g., 10^9/L, g/dL
  referenceRange: { type: String, trim: true }, // e.g., "4.0-11.0", "12-16"
  valueType: { type: String, enum: ['numeric', 'text', 'file'], default: 'numeric' },
  description: { type: String, trim: true }
}, { _id: false });

const labTestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: false, default: null },
  price: { type: Number, default: 0 },
  description: { type: String, trim: true },
  sampleType: { type: String, trim: true }, // blood, urine, imaging, etc.
  parameters: [parameterSchema], // Array of test parameters
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

labTestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LabTest', labTestSchema);