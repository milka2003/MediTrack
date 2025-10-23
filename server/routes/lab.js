// routes/lab.js
const express = require('express');
const { authAny, requireStaff } = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const Visit = require('../models/Visit');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const puppeteer = require('puppeteer');

const router = express.Router();

function toPlainParameterResult(result) {
  if (!result) return {};
  if (typeof result.toObject === 'function') {
    return result.toObject();
  }
  return { ...result };
}

function computeNumericAbnormality(value, referenceRange) {
  if (value === undefined || value === null || value === '') return false;
  if (!referenceRange) return false;

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(numericValue)) return false;

  const rangeString = String(referenceRange).trim();
  if (!rangeString) return false;

  if (rangeString.includes('-')) {
    const [minStr, maxStr] = rangeString.split('-');
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);
    if (!Number.isNaN(min) && numericValue < min) return true;
    if (!Number.isNaN(max) && numericValue > max) return true;
    return false;
  }

  if (rangeString.startsWith('<')) {
    const max = parseFloat(rangeString.substring(1));
    return !Number.isNaN(max) && numericValue >= max;
  }

  if (rangeString.startsWith('>')) {
    const min = parseFloat(rangeString.substring(1));
    return !Number.isNaN(min) && numericValue <= min;
  }

  return false;
}

function normalizeParameterResults(parameterResults = []) {
  return parameterResults.map((rawResult) => {
    const plainResult = toPlainParameterResult(rawResult);
    const normalized = { ...plainResult };

    if (normalized.valueType === 'numeric') {
      normalized.isAbnormal = computeNumericAbnormality(normalized.value, normalized.referenceRange);
    } else if (typeof normalized.isAbnormal !== 'boolean') {
      normalized.isAbnormal = false;
    }

    return normalized;
  });
}

// GET /api/lab/pending
// Returns all labRequests across consultations where any request is Pending/In Progress
router.get('/pending', authAny, requireStaff(['Lab']), async (req, res) => {
  try {
    // Find consultations with at least one pending/in-progress labRequest
    const consults = await Consultation.find({ 'labRequests.status': { $in: ['Pending','In Progress'] } })
      .populate({ path: 'visitId' })
      .populate({ path: 'patientId', select: 'firstName lastName opNumber' })
      .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } });

    const items = [];
    for (const c of consults) {
      const visit = c.visitId ? await Visit.findById(c.visitId) : null;
      const tokenNumber = visit?.tokenNumber;
      for (const [idx, r] of c.labRequests.entries()) {
        if (['Pending','In Progress'].includes(r.status) && r.testId) {
          items.push({
            consultationId: c._id,
            itemIndex: idx,
            visitId: c.visitId?._id,
            tokenNumber,
            opNumber: c.opNumber || visit?.opNumber,
            patient: c.patientId ? { id: c.patientId._id, name: `${c.patientId.firstName} ${c.patientId.lastName}`, opNumber: c.patientId.opNumber } : null,
            doctor: c.doctorId ? { id: c.doctorId._id, name: c.doctorId.user?.name } : null,
            testId: r.testId,
            testName: r.testName,
            notes: r.notes || '',
            status: r.status,
          });
        }
      }
    }

    res.json({ pending: items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch pending lab requests' });
  }
});

// POST /api/lab/:consultationId/collect-sample
// Body: { itemIndex }
router.post('/:consultationId/collect-sample', authAny, requireStaff(['Lab']), async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { itemIndex } = req.body;
    const consult = await Consultation.findById(consultationId);
    if (!consult) return res.status(404).json({ message: 'Consultation not found' });
    if (typeof itemIndex !== 'number' || itemIndex < 0 || itemIndex >= consult.labRequests.length) {
      return res.status(400).json({ message: 'Invalid itemIndex' });
    }
    consult.labRequests[itemIndex].sampleCollectedAt = new Date();
    consult.labRequests[itemIndex].sampleCollectedBy = req.auth.id;
    consult.labRequests[itemIndex].status = 'In Progress';
    await consult.save();
    res.json({ message: 'Sample marked collected', consultation: consult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to update sample collection' });
  }
});

