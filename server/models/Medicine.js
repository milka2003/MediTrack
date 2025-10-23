// models/Medicine.js
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Tablet', 'Syrup', 'Capsule', 'Injection', 'Ointment', 'Drops', 'Other'], required: true },
  strength: { type: String, trim: true }, // e.g., "500mg"
  unit: { type: String, enum: ['tab', 'bottle', 'caps', 'amp', 'tube', 'ml', 'pack', 'other'], required: true },
  manufacturer: { type: String, trim: true },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 }, // threshold for low-stock alert
  expiryDate: { type: Date }, // simplified single expiry per item (could be per-batch in future)
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

medicineSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Medicine', medicineSchema);