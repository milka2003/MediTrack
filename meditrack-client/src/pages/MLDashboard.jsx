// src/pages/MLDashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, CircularProgress, Alert, AppBar, Toolbar, Drawer, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Stack, Chip
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
  const radarData = chartData.map(m => ({
    name: m.name,
    accuracy: m.accuracy,
    precision: m.precision,
    recall: m.recall,
    f1Score: m.f1Score
  })) || [];

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

        {/* Models Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Models
                </Typography>
                <Typography variant="h4">
                  {Object.keys(metrics?.metrics || {}).length}
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
                  {Math.max(...chartData.map(m => m.f1Score || 0)).toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Accuracy
                </Typography>
                <Typography variant="h4">
                  {(chartData.reduce((sum, m) => sum + m.accuracy, 0) / chartData.length || 0).toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Precision
                </Typography>
                <Typography variant="h4">
                  {(chartData.reduce((sum, m) => sum + m.precision, 0) / chartData.length || 0).toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Model Comparison Chart */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
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
        {radarData.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Profiles (Radar)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData[0] ? [radarData[0]] : []}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Performance" dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        )}

        {/* Detailed Metrics Table */}
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Typography variant="h6" gutterBottom>
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
        <Paper sx={{ p: 2, mt: 3, backgroundColor: '#f9f9f9' }}>
          <Typography variant="h6" gutterBottom>
            📊 Metric Definitions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Accuracy</Typography>
              <Typography variant="body2" color="textSecondary">
                Percentage of correct predictions (TP+TN)/(Total)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Precision</Typography>
              <Typography variant="body2" color="textSecondary">
                Of predicted positives, how many were correct TP/(TP+FP)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Recall</Typography>
              <Typography variant="body2" color="textSecondary">
                Of actual positives, how many were found TP/(TP+FN)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>F1-Score</Typography>
              <Typography variant="body2" color="textSecondary">
                Harmonic mean of precision and recall (2×P×R)/(P+R)
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}