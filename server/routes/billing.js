// routes/billing.js
const express = require('express');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const LabTest = require('../models/LabTest');
const Medicine = require('../models/Medicine');
const Consultation = require('../models/Consultation');
const { authAny, requireStaff } = require('../middleware/auth');
const router = express.Router();

// Razorpay SDK
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret
});

/**
 * POST /api/billing/create-order
 * Create a Razorpay order for payment
 */
router.post('/create-order', authAny, async (req, res) => {
  try {
    const { billId, amount, patientName, patientEmail, patientPhone } = req.body;

    if (!billId || !amount) {
      return res.status(400).json({ message: 'Bill ID and amount are required' });
    }

    // Convert amount to paise (smallest unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: billId,
      payment_capture: 1,
      notes: {
        billId,
        patientName: patientName || 'N/A',
        patientEmail: patientEmail || 'N/A'
      }
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: 'Failed to create Razorpay order' });
    }

    // Store razorpayOrderId in bill
    await Bill.findByIdAndUpdate(billId, { razorpayOrderId: order.id });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.key_id
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      message: 'Error creating payment order',
      error: error.message 
    });
  }
});

/**
 * POST /api/billing/verify-payment
 * Verify Razorpay payment with HMAC SHA256 signature
 */
router.post('/verify-payment', authAny, async (req, res) => {
  try {
    const { billId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentSource } = req.body;

    if (!billId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing required payment verification data' });
    }

    // Verify the signature using HMAC SHA256
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.key_secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ 
        success: false,
        message: 'Payment verification failed - Invalid signature' 
      });
    }

    // Signature is valid - update bill with payment details
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Update bill with payment information
    bill.razorpayOrderId = razorpayOrderId;
    bill.razorpayPaymentId = razorpayPaymentId;
    bill.razorpaySignature = razorpaySignature;
    bill.paymentSource = paymentSource || 'card';
    bill.paymentMethod = mapPaymentSource(paymentSource);
    bill.paidAmount = bill.totalAmount;
    bill.status = 'Paid';

    await bill.save();

    res.json({
      success: true,
      message: 'Payment verified and bill updated successfully',
      bill
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying payment',
      error: error.message 
    });
  }
});

// Helper function to map payment source to paymentMethod
function mapPaymentSource(source) {
  const sourceMap = {
    upi: 'UPI',
    card: 'Card',
    netbanking: 'Netbanking',
    wallet: 'Online'
  };
  return sourceMap[source] || 'Online';
}

/**
 * GET /api/billing/search?opNumber=
 * Search for patient or visit by OP number
 */
