// models/Visit.js
const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  day: String,         // e.g. "Monday"
  startTime: String,   // "09:00"
  endTime: String      // "12:00"
}, { _id: false });

const vitalsSchema = new mongoose.Schema({
  bp: String,           // e.g., "120/80"
  temperature: String,  // e.g., "98.6 F"
  oxygen: String,       // e.g., "98%"
  weight: String,       // e.g., "65 kg"
  recordedAt: { type: Date, default: Date.now }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicineName: String, // denormalized for quick display
  quantity: { type: Number, default: 1 },
  dosage: String,
  instructions: String
}, { _id: false });

const visitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  opNumber: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  tokenNumber: { type: Number, required: true },
  appointmentDate: { type: Date, required: true }, // date portion used for per-day token
  slot: slotSchema, // optional — if receptionist picks a slot
  status: { type: String, enum: ['open','closed','cancelled','no-show'], default: 'open' },
  vitals: vitalsSchema, // vitals recorded by nurse

  // New: prescriptions stored at visit-level for pharmacy workflow
  prescriptions: [prescriptionSchema],
  prescriptionStatus: { type: String, enum: ['none','pending','completed'], default: 'none' },
  dispensedAt: Date,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visit', visitSchema);
