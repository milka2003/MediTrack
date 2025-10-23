const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    required: true,
  },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "12:00"
  maxPatients: { type: Number, default: 0 },   // optional limit per slot
});

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },  // Staff account
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },

  specialization: { type: String },
  qualification: { type: String },
  experience: { type: String },  // could also be Number (years)
  registrationNumber: { type: String },
  consultationFee: { type: Number, default: 0 },

  schedule: [scheduleSchema],

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Doctor", doctorSchema);
