const express = require('express');
const router = express.Router();
const axios = require('axios');
const Consultation = require('../models/Consultation');
const Visit = require('../models/Visit');
const { authAny } = require('../middleware/auth');

const DISEASE_ML_SERVICE_URL = process.env.DISEASE_ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Manual prediction based on user input
 * MUST BE ABOVE ID-BASED ROUTE
 */
router.post('/predict/manual', authAny, async (req, res) => {
    try {
        const { parameters, age, gender } = req.body;
        
        if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
            return res.status(400).json({ message: 'Parameters array is required' });
        }
        
        // Call Python ML service
        const response = await axios.post(`${DISEASE_ML_SERVICE_URL}/predict`, {
            patientId: 'manual',
            parameters,
            age: age || 40,
            gender: gender || 'Male'
        });
        
        res.json({
            prediction: response.data
        });
        
    } catch (err) {
        console.error('Manual disease prediction error:', err.message);
        res.status(500).json({ 
            message: 'Manual disease prediction failed', 
            error: err.response?.data?.detail || err.message 
        });
    }
});

/**
 * Predict disease risk based on lab results from a consultation
 */
router.post('/predict/:consultationId', authAny, async (req, res) => {
    try {
        const { consultationId } = req.params;
        
        const consultation = await Consultation.findById(consultationId)
            .populate('patientId')
            .lean();
            
        if (!consultation) {
            return res.status(404).json({ message: 'Consultation not found' });
        }
        
        // Extract lab parameters
        const parameters = [];
        if (consultation.labRequests) {
            consultation.labRequests.forEach(request => {
                if (request.parameterResults) {
                    request.parameterResults.forEach(result => {
                        const val = parseFloat(result.value);
                        if (!isNaN(val)) {
                            parameters.push({
                                name: result.parameterName,
                                value: val,
                                unit: result.unit
                            });
                        }
                    });
                }
            });
        }
        
        if (parameters.length === 0) {
            return res.status(400).json({ message: 'No numeric lab results found in this consultation' });
        }
        
        // Get patient age and gender if available
        let age = 40;
        let gender = 'Male';
        
        if (consultation.patientId) {
            const dob = consultation.patientId.dob;
            if (dob) {
                const diff = Date.now() - new Date(dob).getTime();
                age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
            }
            gender = consultation.patientId.gender || 'Male';
        }
        
        // Call Python ML service
        const response = await axios.post(`${DISEASE_ML_SERVICE_URL}/predict`, {
            patientId: consultation.patientId?._id.toString() || 'unknown',
            parameters,
            age,
            gender
        });
        
        res.json({
            consultationId,
            prediction: response.data
        });
        
    } catch (err) {
        console.error('Disease prediction error:', err.message);
        res.status(500).json({ 
            message: 'Disease prediction failed', 
            error: err.response?.data?.detail || err.message 
        });
    }
});

/**
 * Get service status
 */
router.get('/status', authAny, async (req, res) => {
    try {
        const response = await axios.get(`${DISEASE_ML_SERVICE_URL}/`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ 
            message: 'Disease prediction service is offline', 
            error: err.message 
        });
    }
});

/**
 * Manual kidney disease prediction
 */
router.post('/predict/kidney/manual', authAny, async (req, res) => {
    try {
        const { parameters, age, gender } = req.body;
        
        if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
            return res.status(400).json({ message: 'Parameters array is required' });
        }
        
        // Call Python ML service
        const response = await axios.post(`${DISEASE_ML_SERVICE_URL}/predict/kidney`, {
            patientId: 'manual',
            parameters,
            age: age || 40,
            gender: gender || 'Male'
        });
        
        res.json({
            prediction: response.data
        });
        
    } catch (err) {
        console.error('Kidney disease prediction error:', err.message);
        res.status(500).json({ 
            message: 'Kidney disease prediction failed', 
            error: err.response?.data?.detail || err.message 
        });
    }
});

/**
 * Manual liver disease prediction
 */
router.post('/predict/liver/manual', authAny, async (req, res) => {
    try {
        const { parameters, age, gender } = req.body;
        
        if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
            return res.status(400).json({ message: 'Parameters array is required' });
        }
        
        // Call Python ML service
        const response = await axios.post(`${DISEASE_ML_SERVICE_URL}/predict/liver`, {
            patientId: 'manual',
            parameters,
            age: age || 40,
            gender: gender || 'Male'
        });
        
        res.json({
            prediction: response.data
        });
        
    } catch (err) {
        console.error('Liver disease prediction error:', err.message);
        res.status(500).json({ 
            message: 'Liver disease prediction failed', 
            error: err.response?.data?.detail || err.message 
        });
    }
});

/**
 * Manual sepsis prediction
 */
router.post('/predict/sepsis/manual', authAny, async (req, res) => {
    try {
        const { parameters, age, gender } = req.body;
        
        if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
            return res.status(400).json({ message: 'Parameters array is required' });
        }
        
        // Call Python ML service
        const response = await axios.post(`${DISEASE_ML_SERVICE_URL}/predict/sepsis`, {
            patientId: 'manual',
            parameters,
            age: age || 40,
            gender: gender || 'Male'
        });
        
        res.json({
            prediction: response.data
        });
        
    } catch (err) {
        console.error('Sepsis prediction error:', err.message);
        res.status(500).json({ 
            message: 'Sepsis prediction failed', 
            error: err.response?.data?.detail || err.message 
        });
    }
});

/**
 * Manual cardiovascular disease prediction
 */
router.post('/predict/cardio/manual', authAny, async (req, res) => {
    try {
        const { parameters, age, gender } = req.body;
        
        if (!parameters || !Array.isArray(parameters) || parameters.length === 0) {
            return res.status(400).json({ message: 'Parameters array is required' });
        }
        
        // Call Python ML service
        const response = await axios.post(`${DISEASE_ML_SERVICE_URL}/predict/cardio`, {
            patientId: 'manual',
            parameters,
            age: age || 40,
            gender: gender || 'Male'
        });
        
        res.json({
            prediction: response.data
        });
        
    } catch (err) {
        console.error('Cardiovascular prediction error:', err.message);
        res.status(500).json({ 
            message: 'Cardiovascular prediction failed', 
            error: err.response?.data?.detail || err.message 
        });
    }
});

module.exports = router;
