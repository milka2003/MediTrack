// src/pages/MLDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, CircularProgress, Alert, AppBar, Toolbar, Drawer, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Stack, Chip, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Dashboard as DashboardIcon,
  Psychology as PsychologyIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function MLDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [training, setTraining] = useState(false);
  
  // Live prediction state
  const [liveInputs, setLiveInputs] = useState({ hemoglobin: '', wbc: '', glucose: '' });
  const [selectedModel, setSelectedModel] = useState('decision_tree');
  const [predictLoading, setPredictLoading] = useState(false);
  const [liveResult, setLiveResult] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/ml/metrics');
      setMetrics(data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModels = async () => {
    try {
      setTraining(true);
      const { data } = await api.post('/ml/train');
      setMessage(`Training completed! Used ${data.samplesUsed} samples`);
      setTimeout(() => loadMetrics(), 500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLiveInputs(prev => ({ ...prev, [name]: value }));
  };

  const handlePredict = async () => {
    try {
      // Validate inputs
      if (!liveInputs.hemoglobin || !liveInputs.wbc || !liveInputs.glucose) {
        setMessage('Please enter all three lab values');
        return;
      }

      setPredictLoading(true);
      const { data } = await api.post('/ml/predict-live', {
        hemoglobin: parseFloat(liveInputs.hemoglobin),
        wbc: parseFloat(liveInputs.wbc),
        glucose: parseFloat(liveInputs.glucose),
        model: selectedModel
      });

      setLiveResult(data.data);
      setMessage('Prediction completed!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Prediction failed');
      setLiveResult(null);
    } finally {
      setPredictLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      window.location.href = '/login';
    }
  };

  const DRAWER_WIDTH = 260;

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/lab-dashboard' },
    { label: 'ML Models', icon: <PsychologyIcon />, path: '/ml-dashboard' }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Prepare data for charts
  const chartData = metrics?.models || [];
  
  // Transform for radar chart - each metric becomes a data point
  const radarData = [
    { name: 'Accuracy', ...Object.fromEntries(chartData.map(m => [m.name, m.accuracy])) },
    { name: 'Precision', ...Object.fromEntries(chartData.map(m => [m.name, m.precision])) },
    { name: 'Recall', ...Object.fromEntries(chartData.map(m => [m.name, m.recall])) },
    { name: 'F1-Score', ...Object.fromEntries(chartData.map(m => [m.name, m.f1Score])) }
  ];

  const modelComparison = chartData.map(m => ({
    name: m.name.replace(/([A-Z])/g, ' $1').toUpperCase(),
    Accuracy: m.accuracy,
    Precision: m.precision,
    Recall: m.recall,
    'F1-Score': m.f1Score
  })) || [];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <PsychologyIcon sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div">
            ML Models & Analytics
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            mt: '64px',
            height: 'calc(100% - 64px)'
          }
        }}
      >
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{ '&:hover': { backgroundColor: '#f0f0f0' } }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{ '&:hover': { backgroundColor: '#ffebee' } }}
            >
              <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          mt: '64px',
          backgroundColor: '#fafafa',
          overflowY: 'auto'
        }}
      >
        {message && (
          <Alert severity={message.includes('failed') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {/* What We're Predicting - Explanation Card */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Model Purpose
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
            These ML models predict whether a patient's lab results are normal or abnormal based on three key laboratory values: Hemoglobin, White Blood Cell (WBC) count, and Glucose level. The system helps clinical staff quickly identify cases requiring medical attention.
          </Typography>
        </Paper>

        {/* Training Status */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" gutterBottom>
                Model Training Status
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  label={metrics?.trained ? '✓ Models Trained' : 'Not Trained'}
                  color={metrics?.trained ? 'success' : 'warning'}
                  variant="outlined"
                />
                {metrics?.trainingDate && (
                  <Typography variant="body2" color="textSecondary">
                    Last trained: {new Date(metrics.trainingDate).toLocaleString()}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleTrainModels}
              disabled={training}
            >
              {training ? <CircularProgress size={24} sx={{ mr: 1 }} /> : ''}
              {training ? 'Training...' : 'Train Models'}
            </Button>
          </Stack>
        </Paper>

        {/* Live Prediction Section */}
        {metrics?.trained && (
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f0f8ff', borderLeft: '4px solid #1976d2' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Live Prediction - Test Model
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'textSecondary' }}>
              Enter patient lab values to get real-time predictions from trained models
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  label="Hemoglobin (g/dL)"
                  name="hemoglobin"
                  type="number"
                  value={liveInputs.hemoglobin}
                  onChange={handleInputChange}
                  placeholder="e.g., 13.5"
                  inputProps={{ step: 0.1 }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  label="WBC (10³/μL)"
                  name="wbc"
                  type="number"
                  value={liveInputs.wbc}
                  onChange={handleInputChange}
                  placeholder="e.g., 7.2"
                  inputProps={{ step: 0.1 }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  label="Glucose (mg/dL)"
                  name="glucose"
                  type="number"
                  value={liveInputs.glucose}
                  onChange={handleInputChange}
                  placeholder="e.g., 95"
                  inputProps={{ step: 0.1 }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    label="Model"
                  >
                    <MenuItem value="decision_tree">Decision Tree</MenuItem>
                    <MenuItem value="knn">KNN</MenuItem>
                    <MenuItem value="naive_bayes">Naive Bayes</MenuItem>
                    <MenuItem value="svm">SVM</MenuItem>
                    <MenuItem value="neural_network">Neural Network</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handlePredict}
                  disabled={predictLoading || !metrics?.trained}
                  sx={{ height: '40px' }}
                >
                  {predictLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : ''}
                  Predict
                </Button>
              </Grid>
            </Grid>

            {/* Prediction Result */}
            {liveResult && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Prediction Result
                </Typography>
                <Grid container spacing={2}>
                  {liveResult.predictions ? (
                    // Show all models - each in its own card
                    Object.entries(liveResult.predictions).map(([modelKey, pred]) => (
                      <Grid item xs={12} sm={6} md={4} key={modelKey}>
                        <Card sx={{ backgroundColor: pred.prediction === 1 ? '#ffebee' : '#e8f5e9', height: '100%' }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                              {modelKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Chip
                                label={pred.prediction === 1 ? 'ABNORMAL' : 'NORMAL'}
                                color={pred.prediction === 1 ? 'error' : 'success'}
                                size="medium"
                                sx={{ fontWeight: 600 }}
                              />
                            </Box>
                            {pred.confidence && (
                              <Typography variant="body2" color="textSecondary">
                                Confidence: <strong>{(pred.confidence * 100).toFixed(1)}%</strong>
                              </Typography>
                            )}
                            {pred.error && (
                              <Typography variant="body2" color="error">
                                Error: {pred.error}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  ) : liveResult.prediction ? (
                    // Show specific model result - single card
                    <Grid item xs={12} sm={8} md={6} key="selected-model">
                      <Card sx={{ backgroundColor: liveResult.prediction.prediction === 1 ? '#ffebee' : '#e8f5e9' }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#333' }}>
                            {selectedModel.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} - Selected Model
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Chip
                              label={liveResult.prediction.prediction === 1 ? 'ABNORMAL' : 'NORMAL'}
                              color={liveResult.prediction.prediction === 1 ? 'error' : 'success'}
                              size="medium"
                              sx={{ fontWeight: 600, fontSize: '1.1rem', py: 3, px: 2 }}
                            />
                          </Box>
                          {liveResult.prediction.confidence && (
                            <Typography variant="body2" color="textSecondary">
                              Confidence: <strong>{(liveResult.prediction.confidence * 100).toFixed(1)}%</strong>
                            </Typography>
                          )}
                          {liveResult.prediction.error && (
                            <Typography variant="body2" color="error">
                              Error: {liveResult.prediction.error}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ) : null}
                </Grid>
              </Box>
            )}
          </Paper>
        )}

        {/* Models Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Models Trained
                </Typography>
                <Typography variant="h4">
                  {chartData.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Best F1-Score
                </Typography>
                <Typography variant="h4">
                  {chartData.length > 0 ? Math.max(...chartData.map(m => m.f1Score || 0)).toFixed(2) : '0'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Accuracy
                </Typography>
                <Typography variant="h4">
                  {chartData.length > 0 ? (chartData.reduce((sum, m) => sum + m.accuracy, 0) / chartData.length).toFixed(2) : '0'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Average Recall
                </Typography>
                <Typography variant="h4">
                  {chartData.length > 0 ? (chartData.reduce((sum, m) => sum + m.recall, 0) / chartData.length).toFixed(2) : '0'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Model Comparison Chart */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Model Performance Comparison
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Accuracy" fill="#8884d8" />
              <Bar dataKey="Precision" fill="#82ca9d" />
              <Bar dataKey="Recall" fill="#ffc658" />
              <Bar dataKey="F1-Score" fill="#ff7c7c" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        {/* Radar Chart - Model Profiles */}
        {chartData.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Model Performance Profile
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {chartData.map((model, index) => (
                  <Radar
                    key={model.name}
                    name={model.name}
                    dataKey={model.name}
                    stroke={['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'][index % 5]}
                    fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'][index % 5]}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* Detailed Metrics Table */}
        <Paper sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Detailed Model Metrics
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Model</strong></TableCell>
                <TableCell align="center"><strong>Accuracy</strong></TableCell>
                <TableCell align="center"><strong>Precision</strong></TableCell>
                <TableCell align="center"><strong>Recall</strong></TableCell>
                <TableCell align="center"><strong>F1-Score</strong></TableCell>
                <TableCell align="center"><strong>True Positives</strong></TableCell>
                <TableCell align="center"><strong>False Positives</strong></TableCell>
                <TableCell align="center"><strong>True Negatives</strong></TableCell>
                <TableCell align="center"><strong>False Negatives</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chartData.map((model, idx) => (
                <TableRow key={idx} hover>
                  <TableCell>
                    <strong>{model.name.replace(/([A-Z])/g, ' $1').toUpperCase()}</strong>
                  </TableCell>
                  <TableCell align="center">{model.accuracy.toFixed(2)}%</TableCell>
                  <TableCell align="center">{model.precision.toFixed(2)}%</TableCell>
                  <TableCell align="center">{model.recall.toFixed(2)}%</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${model.f1Score.toFixed(2)}%`}
                      color={model.f1Score > 80 ? 'success' : model.f1Score > 60 ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">{model.truePositives}</TableCell>
                  <TableCell align="center">{model.falsePositives}</TableCell>
                  <TableCell align="center">{model.trueNegatives}</TableCell>
                  <TableCell align="center">{model.falseNegatives}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Metric Definitions */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Metric Definitions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Accuracy</Typography>
              <Typography variant="body2" color="textSecondary">
                Percentage of correct predictions out of total predictions
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Precision</Typography>
              <Typography variant="body2" color="textSecondary">
                Of predicted abnormal cases, how many were correct
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Recall</Typography>
              <Typography variant="body2" color="textSecondary">
                Of actual abnormal cases, how many were detected
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>F1-Score</Typography>
              <Typography variant="body2" color="textSecondary">
                Harmonic mean of precision and recall - overall balance
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}