// PUT /api/lab/:consultationId/result
// Body: { itemIndex, parameterResults: [{ parameterName, value, unit, referenceRange, valueType, isAbnormal, remarks }], overallRemarks, summaryResult }
router.put('/:consultationId/result', authAny, requireStaff(['Lab']), async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { itemIndex, parameterResults, overallRemarks, summaryResult } = req.body;

    const consult = await Consultation.findById(consultationId);
    if (!consult) return res.status(404).json({ message: 'Consultation not found' });

    if (typeof itemIndex !== 'number' || itemIndex < 0 || itemIndex >= consult.labRequests.length) {
      return res.status(400).json({ message: 'Invalid itemIndex' });
    }

    const item = consult.labRequests[itemIndex];
    const normalizedResults = normalizeParameterResults(parameterResults);
    item.parameterResults = normalizedResults;
    item.overallRemarks = overallRemarks || '';
    item.summaryResult = summaryResult || '';
    item.status = 'Completed';
    item.completedAt = new Date();

    await consult.save();
    res.json({ message: 'Result saved', consultation: consult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to save result' });
  }
});

// GET /api/lab/patient/:opNumber
router.get('/patient/:opNumber', authAny, requireStaff(['Lab','Doctor']), async (req, res) => {
  try {
    const { opNumber } = req.params;
    // Find visits by opNumber, then consultations with any labRequests
    const visits = await Visit.find({ opNumber }).select('_id appointmentDate doctorId tokenNumber');
    const visitIds = visits.map(v => v._id);
    const consults = await Consultation.find({ visitId: { $in: visitIds }, 'labRequests.0': { $exists: true } })
      .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } })
      .populate({ path: 'patientId', select: 'firstName lastName opNumber' });

    const history = consults.map(c => ({
      id: c._id,
      visitId: c.visitId,
      patient: c.patientId ? { id: c.patientId._id, name: `${c.patientId.firstName} ${c.patientId.lastName}`, opNumber: c.patientId.opNumber } : null,
      doctor: c.doctorId ? { id: c.doctorId._id, name: c.doctorId.user?.name } : null,
      labRequests: c.labRequests,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json({ history });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch patient lab history' });
  }
});

// GET /api/lab/completed
// Returns all labRequests across consultations where request status is Completed
router.get('/completed', authAny, requireStaff(['Lab']), async (req, res) => {
  try {
    const consults = await Consultation.find({ 'labRequests.status': 'Completed' })
      .populate({ path: 'visitId' })
      .populate({ path: 'patientId', select: 'firstName lastName opNumber' })
      .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } });

    const items = [];
    for (const c of consults) {
      const visit = c.visitId ? await Visit.findById(c.visitId) : null;
      const tokenNumber = visit?.tokenNumber;
      const appointmentDate = visit?.appointmentDate;
      for (const [idx, r] of c.labRequests.entries()) {
        if (r.status === 'Completed' && r.testId) {
          items.push({
            consultationId: c._id,
            itemIndex: idx,
            visitId: c.visitId?._id,
            tokenNumber,
            appointmentDate,
            opNumber: c.opNumber || visit?.opNumber,
            patient: c.patientId ? { id: c.patientId._id, name: `${c.patientId.firstName} ${c.patientId.lastName}`, opNumber: c.patientId.opNumber } : null,
            doctor: c.doctorId ? { id: c.doctorId._id, name: c.doctorId.user?.name } : null,
            testId: r.testId,
            testName: r.testName,
            notes: r.notes || '',
            status: r.status,
            // Result details
            parameterResults: r.parameterResults,
            overallRemarks: r.overallRemarks,
            summaryResult: r.summaryResult,
            completedAt: r.completedAt,
            sampleCollectedAt: r.sampleCollectedAt,
          });
        }
      }
    }

    res.json({ completed: items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch completed lab requests' });
  }
});

