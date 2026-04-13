import React, { useState, useRef } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, CircularProgress, Alert, 
  Card, CardContent, Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
  Stack, Tabs, Tab, InputAdornment, LinearProgress
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  ArrowForward as ArrowForwardIcon,
  LocalHospital as HospitalIcon,
  Opacity as OpacityIcon,
  Mood as MoodIcon,
  ReportProblem as WarningIcon,
  Favorite as HeartIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import api from '../api/client';
import DepressionRiskPrediction from './DepressionRiskPrediction';
import { useLocation } from 'react-router-dom';
import { createWorker } from 'tesseract.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const REFERENCE_RANGES = {
  // Anemia
  hemoglobin: '12.0 - 17.5 g/dL',
  mch: '27.0 - 33.0 pg',
  mchc: '32.0 - 36.0 g/dL',
  mcv: '80.0 - 100.0 fL',
  
  // Kidney
  bp: '90/60 - 120/80 mmHg',
  sg: '1.005 - 1.030',
  al: '0 - 1 (Trace)',
  su: '0 (Negative)',
  bgr: '70 - 125 mg/dL',
  bu: '7 - 20 mg/dL',
  sc: '0.6 - 1.2 mg/dL',
  sod: '135 - 145 mEq/L',
  pot: '3.5 - 5.0 mEq/L',
  hemo: '13.5 - 17.5 g/dL',
  pcv: '38.8 - 50.0%',
  wc: '4,500 - 11,000 /μL',
  rc: '4.5 - 5.9 million/μL',

  // Liver
  tb: '0.1 - 1.2 mg/dL',
  db: '0.0 - 0.3 mg/dL',
  alp: '40 - 129 U/L',
  sgpt: '7 - 56 U/L',
  sgot: '8 - 48 U/L',
  tp: '6.3 - 7.9 g/dL',
  alb: '3.5 - 5.0 g/dL',
  ag_ratio: '1.1 - 2.5',

  // Sepsis
  hr: '60 - 100 bpm',
  o2sat: '95 - 100%',
  temp: '36.5 - 37.5 °C',
  sbp: '90 - 120 mmHg',
  map: '70 - 100 mmHg',
  dbp: '60 - 80 mmHg',
  resp: '12 - 20 breaths/min',
  glucose: '70 - 105 mg/dL',
  wbc: '4.0 - 11.0 10³/μL',
  platelets: '150 - 450 10³/μL',

  // Cardio
  totChol: '< 200 mg/dL',
  sysBP: '90 - 120 mmHg',
  diaBP: '60 - 80 mmHg',
  bmi: '18.5 - 24.9 kg/m²',
  heartRate: '60 - 100 bpm'
};

