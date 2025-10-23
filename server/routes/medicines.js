// routes/medicines.js
const express = require('express');
const { authAny, requireStaff } = require('../middleware/auth');
const Medicine = require('../models/Medicine');

const router = express.Router();

// Create medicine
router.post('/', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  try {
    const doc = await Medicine.create(req.body);
    res.json({ message: 'Medicine created', medicine: doc });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to create medicine' });
  }
});

// List medicines with optional search & active filter
router.get('/', authAny, requireStaff(['Pharmacist','Admin','Doctor']), async (req, res) => {
  try {
    const { q, search, active } = req.query;
    const term = typeof search === 'string' ? search : q;
    const filter = {};
    if (term && term.length >= 2) filter.name = { $regex: term, $options: 'i' };
    if (active === 'true') filter.active = true;
    if (active === 'false') filter.active = false;
    const list = await Medicine.find(filter).sort({ name: 1 }).limit(20);
    res.json({ medicines: list });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch medicines' });
  }
});

// Get single
router.get('/:id', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  const doc = await Medicine.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ medicine: doc });
});

// Update
router.put('/:id', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  try {
    const doc = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Medicine updated', medicine: doc });
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to update medicine' });
  }
});

// Soft toggle active
router.delete('/:id/toggle', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  const doc = await Medicine.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  doc.active = !doc.active;
  await doc.save();
  res.json({ message: 'Toggled', medicine: doc });
});

// Stock adjust (increment/decrement)
// Body: { delta: number }
router.patch('/:id/stock', authAny, requireStaff(['Pharmacist','Admin']), async (req, res) => {
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ message: 'delta must be number' });
  const doc = await Medicine.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  doc.stock = Math.max(0, (doc.stock || 0) + delta);
  await doc.save();
  res.json({ message: 'Stock updated', medicine: doc });
});

module.exports = router;