// GET /api/lab/report/:consultationId/:itemIndex
// Generate PDF report for a completed lab test
router.get('/report/:consultationId/:itemIndex', authAny, async (req, res) => {
  try {
    const { consultationId, itemIndex } = req.params;

    const consult = await Consultation.findById(consultationId)
      .populate({ path: 'visitId' })
      .populate({ path: 'patientId', select: 'firstName lastName opNumber age gender' })
      .populate({ path: 'doctorId', populate: { path: 'user', select: 'name' } });

    if (!consult) return res.status(404).json({ message: 'Consultation not found' });

    const idx = parseInt(itemIndex);
    if (isNaN(idx) || idx < 0 || idx >= consult.labRequests.length) {
      return res.status(400).json({ message: 'Invalid itemIndex' });
    }

    const labRequest = consult.labRequests[idx];
    if (labRequest.status !== 'Completed') {
      return res.status(400).json({ message: 'Test not completed' });
    }

    const plainRequest = typeof labRequest.toObject === 'function' ? labRequest.toObject() : { ...labRequest };
    const normalizedRequest = {
      ...plainRequest,
      parameterResults: normalizeParameterResults(plainRequest.parameterResults),
    };

    // Generate HTML content for PDF
    const htmlContent = generateLabReportHTML(consult, normalizedRequest, idx);

    // Generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });
    await browser.close();

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="lab-report-${consult.patientId?.opNumber}-${labRequest.testName}.pdf"`);
    res.send(pdfBuffer);

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

function generateLabReportHTML(consultation, labRequest, itemIndex) {
  const patient = consultation.patientId;
  const doctor = consultation.doctorId;
  const visit = consultation.visitId;

  let resultsHTML = '';
  if (labRequest.parameterResults && labRequest.parameterResults.length > 0) {
    resultsHTML = labRequest.parameterResults.map(result => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${result.parameterName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${result.value || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${result.unit || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${result.referenceRange || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; ${result.isAbnormal ? 'color: red; font-weight: bold;' : ''}">${result.isAbnormal ? 'Abnormal' : 'Normal'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${result.remarks || '-'}</td>
      </tr>
    `).join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lab Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #0d47a1; }
        .hospital-info { font-size: 14px; color: #666; margin-top: 5px; }
        .patient-info { margin-bottom: 20px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; width: 120px; }
        .info-value { flex: 1; }
        .test-header { background-color: #f5f5f5; padding: 10px; margin: 20px 0 10px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #e3f2fd; padding: 10px; text-align: left; border: 1px solid #ddd; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        .abnormal { color: red; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Holy Cross Hospital</div>
        <div class="hospital-info">Comprehensive Healthcare Solutions</div>
        <div class="hospital-info">Phone: 7356988696 | Email: holycrosskvply@gmail.com</div>
      </div>

      <h2 style="text-align: center; color: #0d47a1;">Laboratory Report</h2>

      <div class="patient-info">
        <div class="info-row">
          <span class="info-label">Patient Name:</span>
          <span class="info-value">${patient?.firstName || ''} ${patient?.lastName || ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">OP Number:</span>
          <span class="info-value">${patient?.opNumber || ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Age/Gender:</span>
          <span class="info-value">${patient?.age || ''} / ${patient?.gender || ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Doctor:</span>
          <span class="info-value">Dr. ${doctor?.user?.name || ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Test Name:</span>
          <span class="info-value">${labRequest.testName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Report Date:</span>
          <span class="info-value">${new Date().toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Sample Collected:</span>
          <span class="info-value">${labRequest.sampleCollectedAt ? new Date(labRequest.sampleCollectedAt).toLocaleString() : 'N/A'}</span>
        </div>
      </div>

      <div class="test-header">
        <strong>Test Results</strong>
      </div>

      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Reference Range</th>
            <th>Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${resultsHTML}
        </tbody>
      </table>

      ${labRequest.overallRemarks ? `
        <div style="margin-top: 20px;">
          <strong>Overall Remarks:</strong><br>
          ${labRequest.overallRemarks}
        </div>
      ` : ''}

      ${labRequest.summaryResult ? `
        <div style="margin-top: 10px;">
          <strong>Summary:</strong><br>
          ${labRequest.summaryResult}
        </div>
      ` : ''}

      <div class="footer">
        <p>This report is confidential and intended for the patient and authorized healthcare providers only.</p>
        <p>Report generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;