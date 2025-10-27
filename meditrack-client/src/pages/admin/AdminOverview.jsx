// src/pages/admin/AdminOverview.jsx
import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Stack, Divider } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import api from '../../api/client';

function StatCard({ icon: Icon, label, value, color = '#0D47A1' }) {
  return (
    <Paper elevation={3} sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ bgcolor: color, color: '#fff', p: 1.2, borderRadius: 2, display: 'flex' }}>
          <Icon />
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState({ staff: 0, doctors: 0, departments: 0, patients: 0 });
  const [recent, setRecent] = useState({ users: [], doctors: [] });
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [statsRes, staffRes, docRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/staff'),
        api.get('/admin/doctors'),
      ]);

      const { staffCount, doctorCount, departmentCount, patientCount } = statsRes.data || {};
      const staff = staffRes.data?.users || [];
      const doctors = docRes.data?.doctors || [];

      setStats({
        staff: staffCount ?? staff.length,
        doctors: doctorCount ?? doctors.filter(d => d.active !== false).length,
        departments: departmentCount ?? 0,
        patients: patientCount ?? 0,
      });

      setRecent({
        users: staff.slice(-5).reverse(),
        doctors: doctors.slice(-5).reverse(),
      });
    } catch (e) {
      setMessage(e.response?.data?.message || 'Failed to load dashboard data');
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Box>
      {message && <Typography color="primary" sx={{ mb: 2 }}>{message}</Typography>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={PeopleAltIcon} label="Total Staff" value={stats.staff} color="#1565C0" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={LocalHospitalIcon} label="Active Doctors" value={stats.doctors} color="#1E88E5" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={ApartmentIcon} label="Departments" value={stats.departments} color="#42A5F5" /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard icon={PersonOutlineIcon} label="Patients" value={stats.patients ?? '—'} color="#90CAF9" /></Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Recent Activity</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Latest Staff</Typography>
            {recent.users.length === 0 ? (
              <Typography color="text.secondary">No recent staff activity.</Typography>
            ) : (
              recent.users.map(u => (
                <Box key={u._id} sx={{ py: 0.75, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.name} <Typography component="span" color="text.secondary">({u.role})</Typography></Typography>
                  <Typography variant="caption" color="text.secondary">{u.username}{u.email ? ` • ${u.email}` : ''}</Typography>
                </Box>
              ))
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Latest Doctors</Typography>
            {recent.doctors.length === 0 ? (
              <Typography color="text.secondary">No recent doctor updates.</Typography>
            ) : (
              recent.doctors.map(d => (
                <Box key={d._id} sx={{ py: 0.75, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.user?.name || 'Doctor'}</Typography>
                  <Typography variant="caption" color="text.secondary">{d.department?.name ? `Dept: ${d.department.name}` : ''}</Typography>
                </Box>
              ))
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}