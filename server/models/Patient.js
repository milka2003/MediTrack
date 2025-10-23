const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phone: { type: String, required: true },
  email: String,
  dob: Date,
  age: Number,
  gender: String,
  address: String,

  opNumber: { type: String, unique: true }, // <-- Add this
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
