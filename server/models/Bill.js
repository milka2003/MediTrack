// models/Bill.js
const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['consultation', 'lab', 'pharmacy', 'manual'], default: 'manual' }, // for future integration
  referenceId: mongoose.Schema.Types.ObjectId // e.g., labTestId, medicineId, etc.
}, { _id: false });

const billSchema = new mongoose.Schema({
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  items: [billItemSchema],
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Unpaid', 'Partial'], default: 'Unpaid' },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Netbanking', 'Online'], default: 'Cash' },
  // Razorpay tracking fields
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paymentSource: { type: String, enum: ['upi', 'card', 'netbanking', 'cash'] },
  createdAt: { type: Date, default: Date.now },
  generatedAt: { type: Date },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'lastUpdated' } });

// Pre-save hook to calculate totals
billSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.balance = this.totalAmount - this.paidAmount;
  if (this.balance <= 0) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Unpaid';
  }
  if (!this.generatedAt) {
    this.generatedAt = this.createdAt || new Date();
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Bill', billSchema);