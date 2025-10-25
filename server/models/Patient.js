const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  phone: { type: String, required: true },
  email: { type: String, sparse: true },
  dob: Date,
  age: Number,
  gender: String,
  address: String,
  
  // Authentication fields
  passwordHash: String,
  portalAccess: { type: Boolean, default: false },
  lastLogin: Date,
  
  opNumber: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to check if patient has portal access
patientSchema.methods.hasPortalAccess = function() {
  return this.portalAccess && this.passwordHash;
};

module.exports = mongoose.model('Patient', patientSchema);
