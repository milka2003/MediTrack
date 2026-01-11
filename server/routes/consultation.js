const express = require('express');
const { authAny, requireStaff } = require('../middleware/auth');
const Visit = require('../models/Visit');
const Consultation = require('../models/Consultation');
const Task = require('../models/Task');
const Doctor = require('../models/Doctor');
const DoctorAvailability = require('../models/DoctorAvailability');
const { getStaffOnActiveShift, getStaffWithLeastActiveTasks } = require('../utils/shiftResolver');

const router = express.Router();

const getRequiredRole = (taskType) => {
  if (taskType === 'Lab Test') return 'Lab Technician';
  if (taskType === 'Pharmacy') return 'Pharmacist';
  return null;
};

const assignTaskToAvailableStaff = async (taskType) => {
  const requiredRole = getRequiredRole(taskType);
  if (!requiredRole) return null;

  const staffMappings = await getStaffOnActiveShift(requiredRole);
  if (staffMappings.length === 0) return null;

  const selectedStaff = await getStaffWithLeastActiveTasks(staffMappings, Task);
  if (!selectedStaff) return null;

  return {
    staffId: selectedStaff.staffId._id.toString(),
    staffName: selectedStaff.staffName,
    role: requiredRole
  };
};

const createAutoTask = async (taskType, description, visitId) => {
  const staffAssignment = await assignTaskToAvailableStaff(taskType);
  const task = new Task({
    taskType,
    description,
    assignedTo: staffAssignment ? staffAssignment.staffId : 'Unassigned',
    staffName: staffAssignment ? staffAssignment.staffName : 'Unassigned',
    role: staffAssignment ? staffAssignment.role : getRequiredRole(taskType),
    relatedVisitId: visitId,
    status: staffAssignment ? 'Pending' : 'Pending - No Staff Available'
  });
  await task.save();
  return task;
};

// POST /api/consultation/start/:visitId
router.post('/start/:visitId', authAny, requireStaff(['Doctor']), async (req, res) => {
  try {
    const { visitId } = req.params;
    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    if (!['ReadyForConsultation', 'VitalsCompleted'].includes(visit.status)) {
      return res.status(400).json({ message: 'Visit must be in ReadyForConsultation or VitalsCompleted state' });
    }

    // Check if doctor already has an active consultation
    const activeConsultation = await Visit.findOne({
      doctorId: visit.doctorId,
      status: 'InConsultation'
    });

    if (activeConsultation) {
      return res.status(400).json({ message: 'You already have an active consultation. Please end it before starting a new one.' });
    }

    // Check doctor availability
    const availability = await DoctorAvailability.findOne({ doctorId: visit.doctorId });
    if (availability && availability.availabilityStatus !== 'Available') {
      return res.status(400).json({ 
        message: `Cannot start consultation. Current status: ${availability.availabilityStatus}` 
      });
    }

    visit.status = 'InConsultation';
    await visit.save();

    // Set availability to Busy
    if (availability) {
      availability.availabilityStatus = 'Busy';
      await availability.save();
    } else {
      await DoctorAvailability.create({
        doctorId: visit.doctorId,
        availabilityStatus: 'Busy'
      });
    }

    res.json({ message: 'Consultation started', visit });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/consultation/end/:visitId
router.post('/end/:visitId', authAny, requireStaff(['Doctor']), async (req, res) => {
  try {
    const { visitId } = req.params;
    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    if (visit.status !== 'InConsultation') {
      return res.status(400).json({ message: 'Visit must be in InConsultation state' });
    }

    visit.status = 'ConsultationCompleted';
    await visit.save();

    // Set availability to Available
    const availability = await DoctorAvailability.findOne({ doctorId: visit.doctorId });
    if (availability) {
      availability.availabilityStatus = 'Available';
      await availability.save();
    }

    // Trigger Lab/Pharmacy tasks
    const consultation = await Consultation.findOne({ visitId });
    if (consultation) {
      // Lab tasks
      if (consultation.labRequests && consultation.labRequests.length > 0) {
        const testNames = consultation.labRequests.map(r => r.testName).join(', ');
        await createAutoTask('Lab Test', `Lab tests requested: ${testNames}`, visitId);
      }

      // Pharmacy tasks
      if (consultation.prescriptions && consultation.prescriptions.length > 0) {
        const meds = consultation.prescriptions.map(p => p.medicineName).join(', ');
        await createAutoTask('Pharmacy', `Prescription dispensing: ${meds}`, visitId);
      }
    }

    res.json({ message: 'Consultation ended and tasks created', visit });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
