const express = require('express');
const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const User = require('../models/User');
const { authAny, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.post('/shifts', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const { staffName, role, shiftDate, startTime, endTime } = req.body;

    if (!staffName || !role || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizeRole = (userRole) => {
      if (userRole === 'Lab') return 'Lab Technician';
      return userRole;
    };

    const normalizedRole = normalizeRole(role);

    const user = await User.findOne({ name: staffName });

    const shift = await Shift.create({
      staffId: user ? user._id : null,
      staffName,
      role: normalizedRole,
      shiftDate,
      startTime,
      endTime
    });

    console.log('Shift created:', shift._id, shift.staffName);
    res.json({ message: 'Shift assigned successfully', shift });
  } catch (err) {
    console.error('Create shift error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/shifts', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ createdAt: -1 });
    console.log('Fetched shifts:', shifts.length, 'shifts');
    shifts.forEach(s => console.log('Shift ID:', s._id, 'Name:', s.staffName));
    res.json({ shifts });
  } catch (err) {
    console.error('Fetch shifts error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/shifts/:id', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid shift ID format' });
    }

    const shiftExists = await Shift.findById(id);
    if (!shiftExists) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    await Shift.findByIdAndDelete(id);
    res.json({ message: 'Shift deleted successfully' });
  } catch (err) {
    console.error('Delete shift error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
