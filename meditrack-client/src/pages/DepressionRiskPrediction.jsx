// src/pages/DepressionRiskPrediction.jsx
import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, CircularProgress,
  Alert, Card, CardContent, Stepper, Step, StepLabel,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Stack, Chip
} from '@mui/material';
import { ArrowBack, ArrowForward, Analytics, Download as DownloadIcon } from '@mui/icons-material';
import api from '../api/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const REFERENCE_RANGES = {
  LBXWBCSI: '4.5 - 11.0 10³/μL',
  LBXRBCSI: '4.50 - 5.90 10⁶/μL',
  LBXHGB: '13.5 - 17.5 g/dL',
  LBXPLTSI: '150 - 450 10³/μL',
  LBXGLU: '70 - 100 mg/dL',
  LBXSAL: '3.5 - 5.0 g/dL',
  LBXSCR: '0.6 - 1.2 mg/dL',
  LBXHSCRP: '< 1.0 mg/L',
  LBXIRN: '60 - 170 μg/dL'
};

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way",
  "How difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?"
];

const LAB_FEATURES = [
  { id: 'LBXWBCSI', name: 'WBC count (10³/μL)', placeholder: 'e.g., 5.5' },
  { id: 'LBXRBCSI', name: 'RBC count (10⁶/μL)', placeholder: 'e.g., 4.54' },
  { id: 'LBXHGB', name: 'Hemoglobin (g/dL)', placeholder: 'e.g., 15.3' },
  { id: 'LBXPLTSI', name: 'Platelet count (10³/μL)', placeholder: 'e.g., 254' },
  { id: 'LBXGLU', name: 'Glucose (mg/dL)', placeholder: 'e.g., 103' },
  { id: 'LBXSAL', name: 'Albumin (g/dL)', placeholder: 'e.g., 3.8' },
  { id: 'LBXSCR', name: 'Creatinine (mg/dL)', placeholder: 'e.g., 0.78' },
  { id: 'LBXHSCRP', name: 'C-reactive protein (mg/L)', placeholder: 'e.g., 28.68' },
  { id: 'LBXIRN', name: 'Iron (μg/dL)', placeholder: 'e.g., 64' },
];

const STEPS = ['Lab Results', 'PHQ-9 Survey', 'Risk Prediction'];

