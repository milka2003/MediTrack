import React, { useEffect, useState } from 'react';
import {
  Box, Paper, TextField, Button, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, Switch, Stack
} from '@mui/material';
import api from '../../api/client';

export default function Departments() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/admin/departments?includeInactive=true');
      setRows(data.departments);
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || 'Failed to load departments');
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/admin/departments/${editingId}`, form);
      } else {
        await api.post('/admin/departments', form);
      }
      setForm({ name: '', code: '', description: '' });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving department');
    }
  };

  const edit = (dep) => {
    setForm({ name: dep.name, code: dep.code || '', description: dep.description || '' });
    setEditingId(dep._id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', code: '', description: '' });
    setError('');
  };

  const toggleActive = async (id) => {
    await api.delete(`/admin/departments/${id}/toggle`);
    await load();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Departments</Typography>

      <Paper sx={{ p: 2, mb: 3, maxWidth: 600 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {editingId ? 'Edit Department' : 'Add Department'}
        </Typography>

        {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}

        <form onSubmit={submit}>
          <Stack spacing={2}>
            <TextField
              label="Name *" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              label="Code" value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              placeholder="e.g., GM, PSY"
            />
            <TextField
              label="Description" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              multiline rows={3}
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">
                {editingId ? 'Update' : 'Create'}
              </Button>
              {editingId && <Button onClick={cancelEdit}>Cancel</Button>}
            </Stack>
          </Stack>
        </form>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r._id} hover>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.code}</TableCell>
                <TableCell sx={{ maxWidth: 420 }}>{r.description}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={!!r.active}
                    onChange={() => toggleActive(r._id)}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => edit(r)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5}>No departments yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
