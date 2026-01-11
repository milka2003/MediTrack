const express = require('express');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const DoctorAvailability = require('../models/DoctorAvailability');
const StaffShiftMapping = require('../models/StaffShiftMapping');
const { authAny, requireStaff } = require('../middleware/auth');
const { getActiveShiftTemplate, getStaffOnActiveShift } = require('../utils/shiftResolver');

const router = express.Router();

const isOnActiveShift = async (doctorUserId) => {
  const activeShift = await getActiveShiftTemplate();
  if (!activeShift) return false;

  const now = new Date();
  const mapping = await StaffShiftMapping.findOne({
    staffId: doctorUserId,
    shiftTemplateId: activeShift._id,
    role: 'Doctor',
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: now } }
    ]
  });

  return !!mapping;
};

// Public patient board endpoint - no auth required as it only shows minimal data
router.get('/patient-board', async (req, res) => {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    // 1. Get all doctors on active shift
    const staffMappings = await getStaffOnActiveShift('Doctor');
    const activeDoctorUserIds = staffMappings.map(m => m.staffId._id || m.staffId);

    // 2. Map User IDs to Doctor IDs
    const doctors = await Doctor.find({ user: { $in: activeDoctorUserIds } }).populate('user', 'name');
    const activeDoctorIds = doctors.map(d => d._id);
    
    // Fetch availability for these doctors
    const availabilities = await DoctorAvailability.find({ doctorId: { $in: activeDoctorIds } });
    const availabilityMap = availabilities.reduce((acc, a) => {
      acc[a.doctorId.toString()] = a.availabilityStatus;
      return acc;
    }, {});

    // Filter out Unavailable doctors
    const filteredDoctorIds = activeDoctorIds.filter(id => availabilityMap[id.toString()] !== 'Unavailable');

    const doctorMap = doctors.reduce((acc, d) => {
      acc[d._id.toString()] = {
        name: d.user?.name || 'Unknown Doctor',
        status: availabilityMap[d._id.toString()] || 'Available'
      };
      return acc;
    }, {});

    // 3. Fetch visits for these doctors
    const visits = await Visit.find({
      doctorId: { $in: filteredDoctorIds },
      status: { $in: ['InConsultation', 'ReadyForConsultation'] },
      appointmentDate: { $gte: start, $lte: end }
    }).sort({ tokenNumber: 1 });

    const nowConsulting = visits
      .filter(v => v.status === 'InConsultation')
      .map(v => ({
        tokenNumber: v.tokenNumber,
        doctorName: doctorMap[v.doctorId.toString()].name,
        onBreak: doctorMap[v.doctorId.toString()].status === 'OnBreak'
      }));

    const waiting = visits
      .filter(v => v.status === 'ReadyForConsultation')
      .map(v => ({
        tokenNumber: v.tokenNumber,
        doctorName: doctorMap[v.doctorId.toString()].name,
        onBreak: doctorMap[v.doctorId.toString()].status === 'OnBreak'
      }))
      .slice(0, 15);

    res.json({
      nowConsulting,
      waiting
    });
  } catch (e) {
    console.error('Patient board fetch error:', e);
    res.status(500).json({ message: 'Failed to fetch patient board data', error: e.message });
  }
});

router.get('/doctor/:doctorId', authAny, requireStaff(['Doctor']), async (req, res) => {
  try {
    let { doctorId } = req.params;
    
    if (!doctorId || doctorId === 'me') {
      const doctor = await Doctor.findOne({ user: req.auth.id }).populate('user', 'name');
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      doctorId = doctor._id;
    }
    
    const doctor = await Doctor.findById(doctorId).populate('user', 'name');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const onShift = await isOnActiveShift(doctor.user);
    const availability = await DoctorAvailability.findOne({ doctorId: doctor._id });

    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    const currentConsultation = await Visit.findOne({
      doctorId,
      status: 'InConsultation',
      appointmentDate: { $gte: start, $lte: end }
    }).populate('patientId', 'firstName lastName opNumber');

    const readyQueue = await Visit.find({
      doctorId,
      status: 'ReadyForConsultation',
      appointmentDate: { $gte: start, $lte: end }
    })
      .sort({ tokenNumber: 1 })
      .populate('patientId', 'firstName lastName opNumber');

    res.json({
      doctor: { id: doctor._id, name: doctor.user?.name },
      onShift,
      availability: availability ? {
        status: availability.availabilityStatus,
        updatedAt: availability.updatedAt
      } : { status: onShift ? 'Available' : 'Unavailable' },
      currentToken: currentConsultation ? {
        visitId: currentConsultation._id,
        tokenNumber: currentConsultation.tokenNumber,
        patientName: `${currentConsultation.patientId?.firstName || ''} ${currentConsultation.patientId?.lastName || ''}`.trim(),
        opNumber: currentConsultation.patientId?.opNumber
      } : null,
      nextTokens: readyQueue.map(v => ({
        visitId: v._id,
        tokenNumber: v.tokenNumber,
        patientName: `${v.patientId?.firstName || ''} ${v.patientId?.lastName || ''}`.trim(),
        opNumber: v.patientId?.opNumber
      })),
      waitingCount: readyQueue.length
    });
  } catch (e) {
    console.error('Queue fetch error:', e);
    res.status(500).json({ message: 'Failed to fetch queue', error: e.message });
  }
});

