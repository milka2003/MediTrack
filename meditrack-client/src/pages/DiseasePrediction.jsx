import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, CircularProgress, Alert, 
  Card, CardContent, Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
  Stack, Tabs, Tab, InputAdornment
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  ArrowForward as ArrowForwardIcon,
  LocalHospital as HospitalIcon,
  Opacity as OpacityIcon
} from '@mui/icons-material';
import api from '../api/client';

export default function DiseasePrediction() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
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

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'error';
      case 'low': return 'success';
      default: return 'default';
    }
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
        </Tabs>

        <Box sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Input Side */}
            <Grid item xs={12} md={activeTab === 0 ? 5 : 7}>
              {activeTab === 0 ? (
                // ANEMIA INPUTS
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Blood Parameters (Anemia)</Typography>
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
              ) : (
                // KIDNEY INPUTS
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Clinical Bio-markers (CKD)</Typography>
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
              )}
            </Grid>

            {/* Results Side */}
            <Grid item xs={12} md={activeTab === 0 ? 7 : 5}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
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
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
