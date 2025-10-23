// src/pages/lab/CompletedTestsReport.jsx
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack } from '@mui/material';
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>Completed Tests Report</Typography>
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
              <TableCell>Result</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Range</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Report</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => {
              const params = Array.isArray(r.parameterResults) ? r.parameterResults : [];
              const first = params[0];
              const valueText = first ? `${first.value ?? ''} ${first.unit ?? ''}`.trim() || '-' : '-';
              const rangeText = first ? (first.referenceRange || '-') : '-';
              const remarksText = r.overallRemarks || (first?.remarks || '-') || '-';
              const resultText = r.summaryResult || '-';
              const valueTitle = params.length > 1 ? params.map(p => `${p.parameterName}: ${p.value ?? '-'} ${p.unit ?? ''}`.trim()).join(', ') : undefined;
              return (
                <TableRow key={`${r.consultationId}-${r.itemIndex}`}>
                  <TableCell>{r.appointmentDate ? new Date(r.appointmentDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{r.tokenNumber || '-'}</TableCell>
                  <TableCell>{r.visitId}</TableCell>
                  <TableCell>{r.patient?.name} ({r.patient?.opNumber})</TableCell>
                  <TableCell>{r.doctor?.name || '-'}</TableCell>
                  <TableCell>{r.testName}</TableCell>
                  <TableCell>{resultText}</TableCell>
                  <TableCell title={valueTitle}>{valueText}</TableCell>
                  <TableCell>{rangeText}</TableCell>
                  <TableCell>{remarksText}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" onClick={() => downloadReport(r.consultationId, r.itemIndex)}>Download</Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>No completed tests.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}