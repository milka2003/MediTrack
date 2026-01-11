// server/routes/ml.js
// Machine Learning endpoints (calls Python ML service)

const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const Visit = require('../models/Visit');
const { authAny, requireStaff } = require('../middleware/auth');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

/**
 * Train ML models on historical lab data
 */
router.post('/train', authAny, requireStaff(['Admin', 'Lab']), async (req, res) => {
  try {
    // Fetch historical lab results
    const consultations = await Consultation.find({
      'labRequests': { $exists: true, $ne: [] },
      'labRequests.parameterResults': { $exists: true, $ne: [] }
    }).select('labRequests');

    console.log(`Found ${consultations.length} consultations with lab data`);

    if (consultations.length === 0) {
      return res.status(400).json({ message: 'Insufficient historical data for training' });
    }

    // Prepare training data: collect consultations with all 3 required parameters
    const trainingData = [];
    const referenceRanges = {
      'hemoglobin': { min: 12.0, max: 17.5 },  // Adult standard range
      'wbc': { min: 4.5, max: 11.0 },          // WBC standard range (×10³/μL)
      'glucose': { min: 70, max: 100 }         // Fasting glucose standard range (mg/dL)
    };
    
    consultations.forEach(c => {
      // For each consultation, collect all parameter values
      let consultationParams = {};
      
      c.labRequests.forEach(req => {
        if (req.parameterResults) {
          req.parameterResults.forEach(param => {
            const paramName = (param.parameterName || '').toLowerCase();
            let value = parseFloat(param.value);
            
            // Normalize WBC if stored as absolute count (cells/µL)
            if ((paramName.includes('wbc') || paramName.includes('white')) && value > 100) {
              value = value / 1000;
            }
            
            // Determine if abnormal based on reference ranges
            let isAbnormal = false;
            for (const [key, range] of Object.entries(referenceRanges)) {
              if (paramName.includes(key)) {
                isAbnormal = value < range.min || value > range.max;
                break;
              }
            }
            
            // Store by parameter type
            if (paramName.includes('hemoglobin')) {
              consultationParams.hemoglobin = { value, isAbnormal, paramName: param.parameterName };
            } else if (paramName.includes('wbc') || paramName.includes('white')) {
              consultationParams.wbc = { value, isAbnormal, paramName: param.parameterName };
            } else if (paramName.includes('glucose') || paramName.includes('fasting')) {
              consultationParams.glucose = { value, isAbnormal, paramName: param.parameterName };
            }
          });
        }
      });
      
      // Only include consultation if it has all 3 parameters
      if (consultationParams.hemoglobin && consultationParams.wbc && consultationParams.glucose) {
        trainingData.push(consultationParams);
      }
    });

    console.log(`Found ${trainingData.length} consultations with all 3 parameters (Hemo, WBC, Glucose)`);
    
    // If insufficient real data, augment with synthetic data
    if (trainingData.length < 20) {
      console.log(`⚠️  Limited real data (${trainingData.length}). Adding synthetic training data...`);
      
      // Generate synthetic data covering the medical spectrum
      const syntheticData = [
        // NORMAL samples - all values within range
        { hemoglobin: { value: 12.0, isAbnormal: false }, wbc: { value: 4.5, isAbnormal: false }, glucose: { value: 70, isAbnormal: false } },
        { hemoglobin: { value: 13.0, isAbnormal: false }, wbc: { value: 7.0, isAbnormal: false }, glucose: { value: 85, isAbnormal: false } },
        { hemoglobin: { value: 13.5, isAbnormal: false }, wbc: { value: 7.2, isAbnormal: false }, glucose: { value: 95, isAbnormal: false } },
        { hemoglobin: { value: 14.0, isAbnormal: false }, wbc: { value: 8.0, isAbnormal: false }, glucose: { value: 90, isAbnormal: false } },
        { hemoglobin: { value: 15.0, isAbnormal: false }, wbc: { value: 9.0, isAbnormal: false }, glucose: { value: 100, isAbnormal: false } },
        { hemoglobin: { value: 16.0, isAbnormal: false }, wbc: { value: 10.0, isAbnormal: false }, glucose: { value: 95, isAbnormal: false } },
        { hemoglobin: { value: 17.5, isAbnormal: false }, wbc: { value: 11.0, isAbnormal: false }, glucose: { value: 90, isAbnormal: false } },
        
        // ABNORMAL samples - low hemoglobin
        { hemoglobin: { value: 10.5, isAbnormal: true }, wbc: { value: 7.0, isAbnormal: false }, glucose: { value: 95, isAbnormal: false } },
        { hemoglobin: { value: 11.0, isAbnormal: true }, wbc: { value: 8.0, isAbnormal: false }, glucose: { value: 90, isAbnormal: false } },
        { hemoglobin: { value: 9.0, isAbnormal: true }, wbc: { value: 7.5, isAbnormal: false }, glucose: { value: 95, isAbnormal: false } },
        { hemoglobin: { value: 7.5, isAbnormal: true }, wbc: { value: 15.0, isAbnormal: true }, glucose: { value: 250, isAbnormal: true } },
        
        // ABNORMAL samples - high hemoglobin
        { hemoglobin: { value: 18.0, isAbnormal: true }, wbc: { value: 7.0, isAbnormal: false }, glucose: { value: 95, isAbnormal: false } },
        { hemoglobin: { value: 19.0, isAbnormal: true }, wbc: { value: 8.0, isAbnormal: false }, glucose: { value: 90, isAbnormal: false } },
        
        // ABNORMAL samples - high WBC
        { hemoglobin: { value: 13.5, isAbnormal: false }, wbc: { value: 12.0, isAbnormal: true }, glucose: { value: 95, isAbnormal: false } },
        { hemoglobin: { value: 14.0, isAbnormal: false }, wbc: { value: 15.0, isAbnormal: true }, glucose: { value: 90, isAbnormal: false } },
        { hemoglobin: { value: 13.0, isAbnormal: false }, wbc: { value: 20.0, isAbnormal: true }, glucose: { value: 95, isAbnormal: false } },
        
        // ABNORMAL samples - low WBC
        { hemoglobin: { value: 13.5, isAbnormal: false }, wbc: { value: 3.5, isAbnormal: true }, glucose: { value: 95, isAbnormal: false } },
        { hemoglobin: { value: 14.0, isAbnormal: false }, wbc: { value: 2.0, isAbnormal: true }, glucose: { value: 90, isAbnormal: false } },
        
        // ABNORMAL samples - high glucose
        { hemoglobin: { value: 13.5, isAbnormal: false }, wbc: { value: 7.0, isAbnormal: false }, glucose: { value: 110, isAbnormal: true } },
        { hemoglobin: { value: 14.0, isAbnormal: false }, wbc: { value: 8.0, isAbnormal: false }, glucose: { value: 150, isAbnormal: true } },
        { hemoglobin: { value: 13.0, isAbnormal: false }, wbc: { value: 7.5, isAbnormal: false }, glucose: { value: 250, isAbnormal: true } },
        
        // ABNORMAL samples - low glucose
        { hemoglobin: { value: 13.5, isAbnormal: false }, wbc: { value: 7.0, isAbnormal: false }, glucose: { value: 65, isAbnormal: true } },
        { hemoglobin: { value: 14.0, isAbnormal: false }, wbc: { value: 8.0, isAbnormal: false }, glucose: { value: 50, isAbnormal: true } },
        
        // ABNORMAL samples - multiple abnormal parameters
        { hemoglobin: { value: 10.0, isAbnormal: true }, wbc: { value: 12.0, isAbnormal: true }, glucose: { value: 110, isAbnormal: true } },
        { hemoglobin: { value: 9.5, isAbnormal: true }, wbc: { value: 3.0, isAbnormal: true }, glucose: { value: 60, isAbnormal: true } }
      ];
      
      trainingData.push(...syntheticData);
      console.log(`✅ Added ${syntheticData.length} synthetic samples. Total: ${trainingData.length}`);
    }
    
    // Debug: Show first 5 complete samples
    console.log('First 5 training samples:');
    trainingData.slice(0, 5).forEach((sample, i) => {
      const isAbnormal = sample.hemoglobin.isAbnormal || sample.wbc.isAbnormal || sample.glucose.isAbnormal;
      console.log(`  [${i}] Hemo:${sample.hemoglobin.value}, WBC:${sample.wbc.value}, Glucose:${sample.glucose.value} → ${isAbnormal ? 'ABNORMAL' : 'NORMAL'}`);
    });
    
    // Count normal vs abnormal
    const abnormalCount = trainingData.filter(s => 
      s.hemoglobin.isAbnormal || s.wbc.isAbnormal || s.glucose.isAbnormal
    ).length;
    const normalCount = trainingData.length - abnormalCount;
    console.log(`Data distribution: ${normalCount} normal, ${abnormalCount} abnormal`);

    if (trainingData.length < 2) {
      return res.status(400).json({ message: `Insufficient data for training. Need at least 2 complete samples (with all 3 parameters), got ${trainingData.length}` });
    }

    // Call Python ML service
    console.log(`Calling Python ML service at ${ML_SERVICE_URL}/api/ml/train`);
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/train`, { trainingData });
    
    console.log('Training response:', response.data);

    res.json({
      message: 'Models trained successfully',
      trainingDate: new Date().toISOString(),
      samplesUsed: trainingData.length,
      metrics: response.data.results
    });
  } catch (err) {
    console.error('Training error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ message: 'Training failed', error: err.message });
  }
});

/**
 * Predict anomalies for lab results
 */
router.post('/predict', authAny, async (req, res) => {
  try {
    const { parameterResults } = req.body;

    if (!parameterResults || !Array.isArray(parameterResults)) {
      return res.status(400).json({ message: 'Invalid parameter results' });
    }

    // Call Python prediction endpoint for each value
    const predictions = await Promise.all(
      parameterResults.map(param =>
        axios.post(`${ML_SERVICE_URL}/api/ml/predict`, { value: param.value })
          .catch(err => ({ data: { error: err.message } }))
      )
    );

    res.json({
      predictions: predictions.map((p, i) => ({
        ...parameterResults[i],
        prediction: p.data.predictions || p.data.error
      }))
    });
  } catch (err) {
    console.error('Prediction error:', err.message);
    res.status(500).json({ message: 'Prediction failed', error: err.message });
  }
});

/**
 * Live prediction with multiple features (Hemoglobin, WBC, Glucose)
 */
router.post('/predict-live', authAny, async (req, res) => {
  try {
    const { hemoglobin, wbc, glucose, model } = req.body;

    // Validate inputs
    if (hemoglobin === undefined || wbc === undefined || glucose === undefined) {
      return res.status(400).json({ 
        message: 'Hemoglobin, WBC, and Glucose values are required',
        example: { hemoglobin: 13.5, wbc: 7.2, glucose: 95, model: 'decision_tree' }
      });
    }

    // Call Python ML service for multi-feature prediction
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/predict-multi`, {
      features: [hemoglobin, wbc, glucose],
      model: model || null
    });

    // Restructure response based on what Python service returns
    const pythonResult = response.data.data;
    let result;
    
    if (pythonResult.model && pythonResult.prediction) {
      // Single model was requested - return with model name and single prediction
      result = {
        input: { hemoglobin, wbc, glucose },
        model: pythonResult.model,
        prediction: pythonResult.prediction
      };
    } else {
      // All models - return predictions object
      result = {
        input: { hemoglobin, wbc, glucose },
        predictions: pythonResult.predictions
      };
    }

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Live prediction error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Prediction failed', 
      error: err.message 
    });
  }
});

