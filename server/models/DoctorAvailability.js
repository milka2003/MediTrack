const mongoose = require("mongoose");

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Doctor", 
    required: true,
    unique: true
  },
  availabilityStatus: {
    type: String,
    enum: ["Available", "Busy", "OnBreak", "Unavailable"],
    default: "Unavailable"
  },
  reason: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on every save
doctorAvailabilitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
