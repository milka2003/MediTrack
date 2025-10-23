// src/pages/pharmacy/PendingPrescriptions.jsx
import React, { useEffect, useState } from 'react';
import { Paper, Stack, Typography, Button, Collapse, Box, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import api from '../../api/client';

export default function PendingPrescriptions() {
  const [rows, setRows] = useState([]);
  const [openIds, setOpenIds] = useState({});
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/pharmacy/prescriptions?status=pending');
      setRows(data.items || []);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to load');
    }
  };
  useEffect(() => { load(); }, []);

  const toggle = (id) => setOpenIds((m) => ({ ...m, [id]: !m[id] }));

  const dispense = async (visitId) => {
    await api.post(`/pharmacy/dispense/${visitId}`, {});
    load();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Pending Prescriptions</Typography>
      {message && <Typography color="error" sx={{ mb: 2 }}>{message}</Typography>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>OP</TableCell>
            <TableCell>Doctor</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(v => (
            <React.Fragment key={v._id}>
              <TableRow hover onClick={() => toggle(v._id)}>
                <TableCell>{v.patientId?.firstName} {v.patientId?.lastName}</TableCell>
                <TableCell>{v.opNumber}</TableCell>
                <TableCell>{v.doctorId?.user?.name}</TableCell>
                <TableCell>{v.prescriptionStatus}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={(e) => { e.stopPropagation(); toggle(v._id); }}>View</Button>
                    <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); dispense(v._id); }}>Dispense</Button>
                  </Stack>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                  <Collapse in={!!openIds[v._id]} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
                      {(!v.prescriptions || v.prescriptions.length === 0) ? (
                        <Typography color="text.secondary">No items.</Typography>
                      ) : (
                        <ul style={{ margin: 0 }}>
                          {v.prescriptions.map((p, i) => (
                            <li key={i}>
                              {p.medicineName || p.medicineId} — Qty: {p.quantity || 1} {p.dosage ? `— ${p.dosage}` : ''}
                              {p.instructions ? ` — ${p.instructions}` : ''}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>No pending prescriptions.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}