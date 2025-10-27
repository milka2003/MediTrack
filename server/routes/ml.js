// server/routes/ml.js
// Machine Learning endpoints

const express = require('express');
const router = express.Router();
const labAnomalyDetection = require('../ml/labAnomalyDetection');
const Consultation = require('../models/Consultation');
const { authAny, requireStaff } = require('../middleware/auth');

/**
 * Train ML models on historical lab data
 */
router.post('/train', authAny, requireStaff(['Admin', 'Lab']), async (req, res) => {
  try {
    // Authorization already checked by middleware

    // Fetch historical lab results
    const consultations = await Consultation.find({
      'labRequests': { $exists: true, $ne: [] },
      'labRequests.parameterResults': { $exists: true, $ne: [] }
    }).select('labRequests');

    if (consultations.length === 0) {
      return res.status(400).json({ message: 'Insufficient historical data for training' });
    }

    // Flatten lab requests
    const allLabRequests = consultations.flatMap(c => c.labRequests);

    // Train models
    const success = labAnomalyDetection.trainModels(allLabRequests);

    if (!success) {
      return res.status(400).json({ message: 'Training failed - insufficient data' });
    }

    const metrics = labAnomalyDetection.getMetrics();

    res.json({
      message: 'Models trained successfully',
      trainingDate: metrics.lastTrainingDate,
      samplesUsed: allLabRequests.length,
      metrics: metrics.metrics
    });
  } catch (err) {
    console.error('Training error:', err);
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

    const prediction = labAnomalyDetection.predictAnomalies(parameterResults);

    res.json(prediction);
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ message: 'Prediction failed', error: err.message });
  }
});

/**
 * Get model metrics and comparison
 */
router.get('/metrics', authAny, async (req, res) => {
  try {
    const comparison = labAnomalyDetection.getModelComparison();
    res.json(comparison);
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).json({ message: 'Failed to retrieve metrics', error: err.message });
  }
});

/**
 * Get best performing model info
 */
router.get('/best-model', authAny, async (req, res) => {
  try {
    const bestModel = labAnomalyDetection.getBestModel();

    if (!bestModel) {
      return res.status(400).json({ message: 'Models not trained yet' });
    }

    res.json(bestModel);
  } catch (err) {
    console.error('Best model error:', err);
    res.status(500).json({ message: 'Failed to retrieve best model', error: err.message });
  }
});

/**
 * Get training status
 */
router.get('/status', authAny, async (req, res) => {
  try {
    const metrics = labAnomalyDetection.getMetrics();
    res.json({
      isTrained: metrics.isTrained,
      lastTrainingDate: metrics.lastTrainingDate,
      modelCount: Object.keys(metrics.metrics).length,
      models: Object.keys(metrics.metrics)
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ message: 'Failed to retrieve status', error: err.message });
  }
});

module.exports = router;