router.get('/search', authAny, requireStaff(['Billing', 'Admin']), async (req, res) => {
  try {
    const { opNumber } = req.query;
    if (!opNumber) {
      return res.status(400).json({ message: 'OP number is required' });
    }

    const patient = await Patient.findOne({ opNumber })
      .select('firstName lastName opNumber phone age gender');

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get recent visits for this patient
    const visits = await Visit.find({ patientId: patient._id })
      .populate('doctorId', 'user')
      .populate('departmentId', 'name')
      .sort({ appointmentDate: -1 })
      .limit(10)
      .select('appointmentDate tokenNumber status prescriptions prescriptionStatus');

    // Get existing bills for these visits
    const visitIds = visits.map(v => v._id);
    const bills = await Bill.find({ visitId: { $in: visitIds } })
      .sort({ generatedAt: -1 });

    res.json({
      patient,
      visits: visits.map(visit => ({
        ...visit.toObject(),
        bill: bills.find(b => b.visitId.equals(visit._id)) || null
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/billing/visit/:visitId
 * Get bill details for a specific visit, including charges from other modules
 */
router.get('/visit/:visitId', authAny, requireStaff(['Billing', 'Admin']), async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId)
      .populate('patientId', 'firstName lastName opNumber phone age gender')
      .populate({
        path: 'doctorId',
        populate: { path: 'user', model: 'User' }
      })
      .populate('prescriptions.medicineId', 'name price');

    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Get consultation for lab requests
    const consultation = await Consultation.findOne({ visitId })
      .populate('labRequests.testId', 'name price');

    // Get existing bill or create placeholder
    let bill = await Bill.findOne({ visitId }).populate('visitId patientId');

    // Auto-populate charges from other modules
    const autoItems = [];

    // Consultation fee
    if (visit.doctorId && visit.doctorId.consultationFee) {
      autoItems.push({
        description: `Consultation - ${visit.doctorId.user?.name || 'Doctor'}`,
        amount: visit.doctorId.consultationFee,
        type: 'consultation'
      });
    }

    // Lab tests from consultation
    if (consultation && consultation.labRequests && consultation.labRequests.length > 0) {
      for (const labRequest of consultation.labRequests) {
        if (labRequest.testId && labRequest.testId.price) {
          autoItems.push({
            description: `${labRequest.testId.name}`,
            amount: labRequest.testId.price,
            type: 'lab',
            referenceId: labRequest.testId._id
          });
        }
      }
    }

    // Pharmacy charges from prescriptions
    if (visit.prescriptions && visit.prescriptions.length > 0) {
      for (const prescription of visit.prescriptions) {
        if (prescription.medicineId && prescription.medicineId.price) {
          autoItems.push({
            description: `${prescription.medicineId.name} (${prescription.quantity})`,
            amount: prescription.medicineId.price * prescription.quantity,
            type: 'pharmacy',
            referenceId: prescription.medicineId._id
          });
        }
      }
    }

    if (bill) {
      // Merge existing items with auto-items (avoid duplicates)
      const existingDescriptions = bill.items.map(item => item.description);
      const newAutoItems = autoItems.filter(item => !existingDescriptions.includes(item.description));
      bill.items = [...bill.items, ...newAutoItems];
      bill.save(); // Trigger pre-save calculations
    } else {
      // Create new bill with auto-populated items
      bill = new Bill({
        visitId: visit._id,
        patientId: visit.patientId._id,
        items: autoItems
      });
      await bill.save();
    }

    res.json({ bill, visit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * POST /api/billing
 * Create a new bill for a visit
 */
router.post('/', authAny, requireStaff(['Billing', 'Admin']), async (req, res) => {
  try {
    const { visitId, items, paymentMethod } = req.body;

    const visit = await Visit.findById(visitId).populate('patientId');
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Check if bill already exists
    const existingBill = await Bill.findOne({ visitId });
    if (existingBill) {
      return res.status(400).json({ message: 'Bill already exists for this visit' });
    }

    const bill = new Bill({
      visitId,
      patientId: visit.patientId._id,
      items: items || [],
      paymentMethod: paymentMethod || 'Cash'
    });

    await bill.save();
    await bill.populate('visitId patientId');

    res.status(201).json({ message: 'Bill created successfully', bill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PUT /api/billing/:id
 * Update bill items or payment details
 */
router.put('/:id', authAny, requireStaff(['Billing', 'Admin']), async (req, res) => {
  try {
    const { items, paidAmount, paymentMethod } = req.body;

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (items !== undefined) {
      bill.items = items;
    }
    if (paidAmount !== undefined) {
      bill.paidAmount = paidAmount;
    }
    if (paymentMethod) {
      bill.paymentMethod = paymentMethod;
    }

    await bill.save();
    await bill.populate('visitId patientId');

    res.json({ message: 'Bill updated successfully', bill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/billing
 * Get all bills with optional filters
 */
router.get('/', authAny, requireStaff(['Billing', 'Admin']), async (req, res) => {
  try {
    const { status, dateFrom, dateTo, patientId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    if (dateFrom || dateTo) {
      query.generatedAt = {};
      if (dateFrom) query.generatedAt.$gte = new Date(dateFrom);
      if (dateTo) query.generatedAt.$lte = new Date(dateTo);
    }

    const bills = await Bill.find(query)
      .populate('visitId', 'appointmentDate tokenNumber status')
      .populate('patientId', 'firstName lastName opNumber')
      .sort({ generatedAt: -1 });

    res.json({ bills });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET /api/billing/:id
 * Get a specific bill
 */
router.get('/:id', authAny, requireStaff(['Billing', 'Admin']), async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('visitId', 'appointmentDate tokenNumber status prescriptions')
      .populate('patientId', 'firstName lastName opNumber phone age gender');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({ bill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;