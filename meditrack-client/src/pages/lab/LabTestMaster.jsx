// src/pages/lab/LabTestMaster.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Stack, Typography, TextField, Button, MenuItem, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function LabTestMaster() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [tests, setTests] = useState([]);
  const [filter, setFilter] = useState({ q: '', department: '', status: 'Active' });
  const [form, setForm] = useState({
    _id: '',
    name: '', code: '', department: '', price: '', description: '', sampleRequired: '', status: 'Active',
    parameters: [{ name: '', unit: '', referenceRange: '', valueType: 'numeric', description: '' }]
  });
  const [message, setMessage] = useState('');

  const loadDeps = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/departments');
      setDepartments(data.departments || []);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to load departments');
    }
  }, []);

  const loadTests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.q) params.set('q', filter.q);
      if (filter.department) params.set('department', filter.department);
      if (filter.status) params.set('status', filter.status);
      const { data } = await api.get(`/lab-tests?${params.toString()}`);
      setTests(data.tests || []);
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to load tests');
    }
  }, [filter]);

  useEffect(() => { loadDeps(); }, [loadDeps]);
  useEffect(() => { loadTests(); }, [filter, loadTests]);

  const resetForm = () => setForm({
    _id: '', name: '', code: '', department: '', price: '', description: '', sampleRequired: '', status: 'Active',
    parameters: [{ name: '', unit: '', referenceRange: '', valueType: 'numeric', description: '' }]
  });

  const save = async () => {
    try {
      const payload = {
        name: form.name,
        code: form.code,
        department: form.department || null,
        price: Number(form.price) || 0,
        description: form.description,
        sampleRequired: form.sampleRequired,
        status: form.status || 'Active',
        parameters: form.parameters.filter(p => p.name.trim())
      };
      if (form._id) {
        await api.put(`/lab-tests/${form._id}`, payload);
        setMessage('Updated');
      } else {
        await api.post('/lab-tests', payload);
        setMessage('Created');
      }
      resetForm();
      await loadTests();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to save');
    }
  };

  const editRow = (t) => setForm({
    _id: t._id, name: t.name, code: t.code || '', department: t.department?._id || t.department || '',
    price: t.price || '', description: t.description || '', sampleRequired: t.sampleRequired || '', status: t.status || 'Active',
    parameters: t.parameters && t.parameters.length > 0 ? t.parameters : [{ name: '', unit: '', referenceRange: '', valueType: 'numeric', description: '' }]
  });

  const toggle = async (t) => {
    try {
      await api.post(`/lab-tests/${t._id}/toggle`);
      await loadTests();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to toggle');
    }
  };

  const addParameter = () => {
    setForm(prev => ({
      ...prev,
      parameters: [...prev.parameters, { name: '', unit: '', referenceRange: '', valueType: 'numeric', description: '' }]
    }));
  };

  const removeParameter = (index) => {
    setForm(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const updateParameter = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      parameters: prev.parameters.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" gutterBottom>Lab Test Master</Typography>
        <Button variant="outlined" onClick={() => navigate('/lab-dashboard')}>Back</Button>
      </Box>
      {message && <Typography color="primary" sx={{ mb: 2 }}>{message}</Typography>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Search" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
          <TextField select label="Department" value={filter.department} onChange={(e) => setFilter({ ...filter, department: e.target.value })} sx={{ minWidth: 220 }}>
            <MenuItem value="">All</MenuItem>
            {departments.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField select label="Status" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} sx={{ width: 160 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={loadTests}>Refresh</Button>
        </Stack>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>{form._id ? 'Edit Test' : 'Add Test'}</Typography>
          <Stack spacing={2}>
            <TextField label="Test Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Test Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={{ maxWidth: 240 }} />
              <TextField select label="Department (optional)" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} sx={{ minWidth: 240 }}>
                <MenuItem value="">None</MenuItem>
                {departments.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="number" label="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} sx={{ maxWidth: 240 }} />
              <TextField label="Sample Required" value={form.sampleRequired} onChange={(e) => setForm({ ...form, sampleRequired: e.target.value })} />
            </Stack>
            <TextField label="Description / Notes" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={3} />

            {/* Parameters Section */}
            <Box sx={{ mt: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">Test Parameters</Typography>
                <Button size="small" variant="outlined" onClick={addParameter}>Add Parameter</Button>
              </Box>
              {form.parameters.map((param, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#f9f9f9' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">Parameter {index + 1}</Typography>
                      {form.parameters.length > 1 && (
                        <Button size="small" color="error" onClick={() => removeParameter(index)}>Remove</Button>
                      )}
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Parameter Name"
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        required
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="Unit"
                        value={param.unit}
                        onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <TextField
                        select
                        label="Value Type"
                        value={param.valueType}
                        onChange={(e) => updateParameter(index, 'valueType', e.target.value)}
                        sx={{ width: 150 }}
                      >
                        <MenuItem value="numeric">Numeric</MenuItem>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="file">File Upload</MenuItem>
                      </TextField>
                    </Stack>
                    <TextField
                      label="Reference Range"
                      value={param.referenceRange}
                      onChange={(e) => updateParameter(index, 'referenceRange', e.target.value)}
                      placeholder="e.g., 70-100 mg/dL"
                    />
                    <TextField
                      label="Description"
                      value={param.description}
                      onChange={(e) => updateParameter(index, 'description', e.target.value)}
                      multiline
                      minRows={2}
                    />
                  </Stack>
                </Paper>
              ))}
            </Box>

            <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ width: 180 }}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={save}>{form._id ? 'Update' : 'Save'}</Button>
              <Button variant="outlined" onClick={resetForm}>Reset</Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, flex: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Tests</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Sample</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map(t => (
                <TableRow key={t._id} hover>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.code || '-'}</TableCell>
                  <TableCell>{t.department?.name || '-'}</TableCell>
                  <TableCell align="right">{t.price ?? 0}</TableCell>
                  <TableCell>{t.sampleRequired || '-'}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => editRow(t)}>Edit</Button>
                      <Button size="small" onClick={() => toggle(t)}>{t.status === 'Active' ? 'Deactivate' : 'Activate'}</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {tests.length === 0 && (
                <TableRow><TableCell colSpan={7}>No tests found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Box>
  );
}