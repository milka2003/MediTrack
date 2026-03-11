const express = require('express');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const { signStaffToken, signPatientToken } = require('../utils/jwt');
const { authAny, requireStaff } = require('../middleware/auth');
const { nextSeq } = require('../utils/counters');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// STAFF LOGIN
router.post('/staff-login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const query = identifier.includes('@')
      ? { email: identifier }
      : { username: identifier };

    const user = await User.findOne(query);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signStaffToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        username: user.username
      },
      requirePasswordChange: !!user.firstLogin
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATIENT SIGNUP
router.post('/patient-signup', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, gender, age, password } = req.body;
    
    // Check if patient already exists
    const existing = await Patient.findOne({ $or: [{ phone }, { email }] });
    if (existing) {
      return res.status(400).json({ message: 'Patient with this phone or email already exists' });
    }

    // Generate OP Number (YY-seq)
    const year = new Date().getFullYear().toString().slice(-2);
    const seqNum = await nextSeq('patient_op');
    const opNumber = `${year}-${seqNum}`;

    const passwordHash = await bcrypt.hash(password, 10);

    const patient = new Patient({
      firstName,
      lastName,
      phone,
      email,
      gender,
      age,
      passwordHash,
      opNumber,
      portalAccess: true
    });

    await patient.save();
    res.status(201).json({ 
      message: 'Patient registered successfully', 
      opNumber,
      identifier: opNumber 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// PATIENT LOGIN
router.post('/patient-login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Find patient by OP number or phone
    // OP number format: YY-seq (e.g., 25-1062)
    const query = identifier.includes('-')
      ? { opNumber: identifier }
      : { phone: identifier };

    const patient = await Patient.findOne(query);
    if (!patient || !patient.hasPortalAccess()) {
      return res.status(401).json({ message: 'Invalid credentials or portal access not enabled' });
    }

    const ok = await bcrypt.compare(password, patient.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    patient.lastLogin = new Date();
    await patient.save();

    // Fetch active visit (latest that is not VisitClosed)
    const activeVisit = await Visit.findOne({ 
      patientId: patient._id, 
      status: { $ne: 'VisitClosed' } 
    }).sort({ createdAt: -1 });

    const token = signPatientToken(patient);
    res.json({
      token,
      user: {
        id: patient._id,
        name: patient.firstName + ' ' + patient.lastName,
        opNumber: patient.opNumber,
        role: 'Patient',
        currentVisitId: activeVisit ? activeVisit._id : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATIENT GOOGLE LOGIN
router.post('/patient-google-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Missing token' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, sub: googleId, given_name, family_name } = payload;

    // Find patient by email or googleId
    let patient = await Patient.findOne({ $or: [{ email }, { googleId }] });

    if (!patient) {
      // If patient doesn't exist, CREATE them (Google Signup)
      const year = new Date().getFullYear().toString().slice(-2);
      const seqNum = await nextSeq('patient_op');
      const opNumber = `${year}-${seqNum}`;

      patient = new Patient({
        firstName: given_name || 'Google',
        lastName: family_name || 'User',
        email,
        googleId,
        opNumber,
        portalAccess: true,
        phone: 'Not provided' // Can be updated later in profile
      });
      await patient.save();
    }

    // Update googleId if not set
    if (!patient.googleId) {
      patient.googleId = googleId;
    }
    
    if (!patient.portalAccess) {
      patient.portalAccess = true;
    }

    patient.lastLogin = new Date();
    await patient.save();

    // Fetch active visit
    const activeVisit = await Visit.findOne({ 
      patientId: patient._id, 
      status: { $ne: 'VisitClosed' } 
    }).sort({ createdAt: -1 });

    const authToken = signPatientToken(patient);
    res.json({
      token: authToken,
      user: {
        id: patient._id,
        name: patient.firstName + ' ' + patient.lastName,
        opNumber: patient.opNumber,
        role: 'Patient',
        currentVisitId: activeVisit ? activeVisit._id : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during Google login' });
  }
});

// CHANGE PASSWORD
router.post('/change-password', authAny, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    if (req.auth.kind === 'staff') {
      await User.findByIdAndUpdate(req.auth.id, { passwordHash, firstLogin: false });
    } else if (req.auth.kind === 'patient') {
      await Patient.findByIdAndUpdate(req.auth.id, { passwordHash });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ENABLE PATIENT PORTAL ACCESS (Staff only)
router.post('/enable-patient-portal', authAny, requireStaff(['Admin', 'Reception']), async (req, res) => {
  try {
    const { patientId, initialPassword } = req.body;
    
    if (!patientId || !initialPassword || initialPassword.length < 6) {
      return res.status(400).json({ message: 'Patient ID and password (min 6 chars) required' });
    }
    
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Hash password and enable portal access
    const passwordHash = await bcrypt.hash(initialPassword, 10);
    patient.passwordHash = passwordHash;
    patient.portalAccess = true;
    await patient.save();
    
    res.json({ message: 'Patient portal access enabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
