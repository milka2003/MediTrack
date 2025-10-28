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
} from "@mui/material";
import MedicineAutocomplete from "../components/MedicineAutocomplete";
import LabTestAutocomplete from "../components/LabTestAutocomplete";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import DoctorLabReportsPanel from "./DoctorLabReportsPanel";

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

  const [consult, setConsult] = useState({
    chiefComplaints: "",
    diagnosis: "",
    treatmentPlan: "",
    prescriptions: [{ medicine: "", dosage: "", instructions: "" }],
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
        prescriptions: [{ medicine: "", dosage: "", instructions: "" }],
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
      await api.patch(`/doctor/visits/${visitId}/status`, { status });
      await loadVisits();
      if (activeVisit && activeVisit._id === visitId && status !== "open") {
        setActiveVisit((a) => ({ ...a, status }));
      }
    } catch (e) {
      setMessageType('error');
      setMessage(e.response?.data?.message || "Failed to update status");
    }
  };

  const addRxRow = () => {
    setConsult((c) => ({
      ...c,
      prescriptions: [...(c.prescriptions || []), { medicine: "", dosage: "", instructions: "" }],
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
      <Box sx={{ width: 240, bgcolor: "#0d47a1", color: "#fff", p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>MediTrack</Typography>
        <List>
          <ListItemButton selected={menu==='dashboard'} onClick={() => setMenu('dashboard')}>
            <ListItemIcon sx={{ color: "#fff" }}><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton selected={menu==='patients'} onClick={() => setMenu('patients')}>
            <ListItemIcon sx={{ color: "#fff" }}><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Patients" />
          </ListItemButton>
          <ListItemButton selected={menu==='prescriptions'} onClick={() => setMenu('prescriptions')}>
            <ListItemIcon sx={{ color: "#fff" }}><MedicationIcon /></ListItemIcon>
            <ListItemText primary="Prescriptions" />
          </ListItemButton>
          <ListItemButton selected={menu==='lab-reports'} onClick={() => setMenu('lab-reports')}>
            <ListItemIcon sx={{ color: "#fff" }}><ScienceIcon /></ListItemIcon>
            <ListItemText primary="Lab Reports" />
          </ListItemButton>
          <ListItemButton selected={menu==='history'} onClick={() => setMenu('history')}>
            <ListItemIcon sx={{ color: "#fff" }}><HistoryIcon /></ListItemIcon>
            <ListItemText primary="History" />
          </ListItemButton>
        </List>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* Top bar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#ffffff", color: "#0d47a1", borderBottom: "1px solid #eaeef4" }}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between", flexWrap: 'wrap', gap: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <TextField type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
              <Button startIcon={<RefreshIcon />} variant="outlined" size="small" onClick={loadVisits}>Refresh</Button>
              <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", sm: "block" } }} />
              <Stack direction="row" spacing={1}>
                <Chip label={`Open: ${counts.open}`} color="info" size="small" />
                <Chip label={`Completed: ${counts.closed}`} color="success" size="small" />
                <Chip label={`Cancelled: ${counts.cancelled}`} size="small" />
                <Chip label={`No-show: ${counts["no-show"]}`} color="warning" size="small" />
              </Stack>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ color: "#455a64" }}>{doctorName}</Typography>
              <Button startIcon={<LogoutIcon />} variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3, minWidth: 0 }}>
          {menu === 'dashboard' && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: 'stretch', minWidth: 0 }}>
            {/* Today’s Appointments */}
            <Paper sx={{ p: 2, flex: 1, borderRadius: 2, minWidth: 0, overflow: 'hidden' }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: "#0d47a1", fontWeight: 600 }}>
                Today’s Appointments
              </Typography>
              <Box sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Token</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Age/Gender</TableCell>
                    <TableCell>Slot</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
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
                      <TableCell sx={{ fontWeight: 700 }}>{v.tokenNumber}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ bgcolor: "#90caf9", width: 28, height: 28 }}>
                            {(v.patientId?.firstName || "?")[0]}
                          </Avatar>
                          <Box>
                            <div style={{ fontWeight: 600 }}>
                              {v.patientId?.firstName} {v.patientId?.lastName}
                            </div>
                            <div style={{ color: "#78909c", fontSize: 12 }}>OP: {v.opNumber}</div>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {v.patientId?.age || "-"} / {v.patientId?.gender || "-"}
                      </TableCell>
                      <TableCell>
                        {v.slot?.startTime && v.slot?.endTime ? `${v.slot.startTime} - ${v.slot.endTime}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={v.status}
                          color={v.status === "open" ? "info" : v.status === "closed" ? "success" : v.status === "no-show" ? "warning" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" variant="outlined" startIcon={<PlayCircleOutlineIcon />} onClick={() => selectVisit(v)}>
                            Start
                          </Button>
                          <Button size="small" variant="outlined" color="success" startIcon={<DoneAllIcon />} onClick={() => updateVisitStatus(v._id, "closed")} disabled={v.status !== "open"}>
                            Complete
                          </Button>
                          <Button size="small" variant="outlined" color="warning" startIcon={<DoNotDisturbAltIcon />} onClick={() => updateVisitStatus(v._id, "no-show")} disabled={v.status !== "open"}>
                            No-show
                          </Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => updateVisitStatus(v._id, "cancelled")} disabled={v.status === "cancelled"}>
                            Cancel
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visits.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6}>No visits for selected date.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </Box>
              {message && (
                <Typography sx={{ mt: 2, fontWeight: 600 }} color={messageType === 'success' ? 'success' : 'error'}>
                  {message}
                </Typography>
              )}
            </Paper>

            {/* Consultation Panel */}
            <Paper sx={{ p: 2, flex: 1, borderRadius: 2, minWidth: 0 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: "#0d47a1", fontWeight: 600 }}>
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
                    <Stack spacing={2}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <AssignmentIcon color="primary" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Chief Complaints</Typography>
                        </Stack>
                        <TextField placeholder="Enter chief complaints" multiline minRows={3} value={consult.chiefComplaints} onChange={(e) => setConsult({ ...consult, chiefComplaints: e.target.value })} fullWidth />
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <MedicalInformationIcon color="primary" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Diagnosis</Typography>
                        </Stack>
                        {/* Diagnosis autocomplete can be added later; using free text for now */}
                        <TextField placeholder="Search/add diagnosis" value={consult.diagnosis} onChange={(e) => setConsult({ ...consult, diagnosis: e.target.value })} fullWidth />
                      </Paper>

                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <HealingIcon color="primary" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Treatment Plan</Typography>
                        </Stack>
                        <TextField placeholder="Outline treatment plan" multiline minRows={3} value={consult.treatmentPlan} onChange={(e) => setConsult({ ...consult, treatmentPlan: e.target.value })} fullWidth />
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
                              sx={{ minWidth: 160, flexShrink: 0 }}
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
                      variant="outlined"
                      onClick={() => activeVisit && updateVisitStatus(activeVisit._id, "closed")}
                      disabled={activeVisit?.status !== "open"}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Mark Completed
                    </Button>
                  </Stack>
                </>
              )}
            </Paper>
          </Stack>
          )}

          {menu === 'lab-reports' && (
            <DoctorLabReportsPanel />
          )}
        </Box>
      </Box>
    </Box>
  );
}