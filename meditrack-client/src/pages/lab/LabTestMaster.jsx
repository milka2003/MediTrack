// src/pages/lab/LabTestMaster.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Stack, Typography, TextField, Button, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, Card, CardContent, Grid, AppBar, Toolbar, Avatar, Alert } from '@mui/material';
import { Science as ScienceIcon, Edit as EditIcon, Toggle as ToggleIcon, ArrowBack as BackIcon } from '@mui/icons-material';
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

  const stats = [
    { label: 'Total Tests', value: tests.length, color: '#2196F3' },
    { label: 'Active Tests', value: tests.filter(t => t.status === 'Active').length, color: '#4CAF50' },
    { label: 'Inactive Tests', value: tests.filter(t => t.status === 'Inactive').length, color: '#FF9800' }
  ];

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
            <ScienceIcon sx={{ mr: 1.5, color: '#6B46C1', fontSize: 32 }} />
            Lab Test Master
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Manage laboratory tests and their parameters</Typography>
        </Box>

        {message && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`, border: `1px solid ${stat.color}30` }}>
                <CardContent>
                  <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>{stat.label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Filters</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Search Test" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} size="small" sx={{ minWidth: 200 }} />
            <TextField select label="Department" value={filter.department} onChange={(e) => setFilter({ ...filter, department: e.target.value })} size="small" sx={{ minWidth: 220 }}>
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
            </TextField>
            <TextField select label="Status" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} size="small" sx={{ width: 160 }}>
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
            <Button variant="contained" onClick={loadTests} sx={{ bgcolor: '#6B46C1' }}>Refresh</Button>
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Form Section */}
          <Paper sx={{ p: 3, flex: 1, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{form._id ? '✏️ Edit Test' : '➕ Add New Test'}</Typography>
            <Stack spacing={2}>
              <TextField label="Test Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required size="small" />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Test Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} size="small" sx={{ maxWidth: 240 }} />
                <TextField select label="Department (optional)" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} size="small" sx={{ minWidth: 240 }}>
                  <MenuItem value="">None</MenuItem>
                  {departments.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField type="number" label="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} size="small" sx={{ maxWidth: 240 }} />
                <TextField label="Sample Required" value={form.sampleRequired} onChange={(e) => setForm({ ...form, sampleRequired: e.target.value })} size="small" />
              </Stack>
              <TextField label="Description / Notes" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={2} size="small" />

              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f7fb', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Test Parameters</Typography>
                  <Button size="small" variant="contained" sx={{ bgcolor: '#6B46C1' }} onClick={addParameter}>+ Add</Button>
                </Box>
                {form.parameters.map((param, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#ffffff', border: '1px solid #e0e0e0' }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Parameter {index + 1}</Typography>
                        {form.parameters.length > 1 && (
                          <Button size="small" color="error" onClick={() => removeParameter(index)}>Remove</Button>
                        )}
                      </Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField label="Name" value={param.name} onChange={(e) => updateParameter(index, 'name', e.target.value)} required sx={{ flex: 1 }} size="small" />
                        <TextField label="Unit" value={param.unit} onChange={(e) => updateParameter(index, 'unit', e.target.value)} sx={{ width: 100 }} size="small" />
                        <TextField select label="Type" value={param.valueType} onChange={(e) => updateParameter(index, 'valueType', e.target.value)} sx={{ width: 120 }} size="small">
                          <MenuItem value="numeric">Numeric</MenuItem>
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="file">File</MenuItem>
                        </TextField>
                      </Stack>
                      <TextField label="Reference Range" value={param.referenceRange} onChange={(e) => updateParameter(index, 'referenceRange', e.target.value)} placeholder="e.g., 70-100 mg/dL" size="small" />
                      <TextField label="Description" value={param.description} onChange={(e) => updateParameter(index, 'description', e.target.value)} multiline minRows={1} size="small" />
                    </Stack>
                  </Paper>
                ))}
              </Box>

              <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} size="small" sx={{ width: 180 }}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" sx={{ bgcolor: '#6B46C1' }} onClick={save}>{form._id ? 'Update' : 'Save'}</Button>
                <Button variant="outlined" onClick={resetForm}>Reset</Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Tests List */}
          <Paper sx={{ p: 3, flex: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Tests List ({tests.length})</Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sample</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#999' }}>No tests found</TableCell>
                    </TableRow>
                  ) : (
                    tests.map(t => (
                      <TableRow key={t._id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{t.name}</TableCell>
                        <TableCell><Chip label={t.code || '-'} size="small" variant="outlined" /></TableCell>
                        <TableCell>{t.department?.name || '-'}</TableCell>
                        <TableCell align="right">${t.price ?? 0}</TableCell>
                        <TableCell>{t.sampleRequired || '-'}</TableCell>
                        <TableCell>
                          <Chip label={t.status} size="small" color={t.status === 'Active' ? 'success' : 'default'} variant="filled" />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => editRow(t)}>Edit</Button>
                            <Button size="small" variant="outlined" onClick={() => toggle(t)}>{t.status === 'Active' ? 'Deactivate' : 'Activate'}</Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Stack>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#f5f7fb', borderTop: '1px solid #eaeef4', py: 2, px: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          © 2026 Holy Cross Hospital. Lab Test Management System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}