// src/pages/lab/CompletedTestsReport.jsx
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack, Card, CardContent, Grid, AppBar, Toolbar, Avatar, Alert, Chip } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Download as DownloadIcon, Refresh as RefreshIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function CompletedTestsReport() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get('/lab/completed');
      setRows(data.completed || []);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to load');
    }
  };

  useEffect(() => { load(); }, []);

  // Download generated PDF report for a specific completed test
  const downloadReport = async (consultationId, itemIndex) => {
    try {
      const response = await api.get(`/lab/report/${consultationId}/${itemIndex}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lab-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setMessage('Failed to download report');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fb' }}>
      {/* Header */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', color: '#6B46C1', borderBottom: '1px solid #eaeef4' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={require('../../assets/logo1.jpg')} variant="rounded" sx={{ width: 36, height: 36 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#6B46C1' }}>Holy Cross Hospital</Typography>
          </Stack>
          <Button variant="outlined" startIcon={<BackIcon />} onClick={() => navigate('/lab-dashboard')}>Back to Dashboard</Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3 }}>
        {/* Page Title */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', color: '#1a1a1a' }}>
            <CheckCircleIcon sx={{ mr: 1.5, color: '#4CAF50', fontSize: 32 }} />
            Completed Tests Report
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Successfully completed laboratory tests with results and reports</Typography>
        </Box>

        {message && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4CAF5015 0%, #4CAF5005 100%)', border: '1px solid #4CAF5030' }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>Total Completed</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>{rows.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #FF638015 0%, #FF638005 100%)', border: '1px solid #FF638030' }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>Abnormal Results</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF6380' }}>
                  {rows.filter(r => r.parameterResults?.some(p => p.isAbnormal)).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Completed Tests ({rows.length})</Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={load} sx={{ bgcolor: '#6B46C1' }}>Refresh</Button>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Token</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Visit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Result</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Range</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Report</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                      <CheckCircleIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                      <Typography display="block">No completed tests found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const params = Array.isArray(r.parameterResults) ? r.parameterResults : [];
                    const first = params[0];
                    const valueText = first ? `${first.value ?? ''} ${first.unit ?? ''}`.trim() || '-' : '-';
                    const rangeText = first ? (first.referenceRange || '-') : '-';
                    const remarksText = r.overallRemarks || (first?.remarks || '-') || '-';
                    const resultText = r.summaryResult || '-';
                    const hasAbnormal = params.some(p => p.isAbnormal);
                    const valueTitle = params.length > 1 ? params.map(p => `${p.parameterName}: ${p.value ?? '-'} ${p.unit ?? ''}`.trim()).join(', ') : undefined;
                    
                    return (
                      <TableRow key={`${r.consultationId}-${r.itemIndex}`} hover sx={{ backgroundColor: hasAbnormal ? '#fff3e0' : 'transparent' }}>
                        <TableCell>{r.appointmentDate ? new Date(r.appointmentDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell><Chip label={r.tokenNumber || '-'} size="small" variant="outlined" /></TableCell>
                        <TableCell>{r.visitId}</TableCell>
                        <TableCell>{r.patient?.name} ({r.patient?.opNumber})</TableCell>
                        <TableCell>{r.doctor?.name || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{r.testName}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }} title={resultText}>
                            {resultText}
                          </Typography>
                        </TableCell>
                        <TableCell title={valueTitle}>{valueText}</TableCell>
                        <TableCell>{rangeText}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }} title={remarksText}>
                            {remarksText}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<DownloadIcon />} 
                            onClick={() => downloadReport(r.consultationId, r.itemIndex)}
                            sx={{ bgcolor: '#4CAF50' }}
                          >
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#f5f7fb', borderTop: '1px solid #eaeef4', py: 2, px: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          © 2026 Holy Cross Hospital. Lab Report System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}