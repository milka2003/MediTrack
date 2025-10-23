const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, required: true },
  role: { type: String, enum: ['Admin','Reception','Doctor','Nurse','Lab','Pharmacist','Billing'], required: true },
  passwordHash: { type: String, required: true },
  firstLogin: { type: Boolean, default: true },
  status: { type: String, enum: ['active','disabled'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
