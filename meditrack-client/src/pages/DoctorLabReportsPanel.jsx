// src/pages/DoctorLabReportsPanel.jsx
import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function DoctorLabReportsPanel() {
  const [q, setQ] = useState('');
  const [test, setTest] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState({ items: [], page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(false);

  const load = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (test) params.append('test', test);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', page);
      params.append('limit', data.limit || 20);
      const { data: res } = await api.get(`/doctor/lab-reports?${params.toString()}`);
      setData(res || { items: [], page: 1, limit: 20, total: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [q, test, dateFrom, dateTo]);

  useEffect(() => {
    const id = setInterval(() => load(data.page || 1), 15000);
    return () => clearInterval(id);
  }, [data.page, q, test, dateFrom, dateTo]);

  const openReport = (reportUrl) => {
    const base = 'http://localhost:5000/api';
    window.open(`${base}${reportUrl}`, '_blank');
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#0d47a1' }}>Lab Reports</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField size="small" label="Search patient/test/op" value={q} onChange={(e) => setQ(e.target.value)} />
          <TextField size="small" label="Test name or ID" value={test} onChange={(e) => setTest(e.target.value)} />
          <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="outlined" onClick={() => load(1)} disabled={loading}>Search</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>OP No.</TableCell>
                <TableCell>Test</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">View</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.items || []).map((it) => (
                <TableRow key={`${it.consultationId}-${it.itemIndex}`} hover>
                  <TableCell>{it.completedAt ? new Date(it.completedAt).toLocaleString() : '-'}</TableCell>
                  <TableCell>{it.patient?.name || '-'}</TableCell>
                  <TableCell>{it.patient?.opNumber || '-'}</TableCell>
                  <TableCell>{it.testName || '-'}</TableCell>
                  <TableCell>{it.status || '-'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" onClick={() => openReport(it.reportUrl)}>Open</Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!data.items || data.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6}>No reports found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button disabled={(data.page || 1) <= 1} onClick={() => load((data.page || 1) - 1)}>Prev</Button>
          <Typography variant="body2" sx={{ alignSelf: 'center' }}>Page {data.page || 1}</Typography>
          <Button disabled={((data.page || 1) * (data.limit || 20)) >= (data.total || 0)} onClick={() => load((data.page || 1) + 1)}>Next</Button>
        </Stack>
      </Paper>
    </Box>
  );
}