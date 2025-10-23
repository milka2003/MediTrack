// src/pages/pharmacy/AddMedicine.jsx
import React, { useState } from 'react';
import { Box, Paper, Stack, TextField, MenuItem, Button, Typography } from '@mui/material';
import api from '../../api/client';

export default function AddMedicine({ onSaved }) {
  const [form, setForm] = useState({
    name: '', type: 'Tablet', strength: '', unit: 'tab', manufacturer: '', price: '', stock: '', minStock: '', expiryDate: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
        minStock: Number(form.minStock) || 0,
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : undefined,
      };
      await api.post('/medicines', payload);
      setMessage('✅ Medicine saved');
      setForm({ name: '', type: 'Tablet', strength: '', unit: 'tab', manufacturer: '', price: '', stock: '' });
      onSaved && onSaved();
    } catch (e) {
      setMessage(e.response?.data?.message || '❌ Failed to save');
    }
  };

  return (
    <Paper sx={{ p: 2, maxWidth: 600 }}>
      <Typography variant="subtitle1" gutterBottom>Add Medicine</Typography>
      {message && <Typography sx={{ mb: 2 }}>{message}</Typography>}
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} required />
          <TextField select label="Type" name="type" value={form.type} onChange={handleChange} required>
            {['Tablet','Syrup','Capsule','Injection','Ointment','Drops','Other'].map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <TextField label="Strength" name="strength" value={form.strength} onChange={handleChange} placeholder="500mg" />
          <TextField select label="Unit" name="unit" value={form.unit} onChange={handleChange} required>
            {[
              {v:'tab', l:'Tablet'},
              {v:'bottle', l:'Bottle'},
              {v:'caps', l:'Capsule'},
              {v:'amp', l:'Ampoule'},
              {v:'tube', l:'Tube'},
              {v:'ml', l:'mL'},
              {v:'pack', l:'Pack'},
              {v:'other', l:'Other'},
            ].map(u => <MenuItem key={u.v} value={u.v}>{u.l}</MenuItem>)}
          </TextField>
          <TextField label="Manufacturer" name="manufacturer" value={form.manufacturer} onChange={handleChange} />
          <TextField type="number" label="Price" name="price" value={form.price} onChange={handleChange} />
          <TextField type="number" label="Opening Stock" name="stock" value={form.stock} onChange={handleChange} />
          <TextField type="number" label="Minimum Stock" name="minStock" value={form.minStock} onChange={handleChange} />
          <TextField type="date" label="Expiry Date" name="expiryDate" value={form.expiryDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained">Save</Button>
            <Button type="button" variant="outlined" onClick={() => setForm({ name: '', type: 'Tablet', strength: '', unit: 'tab', manufacturer: '', price: '', stock: '' })}>Reset</Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
}