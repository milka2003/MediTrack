// src/pages/lab/PendingTestsReport.jsx
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack, Card, CardContent, Grid, AppBar, Toolbar, Avatar, Alert, Chip } from '@mui/material';
import { Pending as PendingIcon, Refresh as RefreshIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function PendingTestsReport() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get('/lab/pending');
      setRows(data.pending || []);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to load');
    }
  };

  useEffect(() => { load(); }, []);

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
            <PendingIcon sx={{ mr: 1.5, color: '#FF9800', fontSize: 32 }} />
            Pending Tests Report
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Tests awaiting sample collection, processing, or result entry</Typography>
        </Box>

        {message && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

        {/* Summary Card */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #FF980015 0%, #FF980005 100%)', border: '1px solid #FF980030' }}>
              <CardContent>
                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>Total Pending</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>{rows.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Table */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Pending Tests ({rows.length})</Typography>
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
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                      <PendingIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                      <Typography display="block">No pending tests found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={`${r.consultationId}-${r.itemIndex}`} hover>
                      <TableCell>{r.appointmentDate ? new Date(r.appointmentDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><Chip label={r.tokenNumber || '-'} size="small" variant="outlined" /></TableCell>
                      <TableCell>{r.visitId}</TableCell>
                      <TableCell>{r.patient?.name} ({r.patient?.opNumber})</TableCell>
                      <TableCell>{r.doctor?.name || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{r.testName}</TableCell>
                      <TableCell>
                        <Chip label={r.status} size="small" color="warning" variant="filled" />
                      </TableCell>
                    </TableRow>
                  ))
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