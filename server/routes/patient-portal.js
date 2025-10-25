const express = require('express');
const { authAny } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Bill = require('../models/Bill');
const LabTest = require('../models/LabTest');
const Consultation = require('../models/Consultation');
const puppeteer = require('puppeteer');

const router = express.Router();

// Middleware to ensure patient access only
const requirePatient = (req, res, next) => {
  if (!req.auth || req.auth.kind !== 'patient') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// Get patient profile
router.get('/profile', authAny, requirePatient, async (req, res) => {
  try {
    const patient = await Patient.findById(req.auth.id).select('-passwordHash');
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    res.json({
      id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      opNumber: patient.opNumber,
      phone: patient.phone,
      email: patient.email,
      dob: patient.dob,
      age: patient.age,
      gender: patient.gender,
      address: patient.address
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient visit history
router.get('/visits', authAny, requirePatient, async (req, res) => {
  try {
    const visits = await Visit.find({ patientId: req.auth.id })
      .sort({ appointmentDate: -1 })
      .populate({
        path: 'doctorId',
        populate: { path: 'user', select: 'name' }
      })
      .populate('departmentId', 'name');
    
    // Transform to match frontend expectations
    const transformedVisits = visits.map(visit => ({
      _id: visit._id,
      visitNumber: visit.tokenNumber, // token number is used as visit number
      visitDate: visit.appointmentDate,
      department: visit.departmentId,
      doctor: visit.doctorId ? { name: visit.doctorId.user?.name || 'Not assigned' } : { name: 'Not assigned' },
      status: visit.status,
      visitType: 'Regular',
      chiefComplaint: '',
      vitalSigns: visit.vitals
    }));
    
    res.json(transformedVisits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient lab reports
router.get('/lab-reports', authAny, requirePatient, async (req, res) => {
  try {
    // Lab reports are stored as labRequests inside Consultations
    const consultations = await Consultation.find({ patientId: req.auth.id })
      .populate('visitId', 'tokenNumber appointmentDate')
      .populate({
        path: 'doctorId',
        populate: { path: 'user', select: 'name' }
      })
      .populate('patientId', 'firstName lastName opNumber');
    
    // Extract all completed lab requests
    const labReports = [];
    for (const consultation of consultations) {
      for (const labRequest of consultation.labRequests || []) {
        if (labRequest.status === 'Completed') {
          labReports.push({
            _id: labRequest._id || Math.random().toString(),
            testName: labRequest.testName,
            notes: labRequest.notes,
            parameterResults: labRequest.parameterResults,
            results: (labRequest.parameterResults || []).map(pr => ({
              parameter: pr.parameterName,
              value: pr.value,
              unit: pr.unit,
              normalRange: pr.referenceRange,
              interpretation: pr.remarks
            })),
            overallRemarks: labRequest.overallRemarks,
            summaryResult: labRequest.summaryResult,
            status: labRequest.status,
            updatedAt: labRequest.completedAt,
            completedAt: labRequest.completedAt,
            sampleCollectedAt: labRequest.sampleCollectedAt,
            visit: consultation.visitId ? { visitNumber: consultation.visitId.tokenNumber, visitDate: consultation.visitId.appointmentDate } : null,
            orderedBy: consultation.doctorId ? { name: consultation.doctorId.user?.name || 'N/A' } : { name: 'N/A' },
            performedBy: null,
            patient: consultation.patientId
          });
        }
      }
    }
    
    // Sort by completion date (newest first)
    labReports.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    res.json(labReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient prescriptions
router.get('/prescriptions', authAny, requirePatient, async (req, res) => {
  try {
    const consultations = await Consultation.find({ patientId: req.auth.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'doctorId',
        populate: { path: 'user', select: 'name' }
      })
      .populate('visitId', 'tokenNumber appointmentDate')
      .populate('patientId', 'firstName lastName opNumber');
    
    // Format prescriptions data
    const prescriptionsData = consultations.map(consultation => ({
      _id: consultation._id,
      consultationDate: consultation.createdAt,
      doctor: consultation.doctorId ? { name: consultation.doctorId.user?.name || 'N/A' } : { name: 'N/A' },
      visit: consultation.visitId ? { visitNumber: consultation.visitId.tokenNumber, visitDate: consultation.visitId.appointmentDate } : null,
      patient: consultation.patientId,
      prescriptions: (consultation.prescriptions || []).map(rx => ({
        medicine: null, // We don't have detailed medicine info here
        medicineName: rx.medicineName,
        quantity: rx.quantity,
        dosage: rx.dosage,
        instructions: rx.instructions,
        frequency: '', // Not stored in current model
        duration: '' // Not stored in current model
      })),
      chiefComplaints: consultation.chiefComplaints,
      diagnosis: consultation.diagnosis,
      notes: consultation.treatmentPlan
    }));
    
    res.json(prescriptionsData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient bills
router.get('/bills', authAny, requirePatient, async (req, res) => {
  try {
    const bills = await Bill.find({ patientId: req.auth.id })
      .sort({ createdAt: -1 })
      .populate('visitId', 'tokenNumber appointmentDate')
      .populate('patientId', 'firstName lastName opNumber');
    
    // Transform to match frontend expectations
    const transformedBills = bills.map((bill, index) => ({
      _id: bill._id,
      billNumber: `BILL-${bill._id.toString().slice(-6).toUpperCase()}`,
      billDate: bill.generatedAt || bill.createdAt,
      visit: bill.visitId ? { visitNumber: bill.visitId.tokenNumber } : null,
      patient: bill.patientId,
      totalAmount: bill.totalAmount,
      amountPaid: bill.paidAmount,
      discount: 0,
      paymentStatus: bill.status.toLowerCase(),
      paymentMethod: bill.paymentMethod,
      items: bill.items,
      status: bill.status
    }));
    
    res.json(transformedBills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single visit details
router.get('/visits/:visitId', authAny, requirePatient, async (req, res) => {
  try {
    const visit = await Visit.findOne({ 
      _id: req.params.visitId,
      patientId: req.auth.id
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'user', select: 'name' }
    })
    .populate('departmentId', 'name');
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    // Transform to match frontend expectations
    const transformed = {
      _id: visit._id,
      visitNumber: visit.tokenNumber,
      visitDate: visit.appointmentDate,
      department: visit.departmentId,
      doctor: visit.doctorId ? { name: visit.doctorId.user?.name || 'Not assigned' } : { name: 'Not assigned' },
      status: visit.status,
      visitType: 'Regular',
      chiefComplaint: '',
      vitalSigns: visit.vitals ? {
        temperature: visit.vitals.temperature,
        bloodPressure: visit.vitals.bp,
        pulseRate: visit.vitals.weight,
        respiratoryRate: visit.vitals.oxygen
      } : null
    };
    
    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single lab report details
router.get('/lab-reports/:reportId', authAny, requirePatient, async (req, res) => {
  try {
    // Lab reports are nested in consultations, so we need to find the consultation and the specific lab request
    const consultation = await Consultation.findOne({
      patientId: req.auth.id,
      'labRequests._id': req.params.reportId
    })
    .populate('visitId', 'tokenNumber appointmentDate')
    .populate({
      path: 'doctorId',
      populate: { path: 'user', select: 'name' }
    })
    .populate('patientId', 'firstName lastName opNumber');
    
    if (!consultation) {
      return res.status(404).json({ message: 'Lab report not found' });
    }
    
    // Find the specific lab request
    const labRequest = consultation.labRequests.find(lr => lr._id.toString() === req.params.reportId);
    
    if (!labRequest || labRequest.status !== 'Completed') {
      return res.status(404).json({ message: 'Lab report not found' });
    }
    
    res.json({
      _id: labRequest._id,
      testName: labRequest.testName,
      notes: labRequest.notes,
      parameterResults: labRequest.parameterResults,
      results: (labRequest.parameterResults || []).map(pr => ({
        parameter: pr.parameterName,
        value: pr.value,
        unit: pr.unit,
        normalRange: pr.referenceRange,
        interpretation: pr.remarks
      })),
      overallRemarks: labRequest.overallRemarks,
      summaryResult: labRequest.summaryResult,
      status: labRequest.status,
      updatedAt: labRequest.completedAt,
      completedAt: labRequest.completedAt,
      sampleCollectedAt: labRequest.sampleCollectedAt,
      visit: consultation.visitId ? { visitNumber: consultation.visitId.tokenNumber, visitDate: consultation.visitId.appointmentDate } : null,
      orderedBy: consultation.doctorId ? { name: consultation.doctorId.user?.name || 'N/A' } : { name: 'N/A' },
      performedBy: null,
      patient: consultation.patientId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single bill details
router.get('/bills/:billId', authAny, requirePatient, async (req, res) => {
  try {
    const bill = await Bill.findOne({ 
      _id: req.params.billId,
      patientId: req.auth.id
    })
    .populate('visitId', 'tokenNumber appointmentDate')
    .populate('patientId', 'firstName lastName opNumber');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Transform to match frontend expectations
    const transformed = {
      _id: bill._id,
      billNumber: `BILL-${bill._id.toString().slice(-6).toUpperCase()}`,
      billDate: bill.generatedAt || bill.createdAt,
      visit: bill.visitId ? { visitNumber: bill.visitId.tokenNumber } : null,
      patient: bill.patientId,
      totalAmount: bill.totalAmount,
      amountPaid: bill.paidAmount,
      discount: 0,
      paymentStatus: bill.status.toLowerCase(),
      paymentMethod: bill.paymentMethod,
      items: bill.items,
      status: bill.status
    };
    
    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile (limited fields)
router.put('/profile', authAny, requirePatient, async (req, res) => {
  try {
    const { email, phone, address } = req.body;
    
    // Only allow updating specific fields
    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    
    const patient = await Patient.findByIdAndUpdate(
      req.auth.id,
      updateData,
      { new: true }
    ).select('-passwordHash');
    
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download lab report PDF
router.get('/lab-reports/:reportId/pdf', authAny, requirePatient, async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Find the lab report and verify it belongs to this patient
    const consultation = await Consultation.findOne({
      patientId: req.auth.id,
      'labRequests._id': reportId
    })
    .populate('visitId', 'tokenNumber appointmentDate')
    .populate({
      path: 'doctorId',
      populate: { path: 'user', select: 'name' }
    })
    .populate('patientId', 'firstName lastName opNumber age gender');
    
    if (!consultation) {
      return res.status(404).json({ message: 'Lab report not found' });
    }
    
    // Find the specific lab request
    const labRequest = consultation.labRequests.find(lr => lr._id.toString() === reportId);
    
    if (!labRequest || labRequest.status !== 'Completed') {
      return res.status(404).json({ message: 'Lab report not available' });
    }
    
    // Generate HTML for the report
    const html = generateLabReportHTML(consultation, labRequest);
    
    // Use Puppeteer to generate PDF
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: 10, bottom: 10, left: 10, right: 10 } });
    await browser.close();
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="lab-report-${consultation.patientId?.opNumber}-${labRequest.testName}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

function generateLabReportHTML(consultation, labRequest) {
  const patient = consultation.patientId;
  const doctor = consultation.doctorId;
  const visit = consultation.visitId;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lab Report</title>
      <style>
        * { margin: 0; padding: 0; }
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          padding: 0;
          color: #000;
          line-height: 1.4;
          font-size: 12px;
        }

        /* Header */
        .header {
          text-align: center;
          padding-bottom: 15px;
          margin-bottom: 20px;
          border-bottom: 3px solid #0066cc;
        }
        .header-top {
          border-top: 3px solid #0066cc;
          padding-top: 10px;
          padding-bottom: 5px;
        }
        .hospital-name {
          font-size: 20px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }
        .hospital-subtitle {
          font-size: 13px;
          color: #333;
          margin-bottom: 3px;
        }
        .hospital-contact {
          font-size: 11px;
          color: #555;
        }

        .report-title {
          text-align: center;
          font-size: 13px;
          font-weight: bold;
          color: #0066cc;
          margin: 20px 0 20px 0;
          letter-spacing: 0.5px;
        }

        /* Patient Info Section */
        .section-header {
          font-weight: bold;
          font-size: 12px;
          margin-top: 18px;
          margin-bottom: 12px;
          color: #0066cc;
          border-bottom: 2px solid #ddd;
          padding-bottom: 5px;
        }

        .patient-info {
          margin-bottom: 20px;
          font-size: 11px;
        }

        .info-row {
          display: flex;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .info-label {
          font-weight: bold;
          width: 140px;
          flex-shrink: 0;
        }

        .info-value {
          flex-grow: 1;
          word-wrap: break-word;
        }

        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        thead tr {
          background-color: #0066cc;
        }
        
        th {
          background-color: #0066cc;
          color: #fff;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #0066cc;
          word-wrap: break-word;
        }
        
        td {
          padding: 9px;
          border: 1px solid #ddd;
          vertical-align: middle;
        }
        
        tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        tbody tr:nth-child(odd) {
          background-color: #ffffff;
        }

        /* Remarks */
        .remarks {
          margin-top: 15px;
          margin-bottom: 10px;
          font-size: 11px;
          line-height: 1.5;
          padding: 10px;
          background-color: #f5f5f5;
          border-left: 3px solid #0066cc;
        }

        .remarks-label {
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 5px;
        }

        .remarks-text {
          margin-left: 0;
          color: #333;
        }

        /* Footer */
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 9px;
          color: #666;
          line-height: 1.5;
          border-top: 2px solid #ddd;
          padding-top: 10px;
        }

        .footer p {
          margin: 3px 0;
        }

        .text-center {
          text-align: center;
        }

        .text-right {
          text-align: right;
        }

        .abnormal {
          color: #d9534f;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-top">
          <div class="hospital-name">HOLY CROSS HOSPITAL</div>
          <div class="hospital-subtitle">Comprehensive Healthcare Solutions</div>
          <div class="hospital-contact">Phone: 7356988696 | Email: holycrosskvply@gmail.com</div>
        </div>
      </div>

      <div class="report-title">LABORATORY TEST REPORT</div>

      <div class="section-header">PATIENT INFORMATION</div>
      <div class="patient-info">
        <div class="info-row">
          <span class="info-label">Patient Name:</span>
          <span class="info-value">${patient?.firstName || '-'} ${patient?.lastName || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">OP Number:</span>
          <span class="info-value">${patient?.opNumber || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Age/Gender:</span>
          <span class="info-value">${patient?.age || '-'} / ${patient?.gender || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Test Name:</span>
          <span class="info-value">${labRequest.testName || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${new Date(labRequest.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ordered By:</span>
          <span class="info-value">Dr. ${doctor?.user?.name || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Performed By:</span>
          <span class="info-value">${labRequest.performedBy || 'N/A'}</span>
        </div>
      </div>

      <div class="section-header">TEST RESULTS</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Parameter</th>
            <th style="width: 12%;">Value</th>
            <th style="width: 12%;">Unit</th>
            <th style="width: 22%;">Normal Range</th>
            <th style="width: 12%;">Status</th>
            <th style="width: 17%;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${labRequest.parameterResults && labRequest.parameterResults.length > 0
            ? labRequest.parameterResults.map(result => `
              <tr>
                <td>${result.parameterName || '-'}</td>
                <td class="text-center">${result.value || '-'}</td>
                <td class="text-center">${result.unit || '-'}</td>
                <td>${result.referenceRange || '-'}</td>
                <td class="text-center ${result.isAbnormal ? 'abnormal' : ''}">${result.isAbnormal ? 'Abnormal' : 'Normal'}</td>
                <td>${result.remarks || '-'}</td>
              </tr>
            `).join('')
            : '<tr><td colspan="6" style="text-align: center;">No results available</td></tr>'
          }
        </tbody>
      </table>

      ${labRequest.overallRemarks ? `
        <div class="section-header">CLINICAL NOTES</div>
        <div class="remarks">
          <div class="remarks-text">${labRequest.overallRemarks}</div>
        </div>
      ` : ''}

      ${labRequest.summaryResult ? `
        <div class="remarks">
          <div class="remarks-label">Summary:</div>
          <div class="remarks-text">${labRequest.summaryResult}</div>
        </div>
      ` : ''}

      <div class="footer">
        <p>This report is confidential and intended for the patient and authorized healthcare providers only.</p>
        <p>Report generated on ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;