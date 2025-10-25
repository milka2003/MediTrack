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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  ContentCopyIcon
} from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FileCopyIcon from '@mui/icons-material/FileCopy';
import axios from "axios";
import CreateVisit from "./reception/CreateVisit";
import VisitList from "./reception/VisitList";
import api from "../api/client";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

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
  const [openDialog, setOpenDialog] = useState(false);
  const [registrationData, setRegistrationData] = useState({ opNumber: "", password: "", patientName: "" });

  const openSnack = (severity, text) => setSnack({ open: true, severity, text });
  const closeSnack = () => setSnack({ ...snack, open: false });
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(registrationData.password);
    openSnack("success", "Password copied to clipboard!");
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Clear form after closing dialog
    setForm({ firstName:'', lastName:'', phone:'', email:'', dob:'', gender:'', address:'' });
  };

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
      
      // Store registration data and open dialog
      setRegistrationData({
        opNumber: res.data.patient.opNumber,
        password: res.data.patient.portalPassword,
        patientName: res.data.patient.name
      });
      setOpenDialog(true);
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

      {/* Password Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0277BD', color: '#fff', fontWeight: 700 }}>
          ✅ Patient Registered Successfully
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Patient: <strong>{registrationData.patientName}</strong>
          </Typography>
          
          <Paper sx={{ p: 2, bgcolor: '#e3f2fd', mb: 2, border: '2px solid #0277BD' }}>
            <Typography variant="caption" color="text.secondary">OP Number</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0277BD', fontFamily: 'monospace' }}>
                {registrationData.opNumber}
              </Typography>
              <Button 
                size="small" 
                variant="outlined"
                onClick={() => {
                  navigator.clipboard.writeText(registrationData.opNumber);
                  openSnack("success", "OP Number copied!");
                }}
                startIcon={<FileCopyIcon />}
              >
                Copy
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, bgcolor: '#fff3e0', border: '2px solid #FF9800' }}>
            <Typography variant="caption" color="text.secondary">Portal Password (Share with Patient)</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800', fontFamily: 'monospace', letterSpacing: 1 }}>
                {registrationData.password}
              </Typography>
              <Button 
                size="small" 
                variant="contained"
                color="warning"
                onClick={handleCopyPassword}
                startIcon={<FileCopyIcon />}
              >
                Copy
              </Button>
            </Stack>
            <Typography variant="caption" sx={{ mt: 2, display: 'block', color: '#d84315', fontWeight: 500 }}>
              ⚠️ Share this password with the patient. They will use OP Number + Password to login.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} variant="contained" sx={{ bgcolor: '#0277BD' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

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

// =================== MANAGE PATIENT PORTAL ACCESS ===================
function ManagePatientAccess() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enableLoading, setEnableLoading] = useState(null);
  const [snack, setSnack] = useState({ open: false, severity: "info", text: "" });
  const [passwordDialog, setPasswordDialog] = useState({ open: false, data: null });

  const openSnack = (severity, text) => setSnack({ open: true, severity, text });
  const closeSnack = () => setSnack({ ...snack, open: false });

  // Fetch patients without portal access
  React.useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/reception/patients-without-access",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPatients(res.data.patients || []);
    } catch (err) {
      openSnack("error", "Failed to fetch patients");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAccess = async (patientId) => {
    try {
      setEnableLoading(patientId);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/reception/enable-patient-access",
        { patientId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Show password dialog
      setPasswordDialog({ open: true, data: res.data.patient });
      openSnack("success", "Portal access enabled!");

      // Remove from list
      setPatients(patients.filter(p => p._id !== patientId));
    } catch (err) {
      openSnack("error", err.response?.data?.message || "Failed to enable access");
      console.error(err);
    } finally {
      setEnableLoading(null);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 3, bgcolor: '#ffffff' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <VpnKeyIcon sx={{ fontSize: 32, color: '#0277BD' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#01579B' }}>
              Enable Patient Portal Access
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patients.length} patient{patients.length !== 1 ? 's' : ''} waiting for portal access
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Alert severity="success">✅ All patients have portal access enabled!</Alert>
        ) : (
          <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Patient Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>OP Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient._id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500 }}>
                        {patient.firstName} {patient.lastName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#0277BD' }}>
                        {patient.opNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ bgcolor: '#0277BD' }}
                        onClick={() => handleEnableAccess(patient._id)}
                        disabled={enableLoading === patient._id}
                      >
                        {enableLoading === patient._id ? (
                          <CircularProgress size={20} sx={{ color: '#fff' }} />
                        ) : (
                          'Enable'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Password Display Dialog */}
      <Dialog
        open={passwordDialog.open}
        onClose={() => setPasswordDialog({ open: false, data: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: '#0277BD', color: '#fff', fontWeight: 700 }}>
          ✅ Portal Access Enabled
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {passwordDialog.data && (
            <>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Patient: <strong>{passwordDialog.data.name}</strong>
              </Typography>

              <Paper sx={{ p: 2, bgcolor: '#e3f2fd', mb: 2, border: '2px solid #0277BD' }}>
                <Typography variant="caption" color="text.secondary">OP Number</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0277BD', fontFamily: 'monospace' }}>
                    {passwordDialog.data.opNumber}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      navigator.clipboard.writeText(passwordDialog.data.opNumber);
                      openSnack("success", "OP Number copied!");
                    }}
                    startIcon={<FileCopyIcon />}
                  >
                    Copy
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ p: 2, bgcolor: '#fff3e0', border: '2px solid #FF9800' }}>
                <Typography variant="caption" color="text.secondary">Portal Password (Share with Patient)</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800', fontFamily: 'monospace', letterSpacing: 1 }}>
                    {passwordDialog.data.portalPassword}
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color="warning"
                    onClick={() => {
                      navigator.clipboard.writeText(passwordDialog.data.portalPassword);
                      openSnack("success", "Password copied!");
                    }}
                    startIcon={<FileCopyIcon />}
                  >
                    Copy
                  </Button>
                </Stack>
                <Typography variant="caption" sx={{ mt: 2, display: 'block', color: '#d84315', fontWeight: 500 }}>
                  ⚠️ Share this password with the patient via WhatsApp or phone.
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setPasswordDialog({ open: false, data: null })}
            variant="contained"
            sx={{ bgcolor: '#0277BD' }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

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
          <ListItemButton component={Link} to="/reception-dashboard/manage-access">
            <ListItemIcon sx={{ color: '#fff' }}><VpnKeyIcon /></ListItemIcon>
            <ListItemText primary="Enable Portal Access" />
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
            <Route path="manage-access" element={<ManagePatientAccess />} />
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

