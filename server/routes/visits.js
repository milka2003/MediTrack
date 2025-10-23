// routes/visits.js
const express = require('express');
const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { authAny, requireStaff } = require('../middleware/auth');
const { nextSeq } = require('../utils/counters');
const { sendWhatsAppMessage } = require('../utils/messaging'); // WhatsApp messaging
const router = express.Router();

/**
 * POST /api/visits
 * body: { opNumber or patientId, doctorId, departmentId (optional), date: 'YYYY-MM-DD', slot?: { day, startTime, endTime } }
 * Requires reception or admin
 */
router.post('/', authAny, requireStaff(['Reception','Admin']), async (req, res) => {
  try {
    const { opNumber, patientId, doctorId, departmentId, date, slot } = req.body;
    if (!doctorId || (!opNumber && !patientId) || !date) {
      return res.status(400).json({ message: 'Missing required fields (doctorId, date, opNumber/patientId)' });
    }

    // resolve patient
    let patient;
    if (patientId) patient = await Patient.findById(patientId);
    else patient = await Patient.findOne({ opNumber });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.active) return res.status(400).json({ message: 'Doctor not found or inactive' });

    // Step 1 – Reject Past Dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date);
    if (bookingDate < today) {
      return res.status(400).json({ message: 'Cannot book past dates' });
    }

    // Step 2 – Validate Doctor’s Day Schedule
    const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = (doctor.schedule || []).filter(s => s.day === dayOfWeek);
    if (daySchedule.length === 0) {
      return res.status(400).json({ message: 'Doctor not available on this day' });
    }

    // Step 3 – Check Slot Time Window & Step 4 – Prevent Expired Slots Today & Step 5 – Respect Max Patients
    if (slot) {
      // Step 3: Check if slot fits inside doctor's available hours
      const matching = daySchedule.some(s => s.startTime <= slot.startTime && s.endTime >= slot.endTime);
      if (!matching) {
        return res.status(400).json({ message: 'Doctor not available in this time window' });
      }

      // Step 4: Prevent expired slots today
      if (bookingDate.toDateString() === today.toDateString()) {
        const now = new Date();
        const [endH, endM] = slot.endTime.split(':').map(Number);
        const slotEnd = new Date(bookingDate);
        slotEnd.setHours(endH, endM, 0, 0);
        if (now > slotEnd) {
          return res.status(400).json({ message: 'Doctor’s consultation time is over for today' });
        }
      }

      // Step 5: Respect max patients
      const possible = daySchedule.filter(s =>
        s.startTime <= slot.startTime && s.endTime >= slot.endTime && s.maxPatients && s.maxPatients > 0
      );
      for (const s of possible) {
        const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
        const count = await Visit.countDocuments({
          doctorId,
          appointmentDate: { $gte: dayStart, $lte: dayEnd },
          'slot.startTime': s.startTime,
          'slot.endTime': s.endTime,
          status: { $ne: 'cancelled' }
        });
        if (count >= s.maxPatients) {
          return res.status(400).json({ message: `Selected slot is full (max ${s.maxPatients})` });
        }
      }
    }
    // If no slot, no further checks needed as day availability is already validated in Step 2

    // generate token: per doctor per day
    const dateKey = new Date(date).toISOString().slice(0,10); // YYYY-MM-DD
    const counterKey = `token_${doctorId}_${dateKey}`;
    const seq = await nextSeq(counterKey);

    // create visit
    const visit = await Visit.create({
      patientId: patient._id,
      opNumber: patient.opNumber,
      departmentId: departmentId || doctor.department,
      doctorId,
      tokenNumber: seq,
      appointmentDate: new Date(date),
      slot: slot || undefined,
      status: 'open'
    });

    // optional WhatsApp notification
    if (patient.phone) {
      try {
        const doctorName = doctor.user?.name || doctor._id;
        const tokenNumber = seq;
        const appointmentDate = date;
        await sendWhatsAppMessage(
          patient.phone,
          `Dear ${patient.firstName}, your visit with Dr. ${doctorName} on ${appointmentDate} has been confirmed. Token: ${tokenNumber}`
        );
      } catch (e) {
        // don't fail the whole request for messaging errors
        console.warn('WhatsApp send failed', e.message);
      }
    }

    return res.json({ message: 'Visit created', visit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/visits?doctorId=&date=&status=
 * accessible to staff
 */
router.get('/', authAny, requireStaff(['Reception','Admin','Doctor','Nurse','Lab','Pharmacist','Billing']), async (req, res) => {
  const { doctorId, date, status } = req.query;
  const q = {};
  if (doctorId) q.doctorId = doctorId;
  if (status) q.status = status;
  if (date) {
    const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
    q.appointmentDate = { $gte: dayStart, $lte: dayEnd };
  }
  const visits = await Visit.find(q)
    .populate('patientId','firstName lastName opNumber phone age gender')
    .populate({ path: 'doctorId', populate: { path: 'user department', select: 'name username email name' } })
    .sort({ tokenNumber: 1 });
  res.json({ visits });
});

/**
 * PATCH /api/visits/:id/status  { status: 'closed'|'cancelled' }
 */
router.patch('/:id/status', authAny, requireStaff(['Reception','Admin','Billing','Doctor']), async (req, res) => {
  const { status } = req.body;
  if (!['open','closed','cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const visit = await Visit.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!visit) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Status updated', visit });
});

/**
 * PUT /api/visits/:id/vitals  { bp, temperature, oxygen, weight }
 */
router.put('/:id/vitals', authAny, requireStaff(['Nurse','Admin']), async (req, res) => {
  const { bp, temperature, oxygen, weight } = req.body;
  const vitals = { bp, temperature, oxygen, weight, recordedAt: new Date() };
  const visit = await Visit.findByIdAndUpdate(req.params.id, { vitals }, { new: true });
  if (!visit) return res.status(404).json({ message: 'Visit not found' });
  res.json({ message: 'Vitals recorded', visit });
});

module.exports = router;
