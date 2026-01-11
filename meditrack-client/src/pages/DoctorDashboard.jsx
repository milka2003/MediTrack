// src/pages/DoctorDashboard.jsx
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
  Divider,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import MedicineAutocomplete from "../components/MedicineAutocomplete";
import LabTestAutocomplete from "../components/LabTestAutocomplete";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import DoctorLabReportsPanel from "./DoctorLabReportsPanel";
import TaskAllocation from "./admin/TaskAllocation";

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MedicationIcon from '@mui/icons-material/Medication';
import ScienceIcon from '@mui/icons-material/Science';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import HealingIcon from '@mui/icons-material/Healing';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';
import CancelIcon from '@mui/icons-material/Cancel';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';

function formatDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(formatDate(new Date()));
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [menu, setMenu] = useState('dashboard');
  const [tab, setTab] = useState(0);
  const [activeVisit, setActiveVisit] = useState(null);
  const [history, setHistory] = useState([]);
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [queue, setQueue] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [availability, setAvailability] = useState(null);

  const loadAvailability = useCallback(async () => {
    try {
      const { data } = await api.get('/doctor/me/availability');
      setAvailability(data.availability);
    } catch (e) {
      console.error('Failed to load availability:', e);
    }
  }, []);

  const updateAvailability = async (status) => {
    try {
      setLoading(true);
      const { data } = await api.post('/doctor/me/availability', { status });
      setAvailability(data.availability);
      setMessageType('success');
      setMessage(`Status updated to ${status}`);
      setTimeout(() => setMessage(''), 3000);
      loadQueue();
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const [consult, setConsult] = useState({
    chiefComplaints: "",
    diagnosis: "",
    treatmentPlan: "",
    prescriptions: [{ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    labRequests: [{ testName: "", notes: "", status: "Pending" }],
  });

  const loadVisits = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/doctor/visits?date=${date}`);
      setVisits(data.visits || []);
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to load visits");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const loadQueue = useCallback(async () => {
    try {
      setQueueLoading(true);
      const { data } = await api.get(`/queue/doctor/me`);
      setQueue(data);
    } catch (e) {
      console.error('Queue load error:', e);
      setQueue(null);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      navigate("/login");
      return;
    }
    loadVisits();
    loadAvailability();
    loadQueue();
  }, [date, navigate, loadVisits, loadAvailability, loadQueue]);

  useEffect(() => {
    if (menu === 'queue') {
      loadQueue();
      const interval = setInterval(loadQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [menu, loadQueue]);

  const counts = useMemo(() => {
    const c = { open: 0, closed: 0, cancelled: 0, "no-show": 0 };
    for (const v of visits) c[v.status] = (c[v.status] || 0) + 1;
    return c;
  }, [visits]);

  const selectVisit = async (v) => {
    try {
      // Fetch the latest visit data including vitals
      const { data } = await api.get(`/doctor/visits/${v._id}`);
      const latestVisit = data.visit;

      setActiveVisit(latestVisit);
      setConsult({
        chiefComplaints: "",
        diagnosis: "",
        treatmentPlan: "",
        prescriptions: [{ medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
        labRequests: [{ testName: "", notes: "", status: "Pending" }],
      });

      const pid = latestVisit.patientId?._id || latestVisit.patientId?.id || latestVisit.patientId;

      const [cRes, hRes] = await Promise.allSettled([
        api.get(`/doctor/consultations/${latestVisit._id}`),
        pid ? api.get(`/doctor/patients/${pid}/history`) : Promise.reject(new Error("Missing patientId")),
      ]);

      if (cRes.status === "fulfilled" && cRes.value.data?.consultation) {
        const loadedConsult = cRes.value.data.consultation;
        // Ensure labRequests have status
        loadedConsult.labRequests = (loadedConsult.labRequests || []).map(lr => ({
          ...lr,
          status: lr.status || 'Pending'
        }));
        setConsult(loadedConsult);
      }

      if (hRes.status === "fulfilled") {
        setHistory(hRes.value.data?.history || []);
      } else {
        setHistory([]);
        setMessageType('error');
        setMessage(hRes.reason?.response?.data?.message || "Failed to load history");
      }
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to load visit details");
    }
  };

  const updateVisitStatus = async (visitId, status) => {
    try {
      await api.patch(`/visits/${visitId}/status`, { status });
      await loadVisits();
      if (activeVisit && activeVisit._id === visitId) {
        setActiveVisit((a) => ({ ...a, status }));
      }
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to update status");
    }
  };

  const startConsultation = async (visitId) => {
    try {
      setLoading(true);
      await api.post(`/consultation/start/${visitId}`);
      setMessageType('success');
      setMessage('Consultation started');
      await loadVisits();
      // If this was the active visit, refresh it
      const { data } = await api.get(`/doctor/visits/${visitId}`);
      setActiveVisit(data.visit);
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to start consultation");
    } finally {
      setLoading(false);
    }
  };

  const endConsultation = async (visitId) => {
    try {
      setLoading(true);
      // First save the consultation data
      await api.post(`/doctor/consultations/${visitId}`, consult);
      await api.post(`/consultation/end/${visitId}`);
      setMessageType('success');
      setMessage('Consultation ended');
      await loadVisits();
      const { data } = await api.get(`/doctor/visits/${visitId}`);
      setActiveVisit(data.visit);
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to end consultation");
    } finally {
      setLoading(false);
    }
  };

  const callNextPatient = async () => {
    try {
      setLoading(true);
      await api.post(`/queue/doctor/me/next`);
      setMessageType('success');
      setMessage('Next patient called');
      await loadVisits();
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to call next patient");
    } finally {
      setLoading(false);
    }
  };

  const addRxRow = () => {
    setConsult((c) => ({
      ...c,
      prescriptions: [...(c.prescriptions || []), { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    }));
  };
  const addLabRow = () => {
    setConsult((c) => ({
      ...c,
      labRequests: [...(c.labRequests || []), { testName: "", notes: "", status: "Pending" }],
    }));
  };

  const saveConsultation = async () => {
    if (!activeVisit) return;
    try {
      await api.post(`/doctor/consultations/${activeVisit._id}`, consult);
      setMessageType('success');
      setMessage("Consultation saved successfully");
      setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to save consultation");
    }
  };

  useEffect(() => {
    if (!activeVisit) return;
    const id = setInterval(() => {
      api.post(`/doctor/consultations/${activeVisit._id}`, consult).catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [activeVisit, consult]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      navigate("/login");
    }
  };

  const downloadReport = async (consultationId, itemIndex) => {
    try {
      const response = await api.get(`/lab/report/${consultationId}/${itemIndex}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lab-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      setMessageType('error');
      setMessage('Failed to download report');
    }
  };

  const doctorName = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").name || "Doctor"; }
    catch { return "Doctor"; }
  })();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f9fc" }}>
      {/* Left Sidebar */}
      <Box sx={{ width: 240, bgcolor: "#0d47a1", color: "#fff", p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>MediTrack</Typography>
        <List sx={{ flexGrow: 1 }}>
          <ListItemButton selected={menu==='dashboard'} onClick={() => setMenu('dashboard')} sx={{ backgroundColor: menu === 'dashboard' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: "#fff" }}><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton selected={menu==='queue'} onClick={() => setMenu('queue')} sx={{ backgroundColor: menu === 'queue' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: "#fff" }}><QueueMusicIcon /></ListItemIcon>
            <ListItemText primary="Queue" />
          </ListItemButton>
          <ListItemButton selected={menu==='patients'} onClick={() => setMenu('patients')} sx={{ backgroundColor: menu === 'patients' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: "#fff" }}><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Patients" />
          </ListItemButton>
          <ListItemButton selected={menu==='prescriptions'} onClick={() => setMenu('prescriptions')} sx={{ backgroundColor: menu === 'prescriptions' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: "#fff" }}><MedicationIcon /></ListItemIcon>
            <ListItemText primary="Prescriptions" />
          </ListItemButton>
          <ListItemButton selected={menu==='lab-reports'} onClick={() => setMenu('lab-reports')} sx={{ backgroundColor: menu === 'lab-reports' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: "#fff" }}><ScienceIcon /></ListItemIcon>
            <ListItemText primary="Lab Reports" />
          </ListItemButton>
          <ListItemButton selected={menu==='history'} onClick={() => setMenu('history')} sx={{ backgroundColor: menu === 'history' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: "#fff" }}><HistoryIcon /></ListItemIcon>
            <ListItemText primary="History" />
          </ListItemButton>
          <ListItemButton selected={menu==='tasks'} onClick={() => setMenu('tasks')} sx={{ backgroundColor: menu === 'tasks' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: "#fff" }}><AssignmentIcon /></ListItemIcon>
            <ListItemText primary="Task Allocation" />
          </ListItemButton>
        </List>
        
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <ListItemIcon sx={{ color: "#fff" }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#ffffff", color: "#0d47a1", borderBottom: "1px solid #eaeef4" }}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={loadVisits}>Refresh</Button>
              
              <Box sx={{ border: "1px solid #eaeef4", borderRadius: 2, p: 0.5, display: "flex", alignItems: "center", gap: 1, bgcolor: '#f8f9fa' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, ml: 1, color: '#607d8b' }}>STATUS:</Typography>
                <Chip 
                  label={availability?.availabilityStatus || 'Unknown'} 
                  color={
                    availability?.availabilityStatus === 'Available' ? 'success' : 
                    availability?.availabilityStatus === 'Busy' ? 'warning' : 
                    availability?.availabilityStatus === 'OnBreak' ? 'secondary' : 'default'
                  } 
                  size="small" 
                  sx={{ fontWeight: 'bold' }}
                />
                <Button 
                  size="small" 
                  variant="contained" 
                  color="secondary" 
                  sx={{ py: 0, minHeight: 28 }}
                  disabled={availability?.availabilityStatus !== 'Available' || loading || visits.some(v => v.status === 'InConsultation')}
                  onClick={() => updateAvailability('OnBreak')}
                >
                  Start Break
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  color="success" 
                  sx={{ py: 0, minHeight: 28 }}
                  disabled={availability?.availabilityStatus !== 'OnBreak' || loading}
                  onClick={() => updateAvailability('Available')}
                >
                  End Break
                </Button>
              </Box>

              <Button 
                variant="contained" 
                color="success"
                startIcon={<PlayCircleOutlineIcon />}
                size="small"
                onClick={callNextPatient}
                disabled={loading || visits.some(v => v.status === 'InConsultation') || availability?.availabilityStatus !== 'Available'}
                sx={{ py: 1 }}
              >
                Call Next
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", lg: "flex" } }}>
                <Chip label={`Registered: ${counts.Registered || 0}`} color="info" size="small" variant="outlined" />
                <Chip label={`Vitals: ${counts.VitalsCompleted || 0}`} color="secondary" size="small" variant="outlined" />
                <Chip label={`Ready: ${counts.ReadyForConsultation || 0}`} color="primary" size="small" variant="outlined" />
                <Chip label={`Active: ${counts.InConsultation || 0}`} color="warning" size="small" variant="outlined" />
                <Chip label={`Done: ${counts.ConsultationCompleted || 0}`} color="success" size="small" variant="outlined" />
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Typography variant="subtitle2" sx={{ color: "#455a64", fontWeight: 600 }}>{doctorName}</Typography>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2, minWidth: 0 }}>
          {menu === 'dashboard' && (
          <Stack direction={{ xs: "column", xl: "row" }} spacing={2} sx={{ alignItems: 'stretch', minWidth: 0 }}>
            {/* Today’s Appointments */}
            <Paper sx={{ p: 2, flex: 0.4, borderRadius: 2, minWidth: 0, overflow: 'hidden', border: '1px solid #e0e6ed' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: "#0d47a1", fontWeight: 700, mb: 2 }}>
                Today’s Appointments
              </Typography>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Token</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Age/Gender</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Slot</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits.map((v) => (
                    <TableRow
                      key={v._id}
                      hover
                      selected={activeVisit?._id === v._id}
                      onClick={() => selectVisit(v)}
                      sx={{ cursor: "pointer", "&.Mui-selected": { backgroundColor: "#e3f2fd" } }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: '#0d47a1' }}>{v.tokenNumber}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ bgcolor: v.status === 'InConsultation' ? '#4caf50' : "#90caf9", width: 32, height: 32, fontSize: 14 }}>
                            {(v.patientId?.firstName || "?")[0]}
                          </Avatar>
                          <Box>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {v.patientId?.firstName} {v.patientId?.lastName}
                            </div>
                            <div style={{ color: "#78909c", fontSize: 11 }}>OP: {v.opNumber}</div>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {v.patientId?.age || "-"} / {v.patientId?.gender || "-"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {v.slot?.startTime && v.slot?.endTime ? `${v.slot.startTime} - ${v.slot.endTime}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={v.status}
                          sx={{ fontSize: 10, fontWeight: 600, height: 20 }}
                          color={v.status === "InConsultation" ? "warning" : v.status === "ConsultationCompleted" ? "success" : v.status === "ReadyForConsultation" ? "info" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Start Consultation">
                            <span>
                              <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); startConsultation(v._id); }} disabled={!['ReadyForConsultation', 'VitalsCompleted'].includes(v.status) || visits.some(v => v.status === 'InConsultation')}>
                                <PlayCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="End Consultation">
                            <span>
                              <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); endConsultation(v._id); }} disabled={v.status !== "InConsultation"}>
                                <DoneAllIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancel Visit">
                            <span>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); updateVisitStatus(v._id, "cancelled"); }} disabled={["cancelled", "ConsultationCompleted", "Completed"].includes(v.status)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visits.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No visits for selected date.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </Box>
              {message && (
                <Typography sx={{ mt: 2, fontWeight: 600, fontSize: 13 }} color={messageType === 'success' ? 'success' : 'error'}>
                  {message}
                </Typography>
              )}
            </Paper>

            {/* Consultation Panel */}
            <Paper sx={{ p: 2, flex: 0.6, borderRadius: 2, minWidth: 0, border: '1px solid #e0e6ed' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: "#0d47a1", fontWeight: 700, mb: 2 }}>
                Consultation
              </Typography>
              {!activeVisit && <Typography color="text.secondary">Select a visit to begin.</Typography>}
              {activeVisit && (
                <>
                  {/* Active Patient Header */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1.5, border: "1px solid #e3f2fd", bgcolor: "#f1f8ff", borderRadius: 1, mb: 2 }}>
                    <Avatar sx={{ bgcolor: "#64b5f6" }}>{(activeVisit.patientId?.firstName || "?")[0]}</Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>
                        {activeVisit.patientId?.firstName} {activeVisit.patientId?.lastName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#607d8b" }}>
                        OP: {activeVisit.opNumber} • {activeVisit.patientId?.age || "-"} / {activeVisit.patientId?.gender || "-"}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Vitals Display */}
                  {activeVisit.vitals && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Vitals</Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Typography><strong>BP:</strong> {activeVisit.vitals.bp || '-'}</Typography>
                        <Typography><strong>Temp:</strong> {activeVisit.vitals.temperature || '-'}</Typography>
                        <Typography><strong>Oxygen:</strong> {activeVisit.vitals.oxygen || '-'}</Typography>
                        <Typography><strong>Weight:</strong> {activeVisit.vitals.weight || '-'}</Typography>
                      </Stack>
                    </Paper>
                  )}

                  <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" allowScrollButtonsMobile>
                    <Tab label="Summary" />
                    <Tab label="Prescriptions" />
                    <Tab label="Lab Requests" />
                    <Tab label="Lab Reports" />
                    <Tab label="History" />
                  </Tabs>

                  {tab === 0 && (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, border: '1px solid #e3f2fd' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <AssignmentIcon color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#455a64' }}>Chief Complaints</Typography>
                        </Stack>
                        <TextField placeholder="Enter chief complaints" multiline minRows={4} value={consult.chiefComplaints} onChange={(e) => setConsult({ ...consult, chiefComplaints: e.target.value })} fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} />
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, border: '1px solid #e3f2fd' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <MedicalInformationIcon color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#455a64' }}>Diagnosis</Typography>
                        </Stack>
                        <TextField placeholder="Search/add diagnosis" value={consult.diagnosis} onChange={(e) => setConsult({ ...consult, diagnosis: e.target.value })} fullWidth sx={{ bgcolor: '#fff' }} />
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, border: '1px solid #e3f2fd' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                          <HealingIcon color="primary" sx={{ fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#455a64' }}>Treatment Plan</Typography>
                        </Stack>
                        <TextField placeholder="Outline treatment plan" multiline minRows={4} value={consult.treatmentPlan} onChange={(e) => setConsult({ ...consult, treatmentPlan: e.target.value })} fullWidth variant="outlined" sx={{ bgcolor: '#fff' }} />
                      </Paper>
                    </Stack>
                  )} 

                  {tab === 1 && (
                    <Stack spacing={2} sx={{ minHeight: 0 }}>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                        {(consult.prescriptions || []).map((p, i) => (
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} key={i} alignItems="flex-start" sx={{ flexWrap: 'wrap' }}>
                            <MedicineAutocomplete
                              value={p.medicineName || ""}
                              onSelect={(med) => {
                                const arr = [...consult.prescriptions];
                                arr[i].medicineId = med?._id || null;
                                arr[i].medicineName = med?.name || "";
                                setConsult({ ...consult, prescriptions: arr });
                              }}
                            />
                            <TextField
                              type="number"
                              label="Qty"
                              value={p.quantity || 1}
                              onChange={(e) => {
                                const arr = [...consult.prescriptions];
                                arr[i].quantity = Number(e.target.value) || 1;
                                setConsult({ ...consult, prescriptions: arr });
                              }}
                              sx={{ width: 100, flexShrink: 0 }}
                            />
                            <TextField
                              label="Dosage"
                              value={p.dosage || ""}
                              onChange={(e) => {
                                const arr = [...consult.prescriptions];
                                arr[i].dosage = e.target.value;
                                setConsult({ ...consult, prescriptions: arr });
                              }}
                              sx={{ minWidth: 120, flexShrink: 0 }}
                            />
                            <TextField
                              label="Frequency"
                              value={p.frequency || ""}
                              onChange={(e) => {
                                const arr = [...consult.prescriptions];
                                arr[i].frequency = e.target.value;
                                setConsult({ ...consult, prescriptions: arr });
                              }}
                              sx={{ width: 120, flexShrink: 0 }}
                              placeholder="e.g. 1-0-1"
                            />
                            <TextField
                              label="Duration"
                              value={p.duration || ""}
                              onChange={(e) => {
                                const arr = [...consult.prescriptions];
                                arr[i].duration = e.target.value;
                                setConsult({ ...consult, prescriptions: arr });
                              }}
                              sx={{ width: 100, flexShrink: 0 }}
                              placeholder="e.g. 5 days"
                            />
                            <TextField
                              label="Instructions"
                              value={p.instructions || ""}
                              onChange={(e) => {
                                const arr = [...consult.prescriptions];
                                arr[i].instructions = e.target.value;
                                setConsult({ ...consult, prescriptions: arr });
                              }}
                              sx={{ flex: 1, minWidth: { xs: '100%', sm: 240 } }}
                            />
                            <IconButton
                              size="small"
                              aria-label="remove"
                              onClick={() => {
                                const arr = [...consult.prescriptions];
                                arr.splice(i, 1);
                                setConsult({ ...consult, prescriptions: arr });
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}
                      </Box>
                      <Button variant="outlined" onClick={addRxRow}>+ Add Medicine</Button>
                    </Stack>
                  )}

                  {tab === 2 && (
                    <Stack spacing={2}>
                      {(consult.labRequests || []).map((l, i) => (
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} key={i} alignItems="center">
                          <LabTestAutocomplete
                            value={l.testName || ""}
                            onSelect={(test) => {
                              const arr = [...consult.labRequests];
                              arr[i].testId = test?._id || null;
                              arr[i].testName = test?.name || "";
                              arr[i].status = arr[i].status || 'Pending';
                              setConsult({ ...consult, labRequests: arr });
                            }}
                          />
                          <TextField
                            label="Notes"
                            value={l.notes || ""}
                            onChange={(e) => {
                              const arr = [...consult.labRequests];
                              arr[i].notes = e.target.value;
                              setConsult({ ...consult, labRequests: arr });
                            }}
                            sx={{ flex: 1 }}
                          />
                          <IconButton
                            size="small"
                            aria-label="remove"
                            onClick={() => {
                              const arr = [...consult.labRequests];
                              arr.splice(i, 1);
                              setConsult({ ...consult, labRequests: arr });
                            }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button variant="outlined" onClick={addLabRow}>+ Add Lab Test</Button>
                    </Stack>
                  )}

                  {tab === 3 && (
                    <Stack spacing={2}>
                      {(consult.labRequests || []).length === 0 ? (
                        <Typography color="text.secondary">No lab tests requested.</Typography>
                      ) : (
                        (consult.labRequests || []).map((l, i) => (
                          <Paper key={i} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {l.testName || 'Unnamed Test'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Status: <Chip size="small" label={l.status || 'Pending'} color={l.status === 'Completed' ? 'success' : l.status === 'In Progress' ? 'warning' : 'default'} />
                                </Typography>
                                {l.notes && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    Notes: {l.notes}
                                  </Typography>
                                )}
                              </Box>
                              {l.status === 'Completed' && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => downloadReport(consult._id || activeVisit._id, i)}
                                >
                                  Download Report
                                </Button>
                              )}
                            </Stack>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  )}

                  {tab === 4 && (
                    <Box>
                      {history.length === 0 ? (
                        <Typography color="text.secondary">No previous records.</Typography>
                      ) : (
                        <Box sx={{ maxHeight: 220, overflow: "auto", border: "1px solid #eee", borderRadius: 1, p: 1 }}>
                          {history.map((h) => (
                            <div key={h._id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px dashed #eee" }}>
                              <div>
                                <b>{new Date(h.appointmentDate).toLocaleDateString()}</b>
                                {h.slot?.startTime ? ` • ${h.slot.startTime}-${h.slot.endTime}` : ""}
                                {h.doctor?.name ? ` • Dr. ${h.doctor.name}` : ""}
                                {` • ${h.status}`}
                              </div>
                              {h.consultation?.diagnosis && <div>Dx: {h.consultation.diagnosis}</div>}
                              {h.consultation?.prescriptions?.length ? (
                                <div>Rx: {h.consultation.prescriptions.map((p) => `${p.medicine} ${p.dosage}`).join(", ")}</div>
                              ) : null}
                            </div>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={saveConsultation}>Save Consultation</Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => activeVisit && endConsultation(activeVisit._id)}
                      disabled={activeVisit?.status !== "InConsultation"}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      End Consultation
                    </Button>
                    {['ReadyForConsultation', 'VitalsCompleted'].includes(activeVisit?.status) && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => startConsultation(activeVisit._id)}
                        disabled={visits.some(v => v.status === 'InConsultation')}
                      >
                        Start Consultation
                      </Button>
                    )}
                  </Stack>
                </>
              )}
            </Paper>
          </Stack>
          )}

          {menu === 'lab-reports' && (
            <DoctorLabReportsPanel />
          )}

          {menu === 'tasks' && (
            <TaskAllocation />
          )}

          {menu === 'queue' && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              {queueLoading && !queue ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    <Paper
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        bgcolor: '#f5f5f5',
                        borderRadius: 2,
                        minHeight: 300,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 2, fontWeight: 600 }}>
                        CURRENT TOKEN
                      </Typography>
                      {queue?.currentToken ? (
                        <>
                          <Typography sx={{ fontSize: '80px', fontWeight: 'bold', color: '#1976d2', lineHeight: 1 }}>
                            {queue.currentToken.tokenNumber}
                          </Typography>
                          <Typography sx={{ mt: 2, fontWeight: 600 }}>
                            {queue.currentToken.patientName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            OP: {queue.currentToken.opNumber}
                          </Typography>
                        </>
                      ) : (
                        <Typography sx={{ color: '#999', fontSize: '1.1rem' }}>
                          No patient in consultation
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 2, fontWeight: 600 }}>
                        WAITING QUEUE
                      </Typography>

                      <Typography sx={{ color: '#1976d2', fontSize: '1.5rem', fontWeight: 'bold', mb: 2 }}>
                        {queue?.waitingCount || 0} waiting
                      </Typography>

                      <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                        {queue?.nextTokens && queue.nextTokens.length > 0 ? (
                          <Stack spacing={1.5}>
                            {queue.nextTokens.slice(0, 8).map((token) => (
                              <Paper key={token.visitId} sx={{ p: 1.5, bgcolor: '#f9f9f9' }}>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1976d2' }}>
                                  Token {token.tokenNumber}
                                </Typography>
                                <Typography sx={{ fontSize: '0.9rem', color: '#333' }}>
                                  {token.patientName}
                                </Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>
                                  OP: {token.opNumber}
                                </Typography>
                              </Paper>
                            ))}
                          </Stack>
                        ) : (
                          <Typography sx={{ color: '#999', textAlign: 'center', py: 3 }}>
                            No patients waiting
                          </Typography>
                        )}
                      </Box>

                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayCircleOutlineIcon />}
                        onClick={callNextPatient}
                        disabled={loading || !queue?.nextTokens?.length || availability?.availabilityStatus !== 'Available'}
                        fullWidth
                        sx={{ bgcolor: '#1976d2', fontWeight: 'bold' }}
                      >
                        CALL NEXT
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}