/**
 * Get model metrics and comparison
 */
router.get('/metrics', authAny, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/metrics`);
    const data = response.data.data;

    // Transform Python response to frontend format
    if (data.error) {
      return res.status(400).json({ message: data.error });
    }

    // Convert models object to array and transform keys
    const models = Object.entries(data.models || {}).map(([key, value]) => {
      const modelName = key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        name: modelName,
        accuracy: (value.accuracy || 0) * 100,
        precision: (value.precision || 0) * 100,
        recall: (value.recall || 0) * 100,
        f1Score: (value.f1_score || 0) * 100,
        truePositives: value.confusion_matrix?.true_positives || 0,
        falsePositives: value.confusion_matrix?.false_positives || 0,
        trueNegatives: value.confusion_matrix?.true_negatives || 0,
        falseNegatives: value.confusion_matrix?.false_negatives || 0
      };
    });

    res.json({
      trained: true,
      trainingDate: new Date().toISOString(),
      models,
      metrics: data.average_metrics ? {
        avgAccuracy: (data.average_metrics.accuracy || 0) * 100,
        avgPrecision: (data.average_metrics.precision || 0) * 100,
        avgRecall: (data.average_metrics.recall || 0) * 100,
        avgF1Score: (data.average_metrics.f1_score || 0) * 100
      } : null,
      bestModel: data.best_model,
      reliabilityLevel: data.reliability_level
    });
  } catch (err) {
    console.error('Metrics error:', err.message);
    res.status(500).json({ 
      trained: false,
      message: 'Models not trained yet', 
      error: err.message,
      models: []
    });
  }
});

/**
 * Get training status
 */
router.get('/status', authAny, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/status`);
    res.json(response.data);
  } catch (err) {
    console.error('Status error:', err.message);
    res.status(500).json({ message: 'Failed to retrieve status', error: err.message });
  }
});