export default function DiseasePrediction() {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 0);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Anemia Inputs
  const [anemiaInputs, setAnemiaInputs] = useState({
    hemoglobin: '11.5',
    mch: '22.7',
    mchc: '29.1',
    mcv: '83.7',
    gender: 'Male'
  });

  // Kidney Inputs
  const [kidneyInputs, setKidneyInputs] = useState({
    age: '48',
    bp: '80',
    sg: '1.020',
    al: '1',
    su: '0',
    bgr: '121',
    bu: '36',
    sc: '1.2',
    sod: '137',
    pot: '4.5',
    hemo: '15.4',
    pcv: '44',
    wc: '7800',
    rc: '5.2'
  });

  // Liver Inputs
  const [liverInputs, setLiverInputs] = useState({
    age: '40',
    gender: 'Male',
    tb: '0.9',
    db: '0.2',
    alp: '190',
    sgpt: '30',
    sgot: '35',
    tp: '6.8',
    alb: '3.3',
    ag_ratio: '0.9'
  });

  // Sepsis Inputs
  const [sepsisInputs, setSepsisInputs] = useState({
    age: '65',
    gender: 'Male',
    hr: '90',
    o2sat: '98',
    temp: '37.5',
    sbp: '120',
    map: '85',
    dbp: '80',
    resp: '20',
    glucose: '110',
    wbc: '11',
    platelets: '150'
  });

  // Cardiovascular Inputs
  const [cardioInputs, setCardioInputs] = useState({
    male: '1',
    age: '40',
    education: '2',
    currentSmoker: '0',
    cigsPerDay: '0',
    bpMeds: '0',
    prevalentStroke: '0',
    prevalentHyp: '0',
    diabetes: '0',
    totChol: '200',
    sysBP: '120',
    diaBP: '80',
    bmi: '25.0',
    heartRate: '75',
    glucose: '80'
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setResult(null);
    setError('');
  };

  const handleAnemiaChange = (e) => {
    const { name, value } = e.target;
    setAnemiaInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleKidneyChange = (e) => {
    const { name, value } = e.target;
    setKidneyInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleLiverChange = (e) => {
    const { name, value } = e.target;
    setLiverInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSepsisChange = (e) => {
    const { name, value } = e.target;
    setSepsisInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleCardioChange = (e) => {
    const { name, value } = e.target;
    setCardioInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleOcrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      setOcrProgress(0);
      setError('');
      
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Simple parsing logic for medical parameters
      const extractedData = {};
      const lines = text.split('\n');
      
      const patterns = {
        hemoglobin: /hemoglobin|hemo|hgb/i,
        mch: /mch\b/i,
        mchc: /mchc/i,
        mcv: /mcv/i,
        age: /age/i,
        bp: /bp|blood pressure/i,
        sg: /sg|specific gravity/i,
        al: /albumin|alb/i,
        su: /sugar/i,
        bgr: /glucose|bgr|sugar/i,
        bu: /urea/i,
        sc: /creatinine/i,
        sod: /sodium/i,
        pot: /potassium/i,
        hemo: /hemo/i,
        pcv: /pcv/i,
        wc: /wbc|white cell/i,
        rc: /rbc|red cell/i,
        tb: /total bilirubin/i,
        db: /direct bilirubin/i,
        alp: /alkaline phosphatase|alp/i,
        sgpt: /sgpt|alt/i,
        sgot: /sgot|ast/i,
        tp: /total protein/i,
        alb: /albumin/i,
        hr: /heart rate|hr/i,
        o2sat: /o2 sat|spo2/i,
        temp: /temp/i,
        sbp: /sbp|systolic/i,
        dbp: /dbp|diastolic/i,
        resp: /resp|respiration/i,
        platelets: /platelets/i,
        totChol: /total cholesterol|chol/i,
        bmi: /bmi/i
      };

      lines.forEach(line => {
        Object.keys(patterns).forEach(key => {
          if (patterns[key].test(line)) {
            const matches = line.match(/(\d+\.?\d*)/);
            if (matches && !extractedData[key]) {
              extractedData[key] = matches[1];
            }
          }
        });
      });

      // Map extracted data to current tab inputs
      if (activeTab === 0) { // Anemia
        setAnemiaInputs(prev => ({
          ...prev,
          hemoglobin: extractedData.hemoglobin || prev.hemoglobin,
          mch: extractedData.mch || prev.mch,
          mchc: extractedData.mchc || prev.mchc,
          mcv: extractedData.mcv || prev.mcv
        }));
      } else if (activeTab === 1) { // Kidney
        setKidneyInputs(prev => {
          const updated = { ...prev };
          Object.keys(prev).forEach(key => {
            if (extractedData[key]) updated[key] = extractedData[key];
          });
          return updated;
        });
      } else if (activeTab === 2) { // Liver
        setLiverInputs(prev => {
          const updated = { ...prev };
          Object.keys(prev).forEach(key => {
            if (extractedData[key]) updated[key] = extractedData[key];
          });
          return updated;
        });
      } else if (activeTab === 3) { // Sepsis
        setSepsisInputs(prev => {
          const updated = { ...prev };
          Object.keys(prev).forEach(key => {
            if (extractedData[key]) updated[key] = extractedData[key];
          });
          return updated;
        });
      } else if (activeTab === 4) { // Cardio
        setCardioInputs(prev => {
          const updated = { ...prev };
          Object.keys(prev).forEach(key => {
            if (extractedData[key]) updated[key] = extractedData[key];
          });
          return updated;
        });
      }

      if (Object.keys(extractedData).length > 0) {
        setError('Success: Parameters extracted from report!');
      } else {
        setError('Warning: Could not extract specific parameters. Please ensure report is clear.');
      }

    } catch (err) {
      console.error('OCR Error:', err);
      setError('OCR processing failed. Please enter values manually.');
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
  };

  const handlePredictAnemia = async () => {
    try {
      setLoading(true);
      setError('');
      
      const parameters = [
        { name: 'Hemoglobin', value: parseFloat(anemiaInputs.hemoglobin) },
        { name: 'MCH', value: parseFloat(anemiaInputs.mch) },
        { name: 'MCHC', value: parseFloat(anemiaInputs.mchc) },
        { name: 'MCV', value: parseFloat(anemiaInputs.mcv) }
      ];

      const { data } = await api.post('/disease-prediction/predict/manual', {
        parameters,
        gender: anemiaInputs.gender
      });

      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.message || 'Anemia prediction failed. Ensure the Python ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictKidney = async () => {
    try {
      setLoading(true);
      setError('');
      
      const parameters = Object.keys(kidneyInputs).map(key => ({
        name: key.toUpperCase(),
        value: parseFloat(kidneyInputs[key])
      }));

      const { data } = await api.post('/disease-prediction/predict/kidney/manual', {
        parameters,
        age: parseInt(kidneyInputs.age)
      });

      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.message || 'Kidney prediction failed. Ensure the Python ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictLiver = async () => {
    try {
      setLoading(true);
      setError('');
      
      const parameters = Object.keys(liverInputs).filter(k => k !== 'gender' && k !== 'age').map(key => ({
        name: key.toUpperCase(),
        value: parseFloat(liverInputs[key])
      }));

      const { data } = await api.post('/disease-prediction/predict/liver/manual', {
        parameters,
        age: parseInt(liverInputs.age),
        gender: liverInputs.gender
      });

      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.message || 'Liver prediction failed. Ensure the Python ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictSepsis = async () => {
    try {
      setLoading(true);
      setError('');
      
      const parameters = Object.keys(sepsisInputs).filter(k => k !== 'gender' && k !== 'age').map(key => ({
        name: key.toUpperCase(),
        value: parseFloat(sepsisInputs[key])
      }));

      const { data } = await api.post('/disease-prediction/predict/sepsis/manual', {
        parameters,
        age: parseInt(sepsisInputs.age),
        gender: sepsisInputs.gender
      });

      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.message || 'Sepsis prediction failed. Ensure the Python ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictCardio = async () => {
    try {
      setLoading(true);
      setError('');
      
      const parameters = Object.keys(cardioInputs).map(key => ({
        name: key.toUpperCase(),
        value: parseFloat(cardioInputs[key])
      }));

      const { data } = await api.post('/disease-prediction/predict/cardio/manual', {
        parameters,
        age: parseInt(cardioInputs.age),
        gender: cardioInputs.male === '1' ? 'Male' : 'Female'
      });

      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.message || 'Cardiovascular prediction failed. Ensure the Python ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'error';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const handleDownloadReport = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const tabNames = [
      'Anemia Risk Analysis', 
      'Chronic Kidney Disease Analysis', 
      'Liver Disease Risk Analysis', 
      'Sepsis Risk Analysis', 
      'Cardiovascular Risk Analysis'
    ];

    // Header
    doc.setFillColor(107, 70, 193); // Primary color
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Holy Cross Hospital', 15, 20);
    doc.setFontSize(12);
    doc.text('Disease Risk Prediction Report', 15, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 20);

    // Patient Info (Generic since this is a manual tool)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('1. Analysis Summary', 15, 55);
    doc.setFontSize(12);
    doc.text(`Diagnosis Category: ${tabNames[activeTab]}`, 15, 65);
    doc.text(`Risk Level: ${result.risk_level.toUpperCase()}`, 15, 75);
    doc.text(`Confidence: ${(result.confidence * 100).toFixed(0)}%`, 15, 85);

    // 2. Input Parameters Table
    doc.setFontSize(16);
    doc.text('2. Clinical Findings (Input Parameters)', 15, 100);
    
    let currentInputs = {};
    if (activeTab === 0) currentInputs = anemiaInputs;
    else if (activeTab === 1) currentInputs = kidneyInputs;
    else if (activeTab === 2) currentInputs = liverInputs;
    else if (activeTab === 3) currentInputs = sepsisInputs;
    else if (activeTab === 4) currentInputs = cardioInputs;

    const inputTableData = Object.entries(currentInputs).map(([key, value]) => [
      key.toUpperCase().replace('_', ' '), 
      value,
      REFERENCE_RANGES[key] || 'N/A'
    ]);

    autoTable(doc, {
      startY: 105,
      head: [['Parameter', 'Recorded Value', 'Reference Range']],
      body: inputTableData,
      headStyles: { fillColor: [74, 85, 104] },
      theme: 'grid',
      margin: { left: 15, right: 15 }
    });

    // 3. Detailed Results
    const nextY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.text('3. Detailed Prediction Findings', 15, nextY);
    doc.setFontSize(11);
    const splitFinding = doc.splitTextToSize(result.prediction, pageWidth - 30);
    doc.text(splitFinding, 15, nextY + 10);

    // 4. Recommendations Table
    const recommendationsY = nextY + 10 + (splitFinding.length * 7) + 5;
    doc.setFontSize(16);
    doc.text('4. Medical Recommendations', 15, recommendationsY);
    
    const tableData = result.recommendations.map((rec, index) => [index + 1, rec]);
    autoTable(doc, {
      startY: recommendationsY + 5,
      head: [['#', 'Guideline / Action Plan']],
      body: tableData,
      headStyles: { fillColor: [107, 70, 193] },
      theme: 'striped',
      margin: { left: 15, right: 15 }
    });

    // Footer
    const finalY = doc.lastAutoTable?.finalY || 250;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Note: This is an AI-generated report for diagnostic research purposes. Please consult with a physician.', 15, finalY + 20);
    doc.text('Generated by MediTrack ML Engine', 15, finalY + 30);

    doc.save(`Detailed_Disease_Risk_Report_${new Date().getTime()}.pdf`);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200, margin: '0 auto' }}>
      <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <PsychologyIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Disease Prediction Center</Typography>
              <Typography variant="subtitle1" color="textSecondary">ML-Powered Diagnostic Research Module</Typography>
            </Box>
          </Stack>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          indicatorColor="primary" 
          textColor="primary" 
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<OpacityIcon />} label="Anemia Risk" iconPosition="start" />
          <Tab icon={<HospitalIcon />} label="Chronic Kidney Disease (CKD)" iconPosition="start" />
          <Tab icon={<ScienceIcon />} label="Liver Disease Risk" iconPosition="start" />
          <Tab icon={<WarningIcon />} label="Sepsis Risk" iconPosition="start" />
          <Tab icon={<HeartIcon />} label="Cardiovascular Risk" iconPosition="start" />
          <Tab icon={<MoodIcon />} label="Depression Risk" iconPosition="start" />
        </Tabs>

        {/* OCR Hidden Input */}
        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleOcrUpload}
          accept="image/*"
        />

        <Box sx={{ p: 4 }}>
          {ocrLoading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Scanning report... {ocrProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={ocrProgress} />
            </Box>
          )}

          {activeTab === 5 ? (
            <DepressionRiskPrediction />
          ) : (
            <Grid container spacing={4}>
              {/* Input Side */}
              <Grid item xs={12} md={activeTab === 0 ? 5 : (activeTab === 1 || activeTab === 4 ? 7 : 6)}>
                {error && (
                  <Alert 
                    severity={error.includes('Success') ? 'success' : (error.includes('Warning') ? 'warning' : 'error')} 
                    sx={{ mb: 3 }} 
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                )}
                {activeTab === 0 ? (
                  // ANEMIA INPUTS
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Blood Parameters (Anemia)</Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        disabled={ocrLoading}
                      >
                        Scan Report
                      </Button>
                    </Box>
                    <TextField label="Hemoglobin" name="hemoglobin" type="number" fullWidth value={anemiaInputs.hemoglobin} onChange={handleAnemiaChange} size="small" helperText="Standard range: 12-17 g/dL" />
                    <TextField label="MCH" name="mch" type="number" fullWidth value={anemiaInputs.mch} onChange={handleAnemiaChange} size="small" />
                    <TextField label="MCHC" name="mchc" type="number" fullWidth value={anemiaInputs.mchc} onChange={handleAnemiaChange} size="small" />
                    <TextField label="MCV" name="mcv" type="number" fullWidth value={anemiaInputs.mcv} onChange={handleAnemiaChange} size="small" />
                    <TextField label="Gender" name="gender" select fullWidth value={anemiaInputs.gender} onChange={handleAnemiaChange} SelectProps={{ native: true }} size="small">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </TextField>
                    <Button variant="contained" color="error" size="large" onClick={handlePredictAnemia} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}>
                      {loading ? 'Analyzing...' : 'Predict Anemia'}
                    </Button>
                  </Stack>
                ) : activeTab === 1 ? (
                  // KIDNEY INPUTS
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Clinical Bio-markers (CKD)</Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        disabled={ocrLoading}
                      >
                        Scan Report
                      </Button>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}><TextField label="Age" name="age" type="number" fullWidth value={kidneyInputs.age} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="BP" name="bp" type="number" fullWidth value={kidneyInputs.bp} onChange={handleKidneyChange} size="small" InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="S.G." name="sg" type="number" fullWidth value={kidneyInputs.sg} onChange={handleKidneyChange} size="small" inputProps={{ step: "0.005" }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Albumin" name="al" type="number" fullWidth value={kidneyInputs.al} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Sugar" name="su" type="number" fullWidth value={kidneyInputs.su} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Hemo" name="hemo" type="number" fullWidth value={kidneyInputs.hemo} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Glucose" name="bgr" type="number" fullWidth value={kidneyInputs.bgr} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Urea" name="bu" type="number" fullWidth value={kidneyInputs.bu} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Creatinine" name="sc" type="number" fullWidth value={kidneyInputs.sc} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="Sodium" name="sod" type="number" fullWidth value={kidneyInputs.sod} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="Potassium" name="pot" type="number" fullWidth value={kidneyInputs.pot} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="PCV" name="pcv" type="number" fullWidth value={kidneyInputs.pcv} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="WBC" name="wc" type="number" fullWidth value={kidneyInputs.wc} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="RBC" name="rc" type="number" fullWidth value={kidneyInputs.rc} onChange={handleKidneyChange} size="small" /></Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="primary" fullWidth size="large" onClick={handlePredictKidney} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}>
                          {loading ? 'Analyzing Kidneys...' : 'Analyze Kidney Risk'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                ) : activeTab === 2 ? (
                  // LIVER INPUTS
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Liver Function Parameters (LFT)</Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        disabled={ocrLoading}
                      >
                        Scan Report
                      </Button>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><TextField label="Age" name="age" type="number" fullWidth value={liverInputs.age} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Gender" name="gender" select fullWidth value={liverInputs.gender} onChange={handleLiverChange} SelectProps={{ native: true }} size="small">
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}><TextField label="Total Bilirubin" name="tb" type="number" fullWidth value={liverInputs.tb} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="Direct Bilirubin" name="db" type="number" fullWidth value={liverInputs.db} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="Alk. Phosphatase" name="alp" type="number" fullWidth value={liverInputs.alp} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="SGPT (ALT)" name="sgpt" type="number" fullWidth value={liverInputs.sgpt} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="SGOT (AST)" name="sgot" type="number" fullWidth value={liverInputs.sgot} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="Total Proteins" name="tp" type="number" fullWidth value={liverInputs.tp} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="Albumin" name="alb" type="number" fullWidth value={liverInputs.alb} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12} sm={6}><TextField label="A/G Ratio" name="ag_ratio" type="number" fullWidth value={liverInputs.ag_ratio} onChange={handleLiverChange} size="small" /></Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="warning" sx={{ color: 'white' }} fullWidth size="large" onClick={handlePredictLiver} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}>
                          {loading ? 'Analyzing Liver...' : 'Analyze Liver Risk'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                ) : activeTab === 3 ? (
                  // SEPSIS INPUTS
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Vital Signs & Lab Values (Sepsis)</Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        disabled={ocrLoading}
                      >
                        Scan Report
                      </Button>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}><TextField label="Age" name="age" type="number" fullWidth value={sepsisInputs.age} onChange={handleSepsisChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Gender" name="gender" select fullWidth value={sepsisInputs.gender} onChange={handleSepsisChange} SelectProps={{ native: true }} size="small">
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}><TextField label="HR" name="hr" type="number" fullWidth value={sepsisInputs.hr} onChange={handleSepsisChange} size="small" helperText="Heart Rate" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="O2Sat" name="o2sat" type="number" fullWidth value={sepsisInputs.o2sat} onChange={handleSepsisChange} size="small" helperText="Oxygen Saturation" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Temp" name="temp" type="number" fullWidth value={sepsisInputs.temp} onChange={handleSepsisChange} size="small" helperText="Temperature (°C)" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="SBP" name="sbp" type="number" fullWidth value={sepsisInputs.sbp} onChange={handleSepsisChange} size="small" helperText="Systolic BP" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="MAP" name="map" type="number" fullWidth value={sepsisInputs.map} onChange={handleSepsisChange} size="small" helperText="Mean Arterial Pressure" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="DBP" name="dbp" type="number" fullWidth value={sepsisInputs.dbp} onChange={handleSepsisChange} size="small" helperText="Diastolic BP" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Resp" name="resp" type="number" fullWidth value={sepsisInputs.resp} onChange={handleSepsisChange} size="small" helperText="Respiration Rate" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Glucose" name="glucose" type="number" fullWidth value={sepsisInputs.glucose} onChange={handleSepsisChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="WBC" name="wbc" type="number" fullWidth value={sepsisInputs.wbc} onChange={handleSepsisChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Platelets" name="platelets" type="number" fullWidth value={sepsisInputs.platelets} onChange={handleSepsisChange} size="small" /></Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="error" fullWidth size="large" onClick={handlePredictSepsis} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <WarningIcon />}>
                          {loading ? 'Analyzing Sepsis...' : 'Analyze Sepsis Risk'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  // CARDIOVASCULAR INPUTS
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Cardiovascular Risk Parameters (Framingham)</Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current.click()}
                        disabled={ocrLoading}
                      >
                        Scan Report
                      </Button>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}><TextField label="Age" name="age" type="number" fullWidth value={cardioInputs.age} onChange={handleCardioChange} size="small" /></Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField label="Gender" name="male" select fullWidth value={cardioInputs.male} onChange={handleCardioChange} SelectProps={{ native: true }} size="small">
                          <option value="1">Male</option>
                          <option value="0">Female</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField label="Smoker" name="currentSmoker" select fullWidth value={cardioInputs.currentSmoker} onChange={handleCardioChange} SelectProps={{ native: true }} size="small">
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={3}><TextField label="Cigs/Day" name="cigsPerDay" type="number" fullWidth value={cardioInputs.cigsPerDay} onChange={handleCardioChange} size="small" disabled={cardioInputs.currentSmoker === '0'} /></Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <TextField label="BP Meds" name="bpMeds" select fullWidth value={cardioInputs.bpMeds} onChange={handleCardioChange} SelectProps={{ native: true }} size="small">
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Prev. Stroke" name="prevalentStroke" select fullWidth value={cardioInputs.prevalentStroke} onChange={handleCardioChange} SelectProps={{ native: true }} size="small">
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Hypertension" name="prevalentHyp" select fullWidth value={cardioInputs.prevalentHyp} onChange={handleCardioChange} SelectProps={{ native: true }} size="small">
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </TextField>
                      </Grid>

                      <Grid item xs={12} sm={3}><TextField label="Total Chol" name="totChol" type="number" fullWidth value={cardioInputs.totChol} onChange={handleCardioChange} size="small" /></Grid>
                      <Grid item xs={12} sm={3}><TextField label="Sys BP" name="sysBP" type="number" fullWidth value={cardioInputs.sysBP} onChange={handleCardioChange} size="small" /></Grid>
                      <Grid item xs={12} sm={3}><TextField label="Dia BP" name="diaBP" type="number" fullWidth value={cardioInputs.diaBP} onChange={handleCardioChange} size="small" /></Grid>
                      <Grid item xs={12} sm={3}><TextField label="Glucose" name="glucose" type="number" fullWidth value={cardioInputs.glucose} onChange={handleCardioChange} size="small" /></Grid>

                      <Grid item xs={12} sm={4}><TextField label="BMI" name="bmi" type="number" fullWidth value={cardioInputs.bmi} onChange={handleCardioChange} size="small" inputProps={{ step: "0.1" }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField label="Heart Rate" name="heartRate" type="number" fullWidth value={cardioInputs.heartRate} onChange={handleCardioChange} size="small" /></Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label="Diabetes" name="diabetes" select fullWidth value={cardioInputs.diabetes} onChange={handleCardioChange} SelectProps={{ native: true }} size="small">
                          <option value="1">Yes</option>
                          <option value="0">No</option>
                        </TextField>
                      </Grid>

                      <Grid item xs={12}>
                        <Button variant="contained" color="error" fullWidth size="large" onClick={handlePredictCardio} disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <HeartIcon />}>
                          {loading ? 'Analyzing Heart...' : 'Analyze Cardiovascular Risk'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Grid>

              {/* Results Side */}
              <Grid item xs={12} md={activeTab === 0 ? 7 : (activeTab === 1 || activeTab === 4 ? 5 : 6)}>
                {!result && !loading && (
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#f8f9fa', borderRadius: 2, p: 4, textAlign: 'center', border: '2px dashed #ccc' }}>
                    <ArrowForwardIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                    <Typography color="textSecondary">Enter patient parameters to see risk analysis</Typography>
                  </Box>
                )}

                {result && (
                  <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderTop: `6px solid ${result.risk_level === 'High' ? '#d32f2f' : '#2e7d32'}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>ML Risk Assessment</Typography>
                        <Chip label={`${result.risk_level.toUpperCase()}`} color={getRiskColor(result.risk_level)} sx={{ fontWeight: 700 }} />
                      </Box>

                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>Prediction Confidence</Typography>
                        <Typography variant="h2" sx={{ fontWeight: 800, color: result.risk_level === 'High' ? '#d32f2f' : '#2e7d32' }}>
                          {(result.confidence * 100).toFixed(0)}%
                        </Typography>
                      </Box>

                      <Divider sx={{ mb: 3 }} />

                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Primary Finding</Typography>
                      <Typography variant="body1" sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
                        {result.prediction}
                      </Typography>

                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Medical Recommendations</Typography>
                      <List dense>
                        {result.recommendations.map((rec, i) => (
                          <ListItem key={i}>
                            <ListItemIcon><CheckCircleIcon color="success" fontSize="small" /></ListItemIcon>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>

                      <Box sx={{ mt: 3 }}>
                          <Button 
                            variant="outlined" 
                            fullWidth 
                            onClick={handleDownloadReport}
                            startIcon={<UploadIcon sx={{ transform: 'rotate(180deg)' }} />}
                          >
                            Download Detailed Findings Report (PDF)
                          </Button>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