export default function DepressionRiskPrediction() {
  const [activeStep, setActiveStep] = useState(0);
  const [labData, setLabData] = useState({
    LBXWBCSI: '', LBXRBCSI: '', LBXHGB: '', LBXPLTSI: '', LBXGLU: '',
    LBXSAL: '', LBXSCR: '', LBXHSCRP: '', LBXIRN: ''
  });
  const [phqData, setPhqData] = useState(Array(10).fill('0'));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleLabChange = (e) => {
    setLabData({ ...labData, [e.target.name]: e.target.value });
  };

  const handlePhqChange = (index, value) => {
    const newData = [...phqData];
    newData[index] = value;
    setPhqData(newData);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Basic validation for lab data
      const missing = LAB_FEATURES.filter(f => !labData[f.id]);
      if (missing.length > 0) {
        setError(`Please fill in all lab results: ${missing.map(m => m.name).join(', ')}`);
        return;
      }
    }
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Combine features
      const features = {};
      LAB_FEATURES.forEach(f => features[f.id] = parseFloat(labData[f.id]));
      phqData.forEach((val, idx) => {
        const id = `DPQ0${idx + 1}0`.replace('0100', '100'); // Handles DPQ010 to DPQ100
        features[id === 'DPQ0100' ? 'DPQ100' : id] = parseFloat(val);
      });

      const { data } = await api.post('/ml/depression/predict', { features });
      setResult(data.data);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(63, 81, 181); // Indigo color for mental health
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Holy Cross Hospital', 15, 20);
    doc.setFontSize(12);
    doc.text('Depression Risk Analysis Report', 15, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 20);

    // 1. Analysis Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('1. Analysis Summary', 15, 55);
    doc.setFontSize(12);
    doc.text(`Risk Level: ${result.risk_level.toUpperCase()}`, 15, 65);
    doc.text(`Risk Probability: ${(result.probability * 100).toFixed(1)}%`, 15, 75);
    doc.text(`Model Confidence: ${(result.confidence * 100).toFixed(1)}%`, 15, 85);

    // 2. Lab Findings
    doc.setFontSize(16);
    doc.text('2. Laboratory Findings', 15, 100);
    
    const labTableData = LAB_FEATURES.map(f => [
      f.name,
      labData[f.id],
      REFERENCE_RANGES[f.id] || 'N/A'
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['Parameter', 'Value', 'Reference Range']],
      body: labTableData,
      headStyles: { fillColor: [74, 85, 104] },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    // 3. PHQ-9 Responses
    let nextY = doc.lastAutoTable.finalY + 15;
    if (nextY > 250) {
      doc.addPage();
      nextY = 20;
    }
    
    doc.setFontSize(16);
    doc.text('3. PHQ-9 Screening Responses', 15, nextY);
    
    const phqTableData = PHQ9_QUESTIONS.map((q, idx) => {
      const responses = ["Not at all", "Several days", "More than half", "Nearly every day"];
      return [idx + 1, q, responses[parseInt(phqData[idx])] || "N/A"];
    });

    autoTable(doc, {
      startY: nextY + 5,
      head: [['#', 'Question', 'Response']],
      body: phqTableData,
      headStyles: { fillColor: [121, 134, 203] },
      columnStyles: {
        1: { cellWidth: 100 }
      },
      theme: 'striped',
      margin: { left: 15, right: 15 }
    });

    // 4. Clinical Interpretation
    nextY = doc.lastAutoTable.finalY + 15;
    if (nextY > 250) {
      doc.addPage();
      nextY = 20;
    }
    doc.setFontSize(16);
    doc.text('4. Clinical Interpretation', 15, nextY);
    doc.setFontSize(11);
    const interpretation = result.depression_risk 
      ? "The model suggests a potential risk of depression. Clinical follow-up and professional mental health assessment are recommended."
      : "The model suggests a low risk of clinical depression based on the provided parameters.";
    
    const splitInterpretation = doc.splitTextToSize(interpretation, pageWidth - 30);
    doc.text(splitInterpretation, 15, nextY + 10);

    // Footer
    const finalY = doc.lastAutoTable?.finalY || 250;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Note: This is an AI-generated report for diagnostic research purposes. Please consult with a psychiatrist or clinical psychologist.', 15, 280);

    doc.save(`Depression_Risk_Report_${new Date().getTime()}.pdf`);
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return 'error';
      case 'Moderate': return 'warning';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>Depression Risk Analysis</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
        Predict depression risk using laboratory blood parameters and PHQ-9 mental health screening.
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {activeStep === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>Laboratory Results</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Enter the clinical blood test values for the patient.
          </Typography>
          <Grid container spacing={3}>
            {LAB_FEATURES.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.id}>
                <TextField
                  fullWidth
                  label={feature.name}
                  name={feature.id}
                  type="number"
                  value={labData[feature.id]}
                  onChange={handleLabChange}
                  placeholder={feature.placeholder}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button variant="contained" onClick={handleNext} endIcon={<ArrowForward />}>
              Next: PHQ-9 Survey
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>PHQ-9 Mental Health Questionnaire</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Over the last 2 weeks, how often has the patient been bothered by any of the following problems?
          </Typography>
          
          <Stack spacing={3}>
            {PHQ9_QUESTIONS.map((q, index) => (
              <Box key={index} sx={{ pb: 2, borderBottom: '1px solid #eee' }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                    {index + 1}. {q}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={phqData[index]}
                    onChange={(e) => handlePhqChange(index, e.target.value)}
                  >
                    <FormControlLabel value="0" control={<Radio />} label="Not at all" />
                    <FormControlLabel value="1" control={<Radio />} label="Several days" />
                    <FormControlLabel value="2" control={<Radio />} label="More than half the days" />
                    <FormControlLabel value="3" control={<Radio />} label="Nearly every day" />
                  </RadioGroup>
                </FormControl>
              </Box>
            ))}
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
              Back
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit} 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Analytics />}
            >
              {loading ? 'Analyzing...' : 'Predict Risk'}
            </Button>
          </Box>
        </Paper>
      )}

      {activeStep === 2 && result && (
        <Box>
          <Card sx={{ mb: 4, boxShadow: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>Prediction Analysis Result</Typography>
              <Box sx={{ my: 4 }}>
                <Chip 
                  label={`${result.risk_level} Risk`.toUpperCase()} 
                  color={getRiskColor(result.risk_level)}
                  sx={{ fontSize: '1.5rem', py: 3, px: 2, height: 'auto', fontWeight: 800 }}
                />
              </Box>
              
              <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="body2" color="textSecondary">Risk Probability</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{(result.probability * 100).toFixed(1)}%</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="body2" color="textSecondary">Model Confidence</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{(result.confidence * 100).toFixed(1)}%</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Alert severity={result.depression_risk ? "warning" : "success"} sx={{ mt: 4, textAlign: 'left' }}>
                {result.depression_risk 
                  ? "The model suggests a potential risk of depression. Clinical follow-up and professional mental health assessment are recommended."
                  : "The model suggests a low risk of clinical depression based on the provided parameters."}
              </Alert>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadReport}
            >
              Download Detailed Report
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                setResult(null);
                setActiveStep(0);
                setLabData({
                  LBXWBCSI: '', LBXRBCSI: '', LBXHGB: '', LBXPLTSI: '', LBXGLU: '',
                  LBXSAL: '', LBXSCR: '', LBXHSCRP: '', LBXIRN: ''
                });
                setPhqData(Array(10).fill('0'));
              }}
            >
              Start New Analysis
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
