// src/pages/NurseDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Paper,
  Typography,
  TextField,
  Stack,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';

function formatDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

export default function NurseDashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(formatDate(new Date()));
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeVisit, setActiveVisit] = useState(null);
  const [vitalsDialog, setVitalsDialog] = useState(false);
  const [vitals, setVitals] = useState({
    bp: "",
    temperature: "",
    oxygen: "",
    weight: "",
  });

  const loadVisits = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/visits?date=${date}`);
      setVisits(data.visits || []);
    } catch (e) {
      console.error('Nurse Dashboard - API Error:', e);
      setMessage(e.response?.data?.message || "Failed to load visits");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      navigate("/login");
      return;
    }
    loadVisits();
  }, [date, navigate, loadVisits]);

  const counts = useMemo(() => {
    const c = { open: 0, closed: 0, cancelled: 0, "no-show": 0 };
    for (const v of visits) c[v.status] = (c[v.status] || 0) + 1;
    return c;
  }, [visits]);

  const selectVisit = (v) => {
    setActiveVisit(v);
    setVitals({
      bp: v.vitals?.bp || "",
      temperature: v.vitals?.temperature || "",
      oxygen: v.vitals?.oxygen || "",
      weight: v.vitals?.weight || "",
    });
    setVitalsDialog(true);
  };

  const handleSaveVitals = async () => {
    if (!activeVisit) return;
    try {
      await api.put(`/visits/${activeVisit._id}/vitals`, vitals);
      setMessage("Vitals recorded successfully");
      setVitalsDialog(false);
      loadVisits(); // refresh to show updated vitals
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to save vitals");
    }
  };

  const nurseName = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").name || "Nurse"; }
    catch { return "Nurse"; }
  })();

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      navigate("/login");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f9fc" }}>
      {/* Top bar */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: "#ffffff", color: "#0d47a1", borderBottom: "1px solid #eaeef4" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", flexWrap: 'wrap', gap: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ color: "#0d47a1", fontWeight: 700 }}>MediTrack - Nurse</Typography>
            <TextField type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
            <Button variant="outlined" size="small" onClick={() => setDate(formatDate(new Date()))}>Today</Button>
            <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={loadVisits}>Refresh</Button>
            <Stack direction="row" spacing={1}>
              <Chip label={`Open: ${counts.open}`} color="info" size="small" />
              <Chip label={`Completed: ${counts.closed}`} color="success" size="small" />
              <Chip label={`Cancelled: ${counts.cancelled}`} size="small" />
              <Chip label={`No-show: ${counts["no-show"]}`} color="warning" size="small" />
            </Stack>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle2" sx={{ color: "#455a64" }}>{nurseName}</Typography>
            <Button startIcon={<LogoutIcon />} variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, width: '100%' }}>
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: "#0d47a1", fontWeight: 600 }}>
            Today's Appointments ({visits.length} visits)
          </Typography>
          
          {message && (
            <Typography color="error" sx={{ mb: 2 }}>{message}</Typography>
          )}
          {loading && (
            <Typography sx={{ mb: 2 }}>Loading visits...</Typography>
          )}

          <Table size="small" sx={{ width: '100%', mt: 2 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Token</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Patient</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Age/Gender</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Time Slot</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#0d47a1' }}>Vitals</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#0d47a1' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {loading ? "Loading visits..." : "No appointments found for this date"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visits.map((v, index) => {
                  // Determine status color
                  const getStatusColor = (status) => {
                    switch(status) {
                      case 'open': return 'info';
                      case 'closed': return 'success';
                      case 'cancelled': return 'default';
                      case 'no-show': return 'warning';
                      default: return 'default';
                    }
                  };

                  return (
                    <TableRow key={v._id} hover sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>
                        #{v.tokenNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {v.patientId?.firstName || 'Unknown'} {v.patientId?.lastName || ''}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            OP: {v.opNumber || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {v.patientId?.age || "-"} / {v.patientId?.gender || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {v.slot?.startTime && v.slot?.endTime ? `${v.slot.startTime} - ${v.slot.endTime}` : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={v.status || 'unknown'}
                          color={getStatusColor(v.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={v.vitals ? "Recorded" : "Pending"}
                          color={v.vitals ? "success" : "default"}
                          variant={v.vitals ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="primary"
                          startIcon={<AssignmentIcon />}
                          onClick={() => selectVisit(v)}
                          sx={{ minWidth: 'auto' }}
                        >
                          Vitals
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Vitals Dialog */}
        <Dialog open={vitalsDialog} onClose={() => setVitalsDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record Vitals</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Blood Pressure (e.g., 120/80)"
                value={vitals.bp}
                onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                fullWidth
              />
              <TextField
                label="Temperature (e.g., 98.6 F)"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                fullWidth
              />
              <TextField
                label="Oxygen Saturation (e.g., 98%)"
                value={vitals.oxygen}
                onChange={(e) => setVitals({ ...vitals, oxygen: e.target.value })}
                fullWidth
              />
              <TextField
                label="Weight (e.g., 65 kg)"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVitalsDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveVitals} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}