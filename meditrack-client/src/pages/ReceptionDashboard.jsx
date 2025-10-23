import React, { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  Grid,
  Stack,
  Divider,
  Avatar
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import axios from "axios";
import CreateVisit from "./reception/CreateVisit";
import VisitList from "./reception/VisitList";
import api from "../api/client";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';

// =================== PATIENT REGISTRATION FORM ===================
function AddPatientForm() {
  const [stats, setStats] = useState({ registrationsToday: 0, visitsToday: 0, pendingBills: 0, messages: 0 });
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    address: ""
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: "info", text: "" });

  const openSnack = (severity, text) => setSnack({ open: true, severity, text });
  const closeSnack = () => setSnack({ ...snack, open: false });

  // Load stats
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/reception/stats/today');
        setStats(data || {});
      } catch (e) {
        // Silent fail for stats
      }
    })();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // prevent duplicate clicks
    setSubmitting(true);
    try {
      // Normalize data before submit
      const payload = { ...form };
      // Ensure phone has country code prefix if missing
      if (payload.phone && !payload.phone.startsWith('+')) {
        payload.phone = '+91' + payload.phone;
      }
      // Ensure dob is ISO format (YYYY-MM-DD) if user agent returns localized string
      if (payload.dob && /\d{2}-\d{2}-\d{4}/.test(payload.dob)) {
        const [dd, mm, yyyy] = payload.dob.split('-');
        payload.dob = `${yyyy}-${mm}-${dd}`;
      }
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/reception/add-patient",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ Patient registered! OP Number: ${res.data.patient.opNumber}`);
      openSnack("success", `Patient registered! OP: ${res.data.patient.opNumber}`);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error adding patient");
      openSnack("error", err.response?.data?.message || "Error adding patient");
    }
    setSubmitting(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Today’s Registrations</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.registrationsToday ?? '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Today’s Visits</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.visitsToday ?? '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Pending Bills</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.pendingBills ?? '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Messages</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.messages ?? '—'}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={4} sx={{ p: 3, maxWidth: 920, mx: 'auto', borderRadius: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#01579B' }}>
          Register New Patient
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter patient details to generate an OP number automatically.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} fullWidth />
            <TextField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} fullWidth />
            <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} fullWidth />
            <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
            <TextField label="Date of Birth" name="dob" type="date" InputLabelProps={{ shrink: true }} value={form.dob} onChange={handleChange} fullWidth />
            <TextField select label="Gender" name="gender" value={form.gender} onChange={handleChange} fullWidth>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
            <TextField label="Address" name="address" multiline rows={3} value={form.address} onChange={handleChange} fullWidth sx={{ gridColumn: { sm: '1 / span 2' } }} />
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" sx={{ px: 3, py: 1.2, borderRadius: 2, bgcolor: '#0277BD' }} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Patient'}
            </Button>
            <Button type="button" variant="outlined" onClick={() => setForm({ firstName:'', lastName:'', phone:'', email:'', dob:'', gender:'', address:'' })}>Clear</Button>
          </Stack>
        </form>

        {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// =================== PLACEHOLDER COMPONENT ===================
function UnderConstruction({ title }) {
  return (
    <Box sx={{ p: 3 }}>
      <h2>{title}</h2>
      <p>🚧 This feature is under construction 🚧</p>
    </Box>
  );
}

// =================== MAIN DASHBOARD ===================
function ReceptionDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fb' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 240,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #01579B 0%, #0277BD 100%)',
            color: '#fff',
            borderRight: 'none'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>Reception</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>MediTrack</Typography>
        </Box>
        <List>
          <ListItemButton component={Link} to="/reception-dashboard">
            <ListItemIcon sx={{ color: '#fff' }}><PersonAddIcon /></ListItemIcon>
            <ListItemText primary="Register Patient" />
          </ListItemButton>
          <ListItemButton component={Link} to="/reception-dashboard/appointments">
            <ListItemIcon sx={{ color: '#fff' }}><EventNoteIcon /></ListItemIcon>
            <ListItemText primary="Appointments" />
          </ListItemButton>
          <ListItemButton component={Link} to="/reception-dashboard/visits">
            <ListItemIcon sx={{ color: '#fff' }}><ListAltIcon /></ListItemIcon>
            <ListItemText primary="Visit Listing" />
          </ListItemButton>
          <ListItemButton component={Link} to="/reception-dashboard/billing">
            <ListItemIcon sx={{ color: '#fff' }}><ReceiptLongIcon /></ListItemIcon>
            <ListItemText primary="Billing" />
          </ListItemButton>
          <ListItemButton component={Link} to="/reception-dashboard/reports">
            <ListItemIcon sx={{ color: '#fff' }}><AssessmentIcon /></ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', color: '#01579B', borderBottom: '1px solid #eaeef4' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar src={require('../assets/logo1.jpg')} variant="rounded" sx={{ width: 36, height: 36 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#01579B' }}>Holy Cross Hospital</Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ color: '#37474F' }}>Welcome {user?.name || 'Receptionist'}</Typography>
              <Button variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          <Routes>
            <Route index element={<AddPatientForm />} />
            <Route path="appointments" element={<CreateVisit />} />
            <Route path="visits" element={<VisitList />} />
            <Route path="billing" element={<UnderConstruction title="Billing" />} />
            <Route path="reports" element={<UnderConstruction title="Reports" />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default ReceptionDashboard;

