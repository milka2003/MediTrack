/**
 * Create test lab data for ML training
 * Creates consultations with lab results that have both normal and abnormal values
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Consultation = require('./models/Consultation');
const Visit = require('./models/Visit');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
const Department = require('./models/Department');
require('dotenv').config();

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a test patient
    const randomPhone = `9${Math.floor(Math.random() * 1000000000)}`;
    const randomEmail = `mltest${Date.now()}@test.com`;
    const patient = await Patient.create({
      firstName: 'ML Test',
      lastName: 'Patient',
      email: randomEmail,
      phone: randomPhone,
      age: 35,
      gender: 'M'
    });
    console.log('✅ Created test patient');

    // Create a test department
    const departmentName = `ML Test Dept ${Date.now()}`;
    const department = await Department.create({
      name: departmentName,
      description: 'Test department for ML training'
    });
    console.log('✅ Created test department');

    // Create a test user for doctor
    const doctorEmail = `mldoctor${Date.now()}@test.com`;
    const doctorUsername = `mldoctor${Date.now()}`;
    const passwordHash = await bcrypt.hash('test123', 10);
    const user = await User.create({
      name: 'Dr. John',
      email: doctorEmail,
      username: doctorUsername,
      passwordHash: passwordHash,
      role: 'Doctor'
    });
    console.log('✅ Created test doctor user');

    // Create a test doctor
    const doctor = await Doctor.create({
      user: user._id,
      department: department._id,
      specialization: 'General Physician',
      registrationNumber: 'ML123456'
    });
    console.log('✅ Created test doctor');

    // Create 10 visits with consultations containing lab data
    const consultations = [];
    
    for (let i = 0; i < 10; i++) {
      // Alternate between normal and abnormal values
      const isAbnormal = i % 2 === 0;
      
      // Create visit first
      const visit = await Visit.create({
        patientId: patient._id,
        opNumber: `OP${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        doctorId: doctor._id,
        tokenNumber: i + 1,
        appointmentDate: new Date(),
        status: 'closed'
      });

      // Create consultation with lab data
      const consultation = {
        visitId: visit._id,
        patientId: patient._id,
        doctorId: doctor._id,
        diagnosis: 'Test consultation for ML training',
        chiefComplaints: `Test case ${i + 1}`,
        labRequests: [
          {
            testName: 'Blood Test',
            parameterResults: [
              {
                parameterName: 'Hemoglobin',
                value: isAbnormal ? '7.5' : '13.5', // Normal: 12-17, Abnormal: <10
                unit: 'g/dL',
                referenceRange: '12-17',
                isAbnormal: isAbnormal
              },
              {
                parameterName: 'WBC',
                value: isAbnormal ? '15000' : '7000', // Normal: 4500-11000, Abnormal: >15000
                unit: 'cells/μL',
                referenceRange: '4500-11000',
                isAbnormal: isAbnormal
              },
              {
                parameterName: 'Glucose',
                value: isAbnormal ? '250' : '95', // Normal: 70-100, Abnormal: >200
                unit: 'mg/dL',
                referenceRange: '70-100',
                isAbnormal: isAbnormal
              }
            ],
            status: 'Completed',
            completedAt: new Date()
          }
        ],
        createdAt: new Date()
      };
      
      consultations.push(consultation);
    }

    // Insert consultations into database
    const result = await Consultation.insertMany(consultations);
    console.log(`✅ Created ${result.length} test consultations with lab data`);
    console.log('Lab data includes both normal (5) and abnormal (5) results');
    console.log('\nYou can now click "Train Models" in the ML Dashboard');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating test data:', err.message);
    process.exit(1);
  }
}

createTestData();