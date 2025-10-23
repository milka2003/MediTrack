const express = require('express');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const Consultation = require('../models/Consultation');
const { authAny, requireStaff } = require('../middleware/auth');

const router = express.Router();

// GET /api/doctor/me - basic profile
router.get('/me', authAny, requireStaff(['Doctor']), async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.auth.id })
    .populate('user','name username email')
    .populate('department','name');
  if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
  res.json({ doctor });
});

// GET /api/doctor/visits?date=YYYY-MM-DD
router.get('/visits', authAny, requireStaff(['Doctor']), async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.auth.id });
  if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

  const { date } = req.query;
  const q = { doctorId: doctor._id };
  if (date) {
    const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
    q.appointmentDate = { $gte: dayStart, $lte: dayEnd };
  } else {
    const dayStart = new Date(); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(); dayEnd.setHours(23,59,59,999);
    q.appointmentDate = { $gte: dayStart, $lte: dayEnd };
  }

  const visits = await Visit.find(q)
    .populate('patientId','firstName lastName opNumber age gender phone')
    .sort({ tokenNumber: 1 });
  res.json({ visits });
});

// PATCH /api/doctor/visits/:id/status { status: 'closed'|'cancelled'|'no-show' }
router.patch('/visits/:id/status', authAny, requireStaff(['Doctor']), async (req, res) => {
  const { status } = req.body;
  if (!['closed','cancelled','no-show','open'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const updated = await Visit.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!updated) return res.status(404).json({ message: 'Visit not found' });
  res.json({ message: 'Status updated', visit: updated });
});

// POST or PUT /api/doctor/consultations/:visitId
router.post('/consultations/:visitId', authAny, requireStaff(['Doctor']), async (req, res) => {
  const visitId = req.params.visitId;
  const visit = await Visit.findById(visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found' });

  // Defensive normalization: ignore blank prescription rows and avoid invalid ObjectId casts
  const normalizePrescriptions = (arr) => {
    const mongoose = require('mongoose');
    return (arr || [])
      .map(p => {
        const obj = {
          medicineName: p.medicineName || (typeof p.medicine === 'string' ? p.medicine : ''),
          quantity: typeof p.quantity === 'number' ? p.quantity : 1,
          dosage: p.dosage || '',
          instructions: p.instructions || ''
        };
        const idCandidate = p.medicineId || p.medicineId === '' ? p.medicineId : undefined;
        // Only set medicineId if it is a valid ObjectId
        if (idCandidate && mongoose.Types.ObjectId.isValid(idCandidate)) {
          obj.medicineId = idCandidate;
        }
        return obj;
      })
      .filter(p => (p.medicineId) || (p.medicineName && p.medicineName.trim().length > 0));
  };

  const cleanedPrescriptions = normalizePrescriptions(req.body.prescriptions);

  // Defensive normalization for lab requests: keep only rows with a test name/id
  const cleanedLabRequests = (req.body.labRequests || []).filter(r =>
    (r && (r.testName && r.testName.trim())) || (r.testId)
  );

  const payload = {
    visitId,
    doctorId: visit.doctorId,
    patientId: visit.patientId,
    chiefComplaints: req.body.chiefComplaints,
    diagnosis: req.body.diagnosis,
    treatmentPlan: req.body.treatmentPlan,
    prescriptions: cleanedPrescriptions,
    labRequests: cleanedLabRequests
  };

  // Also persist prescriptions into Visit for Pharmacy workflow
  visit.prescriptions = cleanedPrescriptions;
  visit.prescriptionStatus = cleanedPrescriptions.length ? 'pending' : 'none';
  await visit.save();

  const existing = await Consultation.findOne({ visitId });
  let doc;
  if (existing) {
    Object.assign(existing, payload);
    doc = await existing.save();
  } else {
    doc = await Consultation.create(payload);
  }
  res.json({ message: 'Consultation saved', consultation: doc });
});

// GET /api/doctor/consultations/:visitId
router.get('/consultations/:visitId', authAny, requireStaff(['Doctor']), async (req, res) => {
  const doc = await Consultation.findOne({ visitId: req.params.visitId });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ consultation: doc });
});

// GET /api/doctor/patients/:patientId/history
router.get('/patients/:patientId/history', authAny, requireStaff(['Doctor']), async (req, res) => {
  try {
    const { patientId } = req.params;
    // Last 10 visits for this patient (any doctor), newest first
    console.log('[history] patientId=', patientId);
    const visits = await Visit.find({ patientId })
      .sort({ appointmentDate: -1 })
      .limit(10)
      .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } });
    console.log('[history] found visits=', visits.length);

    const visitIds = visits.map(v => v._id);
    const consults = await Consultation.find({ visitId: { $in: visitIds } });
    const consultMap = new Map(consults.map(c => [String(c.visitId), c]));

    const history = visits.map(v => ({
      _id: v._id,
      appointmentDate: v.appointmentDate,
      tokenNumber: v.tokenNumber,
      status: v.status,
      slot: v.slot,
      doctor: { id: v.doctorId?._id, name: v.doctorId?.user?.name },
      consultation: consultMap.get(String(v._id)) || null,
    }));

    res.json({ history });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// GET /api/doctor/lab-reports
