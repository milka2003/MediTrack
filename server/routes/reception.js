const express = require('express');
const Patient = require('../models/Patient');
const { authAny, requireStaff } = require('../middleware/auth');
const { sendWhatsAppMessage } = require('../utils/messaging');
const { nextSeq } = require('../utils/counters');

const router = express.Router();

// POST /api/reception/add-patient
router.post('/add-patient', authAny, requireStaff(['Reception','Admin']), async (req, res) => {
  try {
    const payload = req.body || {};

    // Basic validation
    const errors = [];
    const firstName = String(payload.firstName || '').trim();
    const lastName = payload.lastName ? String(payload.lastName).trim() : '';
    const phone = String(payload.phone || '').trim();
    const email = payload.email ? String(payload.email).trim() : '';
    const dob = payload.dob ? new Date(payload.dob) : null;
    const gender = payload.gender ? String(payload.gender).trim() : '';
    const address = payload.address ? String(payload.address).trim() : '';

    if (!firstName || firstName.length < 2) {
      errors.push('First name is required (min 2 characters)');
    }

    // Allow 10–15 digits; accept + at start but store digits only
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10 || phoneDigits.length > 15) {
      errors.push('Valid phone number is required');
    }

    if (email) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) errors.push('Email format is invalid');
    }

    if (dob && isNaN(dob.getTime())) {
      errors.push('Date of birth is invalid');
    }

    if (dob && dob > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }

    if (gender && !['Male','Female','Other'].includes(gender)) {
      errors.push('Gender must be Male, Female, or Other');
    }

    if (address && address.length > 300) {
      errors.push('Address is too long');
    }

    if (errors.length) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    // Prepare create payload
    const createPayload = {
      firstName,
      lastName,
      phone: phoneDigits, // store digits-only for consistency
      email: email || undefined,
      dob: dob || undefined,
      gender: gender || undefined,
      address: address || undefined,
    };

    // Derive age if dob present
    if (dob && !payload.age) {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      createPayload.age = age;
    } else if (typeof payload.age === 'number') {
      createPayload.age = payload.age;
    }

    // Generate OP number atomically: format YY-seq (e.g. 25-1062)
    const year = new Date().getFullYear().toString().slice(-2);
    const seq = await nextSeq(`op_${year}`);
    createPayload.opNumber = `${year}-${seq}`;

    // Save patient
    const patient = await Patient.create(createPayload);

    // ✅ Send WhatsApp message with OP number (safe)
    try {
      let toPhone = patient.phone;
      if (!String(toPhone).startsWith('+')) toPhone = '+91' + toPhone;

      await sendWhatsAppMessage(
        toPhone,
        `Hello ${patient.firstName}, your Hospital OP number is: ${patient.opNumber}. Please keep this number for all future visits.`
      );
    } catch (smsErr) {
      console.error('WhatsApp sending failed:', smsErr.message);
    }

    res.json({
      message: 'Patient registered successfully',
      patient: {
        id: patient._id,
        name: patient.firstName,
        phone: patient.phone,
        opNumber: patient.opNumber
      }
    });
  } catch (err) {
    console.error('Add-patient error:', err); // log full error stack
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// 🔍 GET /api/patients/search?q=...
router.get("/search", authAny, requireStaff(["Reception", "Admin"]), async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.status(400).json({ message: "Query required" });

    const patient = await Patient.findOne({
      $or: [{ opNumber: q }, { phone: q }]
    });

    if (!patient) return res.status(404).json({ message: "Patient not found" });

    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Reception dashboard quick stats
router.get('/stats/today', authAny, requireStaff(['Reception','Admin']), async (req, res) => {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    const [registrationsToday, visitsToday] = await Promise.all([
      require('../models/Patient').countDocuments({ createdAt: { $gte: start, $lte: end } }),
      require('../models/Visit').countDocuments({ appointmentDate: { $gte: start, $lte: end } }),
    ]);

    // Pending bills not modeled yet; return 0 for now
    const pendingBills = 0;
    const messages = 0;

    res.json({ registrationsToday, visitsToday, pendingBills, messages });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch stats', error: e.message });
  }
});

module.exports = router;
