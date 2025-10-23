// routes/labTests.js
const express = require('express');
const mongoose = require('mongoose');
const { authAny, requireStaff } = require('../middleware/auth');
const LabTest = require('../models/LabTest');

const router = express.Router();

// CREATE
router.post('/', authAny, requireStaff(['Admin','Lab']), async (req, res) => {
  try {
    const t = await LabTest.create(req.body);
    res.json({ message: 'Lab test created', test: t });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// LIST with filters: q, department, status
router.get('/', authAny, requireStaff(['Admin','Lab','Doctor']), async (req, res) => {
  const { q, department, status = 'Active' } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (q) filter.name = new RegExp(q, 'i');
  const tests = await LabTest.find(filter).populate('department', 'name').sort({ name: 1 });
  res.json({ tests });
});

// READ one
router.get('/:id', authAny, requireStaff(['Admin','Lab']), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  const t = await LabTest.findById(req.params.id).populate('department','name');
  if (!t) return res.status(404).json({ message: 'Not found' });
  res.json({ test: t });
});

// UPDATE
router.put('/:id', authAny, requireStaff(['Admin','Lab']), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  try {
    const t = await LabTest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!t) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', test: t });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// TOGGLE Active/Inactive
router.post('/:id/toggle', authAny, requireStaff(['Admin','Lab']), async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  const t = await LabTest.findById(req.params.id);
  if (!t) return res.status(404).json({ message: 'Not found' });
  t.status = t.status === 'Active' ? 'Inactive' : 'Active';
  await t.save();
  res.json({ message: 'Toggled', test: t });
});

module.exports = router;