// List completed lab reports for the logged-in doctor with search and filters
router.get('/lab-reports', authAny, requireStaff(['Doctor']), async (req, res) => {
  try {
    const DoctorModel = Doctor; // alias for clarity
    const doctor = await DoctorModel.findOne({ user: req.auth.id }).populate({ path: 'user', select: 'name' });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const mongoose = require('mongoose');
    const { q, test, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const matchStage = { doctorId: doctor._id };

    const pipeline = [
      { $match: matchStage },
      { $unwind: { path: '$labRequests', includeArrayIndex: 'itemIndex' } },
      { $match: { 'labRequests.status': 'Completed' } },
      { $lookup: { from: 'patients', localField: 'patientId', foreignField: '_id', as: 'patient' } },
      { $unwind: '$patient' },
      { $lookup: { from: 'visits', localField: 'visitId', foreignField: '_id', as: 'visit' } },
      { $unwind: { path: '$visit', preserveNullAndEmptyArrays: true } },
    ];

    // Text and field filters
    const andFilters = [];

    if (q && typeof q === 'string' && q.trim()) {
      const rx = new RegExp(q.trim(), 'i');
      andFilters.push({ $or: [
        { 'patient.firstName': rx },
        { 'patient.lastName': rx },
        { 'patient.opNumber': rx },
        { 'labRequests.testName': rx },
      ]});
    }

    if (test && typeof test === 'string' && test.trim()) {
      const testTrim = test.trim();
      if (mongoose.Types.ObjectId.isValid(testTrim)) {
        andFilters.push({ 'labRequests.testId': new mongoose.Types.ObjectId(testTrim) });
      } else {
        andFilters.push({ 'labRequests.testName': new RegExp(testTrim, 'i') });
      }
    }

    // Date range based on result completion time
    const dateFilter = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from)) dateFilter.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to)) {
        // Include the whole end day if only a date provided
        if (to.getHours() === 0 && to.getMinutes() === 0 && to.getSeconds() === 0 && to.getMilliseconds() === 0) {
          to.setHours(23, 59, 59, 999);
        }
        dateFilter.$lte = to;
      }
    }
    if (Object.keys(dateFilter).length) {
      andFilters.push({ 'labRequests.completedAt': dateFilter });
    }

    if (andFilters.length) pipeline.push({ $match: { $and: andFilters } });

    pipeline.push(
      { $sort: { 'labRequests.completedAt': -1, _id: -1 } },
      {
        $project: {
          consultationId: '$_id',
          itemIndex: 1,
          patient: {
            id: '$patient._id',
            firstName: '$patient.firstName',
            lastName: '$patient.lastName',
            opNumber: '$patient.opNumber',
          },
          doctor: { id: '$doctorId', name: doctor.user?.name },
          visitId: '$visit._id',
          appointmentDate: '$visit.appointmentDate',
          tokenNumber: '$visit.tokenNumber',
          testId: '$labRequests.testId',
          testName: '$labRequests.testName',
          status: '$labRequests.status',
          parameterResults: '$labRequests.parameterResults',
          overallRemarks: '$labRequests.overallRemarks',
          summaryResult: '$labRequests.summaryResult',
          completedAt: '$labRequests.completedAt',
          sampleCollectedAt: '$labRequests.sampleCollectedAt',
        }
      },
      {
        $facet: {
          total: [ { $count: 'count' } ],
          items: [ { $skip: (pageNum - 1) * pageSize }, { $limit: pageSize } ]
        }
      }
    );

    const result = await Consultation.aggregate(pipeline);
    const totalCount = (result[0]?.total?.[0]?.count) || 0;
    const items = (result[0]?.items || []).map(it => ({
      ...it,
      patient: {
        ...it.patient,
        name: `${it.patient.firstName || ''} ${it.patient.lastName || ''}`.trim()
      },
      reportUrl: `/api/lab/report/${it.consultationId}/${it.itemIndex}`
    }));

    res.json({
      page: pageNum,
      limit: pageSize,
      total: totalCount,
      items
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch lab reports' });
  }
});

// GET /api/doctor/visits/:id - fetch single visit with vitals
router.get('/visits/:id', authAny, requireStaff(['Doctor']), async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.auth.id });
  if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

  const visit = await Visit.findOne({ _id: req.params.id, doctorId: doctor._id })
    .populate('patientId','firstName lastName opNumber age gender phone');

  if (!visit) return res.status(404).json({ message: 'Visit not found' });
  res.json({ visit });
});

module.exports = router;