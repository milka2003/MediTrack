import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid, CircularProgress, Alert, 
  Card, CardContent, Chip, List, ListItem, ListItemIcon, ListItemText, Divider,
  Stack
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import api from '../api/client';

export default function ResearchDiseasePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [inputs, setInputs] = useState({
    hemoglobin: '11.5',
    mch: '22.7',
    mchc: '29.1',
    mcv: '83.7',
    gender: 'Male'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setError('');
      
      const parameters = [
        { name: 'Hemoglobin', value: parseFloat(inputs.hemoglobin) },
        { name: 'MCH', value: parseFloat(inputs.mch) },
        { name: 'MCHC', value: parseFloat(inputs.mchc) },
        { name: 'MCV', value: parseFloat(inputs.mcv) }
      ];

      const { data } = await api.post('/disease-prediction/predict/manual', {
        parameters,
        gender: inputs.gender
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
    <Box sx={{ p: 4, maxWidth: 1000, margin: '0 auto' }}>
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2, borderTop: '4px solid #d32f2f' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <PsychologyIcon color="error" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Anemia Risk Prediction</Typography>
            <Typography variant="subtitle1" color="textSecondary">Research Module: Hematological Analysis</Typography>
          </Box>
        </Stack>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This model uses hematological indices (Hemoglobin, MCH, MCHC, MCV) to predict anemia risk based on your research dataset.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Input Blood Parameters</Typography>
            <Stack spacing={2}>
              <TextField 
                label="Hemoglobin" 
                name="hemoglobin" 
                type="number" 
                fullWidth 
                value={inputs.hemoglobin} 
                onChange={handleInputChange} 
                size="small"
                helperText="Standard range: 12-17 g/dL"
              />
              <TextField 
                label="MCH (Mean Corpuscular Hemoglobin)" 
                name="mch" 
                type="number" 
                fullWidth 
                value={inputs.mch} 
                onChange={handleInputChange} 
                size="small"
              />
              <TextField 
                label="MCHC (Mean Corpuscular Hb Conc.)" 
                name="mchc" 
                type="number" 
                fullWidth 
                value={inputs.mchc} 
                onChange={handleInputChange} 
                size="small"
              />
              <TextField 
                label="MCV (Mean Corpuscular Volume)" 
                name="mcv" 
                type="number" 
                fullWidth 
                value={inputs.mcv} 
                onChange={handleInputChange} 
                size="small"
              />
              <TextField 
                label="Gender" 
                name="gender" 
                select 
                fullWidth 
                value={inputs.gender} 
                onChange={handleInputChange} 
                SelectProps={{ native: true }}
                size="small"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </TextField>
              <Button 
                variant="contained" 
                color="error"
                size="large" 
                onClick={handlePredict} 
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <ScienceIcon />}
              >
                {loading ? 'Analyzing Data...' : 'Run Prediction'}
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {!result && !loading && (
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 2, p: 4, textAlign: 'center' }}>
                <ArrowForwardIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                <Typography color="textSecondary">Provide hematological data to analyze results</Typography>
              </Box>
            )}

            {result && (
              <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Anemia Analysis</Typography>
                    <Chip 
                      label={`${result.risk_level.toUpperCase()}`} 
                      color={getRiskColor(result.risk_level)}
                      sx={{ fontWeight: 700, fontSize: '0.9rem' }}
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
                  <Typography variant="body1" sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, borderLeft: '4px solid #d32f2f' }}>
                    {result.prediction}
                  </Typography>

                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Medical Guidance</Typography>
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
