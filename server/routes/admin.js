const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateTempPassword } = require('../utils/generatePassword');
const { authAny, requireStaff } = require('../middleware/auth');
const Department = require('../models/Department');
const Service = require('../models/Service');
const Doctor = require("../models/Doctor");


const router = express.Router();

// POST /api/admin/add-staff
router.post('/add-staff', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const { name, email, username, role } = req.body;
    if (!name || !username || !role) return res.status(400).json({ message: 'Missing fields' });

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      name, email, username, role, passwordHash, firstLogin: true, status: 'active'
    });

    // IMPORTANT: return temp password ONCE so admin can share securely
    res.json({
      message: 'Staff created',
      staff: { id: user._id, name: user.name, username: user.username, role: user.role },
      tempPassword
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



/* ---------- DEPARTMENTS ---------- */

// POST /api/admin/departments
router.post('/departments', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const department = await Department.create({
      name, code, description, createdBy: req.auth.id
    });

    res.json({ message: 'Department created', department });
  } catch (err) {
    // handle duplicate name nicely
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Department name already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/departments?includeInactive=true
// Allow broader read access so Lab/Test Master and Doctors can fetch departments
router.get('/departments', authAny, requireStaff(['Admin','Reception','Lab','Doctor','Pharmacy']), async (req, res) => {
  const includeInactive = String(req.query.includeInactive).toLowerCase() === 'true';
  const query = includeInactive ? {} : { active: true };
  const departments = await Department.find(query).sort({ name: 1 });
  res.json({ departments });
});

// PUT /api/admin/departments/:id
router.put('/departments/:id', authAny, requireStaff(['Admin']), async (req, res) => {
  const { name, code, description, active } = req.body;
  const update = { name, code, description, active };
  Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

  const department = await Department.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, runValidators: true }
  );

  if (!department) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Department updated', department });
});

// DELETE (soft toggle) /api/admin/departments/:id/toggle
router.delete('/departments/:id/toggle', authAny, requireStaff(['Admin']), async (req, res) => {
  const dep = await Department.findById(req.params.id);
  if (!dep) return res.status(404).json({ message: 'Not found' });

  dep.active = !dep.active;
  await dep.save();
  res.json({ message: dep.active ? 'Activated' : 'Deactivated', department: dep });
});

// Get all services
router.get('/services', authAny, requireStaff(['Admin']), async (req, res) => {
  const services = await Service.find();
  res.json({ services });
});

// Create service
router.post('/services', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.json({ message: 'Service created', service });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update service
router.put('/services/:id', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Service updated', service });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Toggle active/inactive
router.delete('/services/:id/toggle', authAny, requireStaff(['Admin']), async (req, res) => {
  const service = await Service.findById(req.params.id);
  service.active = !service.active;
  await service.save();
  res.json({ message: 'Service toggled', service });
});

/* ---------- DOCTORS ---------- */

// GET all doctors
router.get("/doctors", authAny, requireStaff(["Admin","Reception"]), async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  const doctors = await Doctor.find(filter)
    .populate("user", "name username email")
    .populate("department", "name");
  res.json({ doctors });
});

// POST add doctor
router.post("/doctors", authAny, requireStaff(["Admin"]), async (req, res) => {
  try {
    const {
      user,
      department,
      specialization,
      qualification,
      experience,
      registrationNumber,
      consultationFee,
      schedule,
    } = req.body;

    if (!user || !department) {
      return res.status(400).json({ message: "User and department are required" });
    }

    const doctor = await Doctor.create({
      user,
      department,
      specialization,
      qualification,
      experience,
      registrationNumber,
      consultationFee,
      schedule,
    });

    res.json({ message: "Doctor created", doctor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update doctor
router.put("/doctors/:id", authAny, requireStaff(["Admin"]), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("user", "name username email")
      .populate("department", "name");

    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({ message: "Doctor updated", doctor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE toggle active/inactive
router.delete("/doctors/:id/toggle", authAny, requireStaff(["Admin"]), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    doctor.active = !doctor.active;
    await doctor.save();

    res.json({ message: doctor.active ? "Doctor activated" : "Doctor deactivated", doctor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE hard remove doctor
router.delete("/doctors/:id", authAny, requireStaff(["Admin"]), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({ message: "Doctor deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/staff", authAny, requireStaff(["Admin"]), async (req, res) => {
  const role = req.query.role;
  const users = await User.find(role ? { role } : {});
  res.json({ users });
});

// POST /api/admin/staff/:id/reset-password
// Generates a temporary password and forces firstLogin on next sign-in
router.post('/staff/:id/reset-password', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    user.passwordHash = passwordHash;
    user.firstLogin = true; // force password change on next login
    user.status = 'active'; // ensure account is usable
    await user.save();

    res.json({
      message: 'Password reset',
      staff: { id: user._id, name: user.name, username: user.username, role: user.role },
      tempPassword // return once for admin to share securely
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Dashboard quick stats
router.get('/stats', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const [staffCount, doctorCount, departmentCount, patientCount] = await Promise.all([
      require('../models/User').countDocuments({}),
      require('../models/Doctor').countDocuments({ active: { $ne: false } }),
      require('../models/Department').countDocuments({}),
      require('../models/Patient').countDocuments({}),
    ]);
    res.json({ staffCount, doctorCount, departmentCount, patientCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
});

module.exports = router;