router.post('/doctor/:doctorId/next', authAny, requireStaff(['Doctor']), async (req, res) => {
  try {
    let { doctorId } = req.params;
    
    if (!doctorId || doctorId === 'me') {
      const doctor = await Doctor.findOne({ user: req.auth.id }).populate('user', 'name');
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }
      doctorId = doctor._id;
    }
    
    const doctor = await Doctor.findById(doctorId).populate('user', 'name');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const onShift = await isOnActiveShift(doctor.user);
    const availability = await DoctorAvailability.findOne({ doctorId: doctor._id });

    if (availability && availability.availabilityStatus !== 'Available') {
      return res.status(400).json({ 
        message: `Cannot call next patient. Current status: ${availability.availabilityStatus}. Please set status to Available first.` 
      });
    }

    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    const current = await Visit.findOne({
      doctorId,
      status: 'InConsultation',
      appointmentDate: { $gte: start, $lte: end }
    });

    if (current) {
      return res.status(400).json({ message: 'An active consultation is already in progress. Please end it before calling the next patient.' });
    }

    const next = await Visit.findOne({
      doctorId,
      status: 'ReadyForConsultation',
      appointmentDate: { $gte: start, $lte: end }
    }).sort({ tokenNumber: 1 });

    if (!next) {
      return res.status(404).json({ message: 'No patients waiting in queue' });
    }

    next.status = 'InConsultation';
    await next.save();

    const currentConsultation = await Visit.findOne({
      doctorId,
      status: 'InConsultation',
      appointmentDate: { $gte: start, $lte: end }
    }).populate('patientId', 'firstName lastName opNumber');

    const readyQueue = await Visit.find({
      doctorId,
      status: 'ReadyForConsultation',
      appointmentDate: { $gte: start, $lte: end }
    })
      .sort({ tokenNumber: 1 })
      .populate('patientId', 'firstName lastName opNumber');

    res.json({
      message: 'Queue updated',
      currentToken: currentConsultation ? {
        visitId: currentConsultation._id,
        tokenNumber: currentConsultation.tokenNumber,
        patientName: `${currentConsultation.patientId?.firstName || ''} ${currentConsultation.patientId?.lastName || ''}`.trim(),
        opNumber: currentConsultation.patientId?.opNumber
      } : null,
      nextTokens: readyQueue.map(v => ({
        visitId: v._id,
        tokenNumber: v.tokenNumber,
        patientName: `${v.patientId?.firstName || ''} ${v.patientId?.lastName || ''}`.trim(),
        opNumber: v.patientId?.opNumber
      })),
      waitingCount: readyQueue.length
    });
  } catch (e) {
    console.error('Call next error:', e);
    res.status(500).json({ message: 'Failed to call next patient', error: e.message });
  }
});

router.post('/visit/:visitId/ready', authAny, requireStaff(['Nurse', 'Admin']), async (req, res) => {
  try {
    const { visitId } = req.params;
    const visit = await Visit.findById(visitId);
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    const doctor = await Doctor.findById(visit.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    visit.status = 'ReadyForConsultation';
    await visit.save();

    res.json({ 
      message: 'Visit marked as ready for consultation',
      visit: {
        _id: visit._id,
        tokenNumber: visit.tokenNumber,
        status: visit.status
      }
    });
  } catch (e) {
    console.error('Mark ready error:', e);
    res.status(500).json({ message: 'Failed to mark visit as ready', error: e.message });
  }
});

module.exports = router;
