import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, CircularProgress, Alert, 
  Card, CardContent, Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
  Stack, InputAdornment
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  ArrowForward as ArrowForwardIcon,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import api from '../api/client';

export default function KidneyDiseasePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [inputs, setInputs] = useState({
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError('');
      
      const parameters = Object.keys(inputs).map(key => ({
        name: key.toUpperCase(),
        value: parseFloat(inputs[key])
      }));

      const { data } = await api.post('/disease-prediction/predict/kidney/manual', {
        parameters,
        age: parseInt(inputs.age)
      });

      setResult(data.prediction);
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed. Ensure the Python ML service is running.');
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
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, borderTop: '4px solid #1976d2' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <HospitalIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>CKD Risk Prediction</Typography>
            <Typography variant="subtitle1" color="textSecondary">Chronic Kidney Disease Screening Module</Typography>
          </Box>
        </Stack>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This research tool analyzes clinical and biochemical parameters to assess the risk of Chronic Kidney Disease (CKD).
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Clinical Parameters</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="Age" name="age" type="number" fullWidth value={inputs.age} onChange={handleInputChange} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Blood Pressure" name="bp" type="number" fullWidth value={inputs.bp} onChange={handleInputChange} size="small" InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Specific Gravity" name="sg" type="number" fullWidth value={inputs.sg} onChange={handleInputChange} size="small" inputProps={{ step: "0.005" }} />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField label="Albumin" name="al" type="number" fullWidth value={inputs.al} onChange={handleInputChange} size="small" helperText="0 to 5" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Sugar" name="su" type="number" fullWidth value={inputs.su} onChange={handleInputChange} size="small" helperText="0 to 5" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Hemoglobin" name="hemo" type="number" fullWidth value={inputs.hemo} onChange={handleInputChange} size="small" InputProps={{ endAdornment: <InputAdornment position="end">g/dL</InputAdornment> }} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField label="Blood Glucose" name="bgr" type="number" fullWidth value={inputs.bgr} onChange={handleInputChange} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Blood Urea" name="bu" type="number" fullWidth value={inputs.bu} onChange={handleInputChange} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Serum Creatinine" name="sc" type="number" fullWidth value={inputs.sc} onChange={handleInputChange} size="small" />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField label="Sodium" name="sod" type="number" fullWidth value={inputs.sod} onChange={handleInputChange} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Potassium" name="pot" type="number" fullWidth value={inputs.pot} onChange={handleInputChange} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Packed Cell Vol" name="pcv" type="number" fullWidth value={inputs.pcv} onChange={handleInputChange} size="small" />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="White Blood Cell Count" name="wc" type="number" fullWidth value={inputs.wc} onChange={handleInputChange} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Red Blood Cell Count" name="rc" type="number" fullWidth value={inputs.rc} onChange={handleInputChange} size="small" />
              </Grid>

              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  color="primary"
                  size="large" 
                  fullWidth
                  onClick={handlePredict} 
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                >
                  {loading ? 'Analyzing Bio-markers...' : 'Analyze Kidney Risk'}
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={5}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {!result && !loading && (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 2, p: 4, textAlign: 'center', border: '2px dashed #ccc' }}>
                <ScienceIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                <Typography color="textSecondary">Complete the clinical profile to generate risk assessment</Typography>
              </Box>
            )}

            {result && (
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderLeft: `8px solid ${result.risk_level === 'High' ? '#d32f2f' : '#2e7d32'}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Risk Assessment</Typography>
                    <Chip 
                      label={`${result.risk_level.toUpperCase()}`} 
                      color={getRiskColor(result.risk_level)}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Prediction Confidence</Typography>
                    <Typography variant="h2" sx={{ fontWeight: 800, color: result.risk_level === 'High' ? '#d32f2f' : '#2e7d32' }}>
                      {(result.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Finding</Typography>
                  <Typography variant="body1" sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    {result.prediction}
                  </Typography>

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Recommended Actions</Typography>
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
      </Paper>
    </Box>
  );
}
