// routes/pharmacy.js
const express = require('express');
const { authAny, requireStaff } = require('../middleware/auth');
const Visit = require('../models/Visit');
const Medicine = require('../models/Medicine');

const router = express.Router();

// GET /api/pharmacy/prescriptions?status=pending
router.get('/prescriptions', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  const { status = 'pending' } = req.query;
  const filter = {};
  if (status === 'pending') filter.prescriptionStatus = 'pending';
  if (status === 'completed') filter.prescriptionStatus = 'completed';
  const visits = await Visit.find(filter)
    .sort({ appointmentDate: -1 })
    .populate('patientId','firstName lastName opNumber')
    .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } });
  res.json({ items: visits });
});

// POST /api/pharmacy/dispense/:visitId
// Body: { items: [{ medicineId, quantity }] }
router.post('/dispense/:visitId', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  const { visitId } = req.params;
  const visit = await Visit.findById(visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found' });
  if (!Array.isArray(visit.prescriptions) || visit.prescriptions.length === 0) {
    return res.status(400).json({ message: 'No prescriptions to dispense' });
  }

  const items = req.body.items || visit.prescriptions.map(p => ({ medicineId: p.medicineId, quantity: p.quantity || 1 }));

  // Adjust stock for each medicine
  for (const it of items) {
    if (!it.medicineId) continue;
    const m = await Medicine.findById(it.medicineId);
    if (!m) continue;
    const q = Math.max(0, it.quantity || 1);
    m.stock = Math.max(0, (m.stock || 0) - q);
    await m.save();
  }

  visit.prescriptionStatus = 'completed';
  visit.dispensedAt = new Date();
  await visit.save();

  res.json({ message: 'Dispensed', visit });
});

// GET /api/pharmacy/reports/stock
router.get('/reports/stock', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  const now = new Date();
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  const items = await Medicine.find({}).sort({ name: 1 });
  const data = items.map(m => ({
    _id: m._id,
    name: m.name,
    strength: m.strength,
    unit: m.unit,
    stock: m.stock || 0,
    minStock: m.minStock || 0,
    expiryDate: m.expiryDate || null,
    lowStock: (m.stock || 0) <= (m.minStock || 0),
    nearExpiry: m.expiryDate ? (m.expiryDate <= soon && m.expiryDate >= now) : false,
    expired: m.expiryDate ? (m.expiryDate < now) : false,
  }));
  res.json({ items: data });
});

// GET /api/pharmacy/reports/dispensing?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/reports/dispensing', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  const { from, to } = req.query;
  const filter = { prescriptionStatus: 'completed' };
  if (from || to) {
    const start = from ? new Date(from) : new Date('1970-01-01');
    const end = to ? new Date(to) : new Date();
    end.setHours(23,59,59,999);
    filter.dispensedAt = { $gte: start, $lte: end };
  }
  const visits = await Visit.find(filter)
    .sort({ dispensedAt: -1 })
    .populate('patientId','firstName lastName opNumber')
    .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } });

  // Transform into medicine-level rows
  const rows = [];
  for (const v of visits) {
    for (const p of v.prescriptions || []) {
      rows.push({
        date: v.dispensedAt,
        medicineName: p.medicineName,
        quantity: p.quantity || 1,
        patient: { opNumber: v.opNumber, name: `${v.patientId?.firstName || ''} ${v.patientId?.lastName || ''}`.trim() },
        doctorName: v.doctorId?.user?.name,
        visitId: v._id,
        medicineId: p.medicineId,
      });
    }
  }
  res.json({ items: rows });
});

module.exports = router;