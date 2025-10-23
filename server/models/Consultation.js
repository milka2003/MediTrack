const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicineName: String, // denormalized for quick display
  quantity: { type: Number, default: 1 },
  dosage: String,
  instructions: String
}, { _id: false });

const parameterResultSchema = new mongoose.Schema({
  parameterName: { type: String, required: true },
  value: { type: String, trim: true }, // numeric value, text, or file URL
  unit: { type: String, trim: true },
  referenceRange: { type: String, trim: true },
  valueType: { type: String, enum: ['numeric', 'text', 'file'], default: 'numeric' },
  isAbnormal: { type: Boolean, default: false },
  remarks: { type: String, trim: true }
}, { _id: false });

const labRequestSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest' },
  testName: String, // denormalized for quick display and existing data
  notes: String,

  // Sample collection
  sampleCollectedAt: Date,
  sampleCollectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // staff user id

  // Results per parameter
  parameterResults: [parameterResultSchema],

  // Overall remarks and summary
  overallRemarks: String,
  summaryResult: String, // free-text summary

  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const consultationSchema = new mongoose.Schema({
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true, unique: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },

  chiefComplaints: String,
  diagnosis: String,
  treatmentPlan: String,
  prescriptions: [prescriptionSchema],
  labRequests: [labRequestSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

consultationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Consultation', consultationSchema);