/**
 * Doctor Performance KNN Endpoints
 */

/**
 * Calculate doctor performance metrics and train KNN model
 */
router.post('/doctor-performance/train', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    // Fetch all active doctors
    const doctors = await Doctor.find({ active: true })
      .populate('user', 'name')
      .populate('department', 'name')
      .lean();

    if (doctors.length === 0) {
      return res.status(400).json({ message: 'No active doctors found' });
    }

    console.log(`Calculating metrics for ${doctors.length} doctors...`);

    // Calculate metrics for each doctor
    const doctorsData = await Promise.all(doctors.map(async (doctor) => {
      try {
        // Get all visits for this doctor
        const visits = await Visit.find({ doctorId: doctor._id }).lean();
        
        // Count completed visits
        const completedVisits = visits.filter(v => v.status === 'closed').length;
        
        // Get unique patients
        const uniquePatients = await Visit.distinct('patientId', { doctorId: doctor._id });
        
        // Get consultations with prescriptions
        const consultationsWithPrescriptions = await Consultation.countDocuments({
          doctorId: doctor._id,
          'prescriptions': { $exists: true, $ne: [] }
        });

        // Calculate repeat patient percentage
        const patientVisitCounts = {};
        visits.forEach(v => {
          const patientId = v.patientId.toString();
          patientVisitCounts[patientId] = (patientVisitCounts[patientId] || 0) + 1;
        });

        const repeatPatients = Object.values(patientVisitCounts).filter(count => count > 1).length;
        const repeatPatientPercentage = uniquePatients.length > 0 
          ? (repeatPatients / uniquePatients.length) * 100 
          : 0;

        return {
          id: doctor._id.toString(),
          name: doctor.user?.name || 'Unknown Doctor',
          department: doctor.department?.name || 'Unknown',
          totalVisits: visits.length,
          uniquePatients: uniquePatients.length,
          averageConsultationFee: doctor.consultationFee || 0,
          visitCompletionRate: visits.length > 0 ? completedVisits / visits.length : 0,
          prescriptionFrequency: visits.length > 0 ? consultationsWithPrescriptions / visits.length : 0,
          repeatPatientPercentage
        };
      } catch (doctorError) {
        console.error(`Error calculating metrics for doctor ${doctor._id}:`, doctorError);
        return null;
      }
    }));

    // Filter out failed doctor calculations
    const validDoctorsData = doctorsData.filter(d => d !== null);

    if (validDoctorsData.length === 0) {
      return res.status(400).json({ message: 'Failed to calculate metrics for any doctor' });
    }

    console.log(`Successfully calculated metrics for ${validDoctorsData.length} doctors`);

    // Send to Python ML service for KNN training
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/api/ml/doctor-performance/train`,
      { doctors: validDoctorsData }
    );

    res.json({
      success: true,
      message: 'Doctor performance KNN model trained',
      doctorsAnalyzed: validDoctorsData.length,
      data: mlResponse.data.data
    });
  } catch (err) {
    console.error('Doctor performance training error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to train doctor performance model', 
      error: err.message 
    });
  }
});

/**
 * Get doctor performance rankings
 */
router.get('/doctor-performance/ranking', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/doctor-performance/ranking`);
    
    if (response.data.data.error) {
      return res.status(400).json({ message: response.data.data.error });
    }

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err) {
    console.error('Doctor ranking error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve doctor rankings', 
      error: err.message 
    });
  }
});

/**
 * Get similar doctors for a specific doctor
 */
router.get('/doctor-performance/similar/:doctorId', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const k = req.query.k || 3;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    const response = await axios.get(
      `${ML_SERVICE_URL}/api/ml/doctor-performance/similar/${doctorId}?k=${k}`
    );

    if (response.data.data.error) {
      return res.status(400).json({ message: response.data.data.error });
    }

    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err) {
    console.error('Similar doctors error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to find similar doctors', 
      error: err.message 
    });
  }
});

/**
 * Get doctor performance KNN status
 */
router.get('/doctor-performance/status', authAny, requireStaff(['Admin']), async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/doctor-performance/status`);
    
    res.json({
      success: true,
      data: response.data.data
    });
  } catch (err) {
    console.error('Doctor performance status error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to retrieve model status', 
      error: err.message 
    });
  }
});

module.exports = router;