// src/pages/pharmacy/MedicineList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Paper, Stack, TextField, Button, Typography, Table, TableHead, TableRow, TableCell, TableBody, Switch } from '@mui/material';
import api from '../../api/client';

export default function MedicineList() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/medicines?q=${encodeURIComponent(q)}`);
      setRows(data.medicines || []);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to load');
    }
  }, [q]);

  useEffect(() => { load(); }, [q, load]);

  const toggleActive = async (id) => {
    await api.delete(`/medicines/${id}/toggle`);
    load();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="contained" onClick={load}>Search</Button>
      </Stack>

      {message && <Typography sx={{ mb: 2 }}>{message}</Typography>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Strength</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Manufacturer</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell align="center">Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r._id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell>{r.strength}</TableCell>
              <TableCell>{r.unit}</TableCell>
              <TableCell>{r.manufacturer}</TableCell>
              <TableCell>{r.price}</TableCell>
              <TableCell>{r.stock}</TableCell>
              <TableCell align="center"><Switch checked={!!r.active} onChange={() => toggleActive(r._id)} /></TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>No medicines.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}