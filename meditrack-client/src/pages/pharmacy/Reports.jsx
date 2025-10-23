// src/pages/pharmacy/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, Divider, TextField, Chip, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import api from '../../api/client';

function formatDate(d) {
  const dt = new Date(d);
  return isNaN(dt) ? '-' : dt.toLocaleDateString();
}

function StockReport() {
  const [rows, setRows] = useState([]);
  const load = async () => {
    const { data } = await api.get('/pharmacy/reports/stock');
    setRows(data.items || []);
  };
  useEffect(() => { load(); }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Stock Report</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Medicine</TableCell>
            <TableCell>Strength</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell align="right">Stock</TableCell>
            <TableCell align="right">Min</TableCell>
            <TableCell>Expiry</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r._id} hover>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.strength || '-'}</TableCell>
              <TableCell>{r.unit}</TableCell>
              <TableCell align="right">{r.stock}</TableCell>
              <TableCell align="right">{r.minStock}</TableCell>
              <TableCell>{r.expiryDate ? formatDate(r.expiryDate) : '-'}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1}>
                  {r.lowStock && <Chip size="small" label="Low" color="warning" />}
                  {r.nearExpiry && <Chip size="small" label="Near Expiry" color="warning" />}
                  {r.expired && <Chip size="small" label="Expired" color="error" />}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={7}>No data.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

function DispensingReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);

  const load = async () => {
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    const q = params.length ? `?${params.join('&')}` : '';
    const { data } = await api.get(`/pharmacy/reports/dispensing${q}`);
    setRows(data.items || []);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>Dispensing Report</Typography>
        <TextField type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={load}>Load</Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Medicine</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell>Patient</TableCell>
            <TableCell>Doctor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={idx}>
              <TableCell>{r.date ? new Date(r.date).toLocaleString() : '-'}</TableCell>
              <TableCell>{r.medicineName}</TableCell>
              <TableCell align="right">{r.quantity}</TableCell>
              <TableCell>{r.patient?.opNumber} — {r.patient?.name}</TableCell>
              <TableCell>{r.doctorName || '-'}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={5}>No data.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function Reports() {
  return (
    <Box>
      <Stack spacing={3}>
        <StockReport />
        <DispensingReport />
      </Stack>
    </Box>
  );
}