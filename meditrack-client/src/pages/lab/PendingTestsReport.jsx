// src/pages/lab/PendingTestsReport.jsx
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack } from '@mui/material';
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>Pending Tests Report</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={load}>Refresh</Button>
          <Button variant="outlined" onClick={() => navigate('/lab-dashboard')}>Back</Button>
        </Stack>
      </Box>
      {message && <Typography color="primary" sx={{ mb: 2 }}>{message}</Typography>}

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Token</TableCell>
              <TableCell>Visit</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Test</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.consultationId}-${r.itemIndex}`}>
                <TableCell>{r.appointmentDate ? new Date(r.appointmentDate).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{r.tokenNumber || '-'}</TableCell>
                <TableCell>{r.visitId}</TableCell>
                <TableCell>{r.patient?.name} ({r.patient?.opNumber})</TableCell>
                <TableCell>{r.doctor?.name || '-'}</TableCell>
                <TableCell>{r.testName}</TableCell>
                <TableCell>{r.status}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>No pending tests.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}