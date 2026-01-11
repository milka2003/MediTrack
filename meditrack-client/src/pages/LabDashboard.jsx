// src/pages/LabDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack,
  Chip, Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Drawer, Toolbar, AppBar, Avatar, Card, CardContent, Grid, Container, Alert
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Psychology as PsychologyIcon,
  Logout as LogoutIcon,
  Pending as PendingIcon,
  Done as DoneIcon,
  TrendingUp as TrendingIcon,
  Science as ScienceIcon
} from "@mui/icons-material";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

export default function LabDashboard() {
  const [pending, setPending] = useState([]);
  const [query, setQuery] = useState({ opNumber: "", date: "" });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const [staffId, setStaffId] = useState(null);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const [selected, setSelected] = useState(null); // { consultationId, itemIndex, ... }
  const [resultForm, setResultForm] = useState({
    parameterResults: [],
    overallRemarks: "",
    summaryResult: ""
  });

  const loadPending = async () => {
    try {
      const { data } = await api.get("/lab/pending");
      setPending(data.pending || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load pending");
    }
  };

  const loadTasks = async (id) => {
    try {
      const { data } = await api.get(`/tasks/staff/${id}`);
      setTasks(data.tasks || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load tasks");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setMessage("Task status updated successfully");
      await loadTasks(staffId);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to update task status");
    }
  };

  const saveResult = async () => {
    if (!selected) return;
    try {
      await api.put(`/lab/${selected.consultationId}/result`, {
        itemIndex: selected.itemIndex,
        parameterResults: resultForm.parameterResults,
        overallRemarks: resultForm.overallRemarks,
        summaryResult: resultForm.summaryResult
      });
      setMessage("Result saved");
      setSelected(null);
      setResultForm({
        parameterResults: [],
        overallRemarks: "",
        summaryResult: ""
      });
      await loadPending();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to save result");
    }
  };

  const markCollected = async (row) => {
    try {
      await api.post(`/lab/${row.consultationId}/collect-sample`, { itemIndex: row.itemIndex });
      setMessage("Sample marked collected");
      await loadPending();
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to update sample collection");
    }
  };

  const searchHistory = async () => {
    if (!query.opNumber) return setMessage("Enter OP number");
    try {
      const { data } = await api.get(`/lab/patient/${query.opNumber}`);
      setHistory(data.history || []);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load history");
    }
  };

  useEffect(() => {
    loadPending();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const id = user._id || user.id;
    if (id) {
      setStaffId(id);
      loadTasks(id);
    }
  }, []);

  const openDialog = async (row) => {
    setSelected(row);
    try {
      // Load test details to get parameters
      const { data } = await api.get(`/lab-tests/${row.testId}`);

      // Initialize parameterResults if not exists
      const existingResults = row.parameterResults || [];
      const parameterResults = data.test.parameters.map((param, index) => {
        const existing = existingResults.find(r => r.parameterName === param.name);
        return existing || {
          parameterName: param.name,
          value: "",
          unit: param.unit,
          referenceRange: param.referenceRange,
          valueType: param.valueType,
          isAbnormal: false,
          remarks: ""
        };
      });

      setResultForm({
        parameterResults,
        overallRemarks: row.overallRemarks || "",
        summaryResult: row.summaryResult || ""
      });
    } catch (e) {
      const errorMsg = e.response?.status === 404
        ? "Test not found - it may have been deleted"
        : (e.response?.data?.message || "Failed to load test parameters");
      setMessage(errorMsg);
    }
  };

  const closeDialog = () => {
    setSelected(null);
    setResultForm({
      parameterResults: [],
      overallRemarks: "",
      summaryResult: ""
    });
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      window.location.href = '/login';
    }
  };

  const navigate = useNavigate();

  const updateParameterResult = (index, field, value) => {
    setResultForm(prev => ({
      ...prev,
      parameterResults: prev.parameterResults.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      )
    }));

    // Auto-determine abnormality for numeric values
    if (field === 'value' && resultForm.parameterResults[index]?.valueType === 'numeric') {
      const referenceRange = resultForm.parameterResults[index]?.referenceRange;
      if (referenceRange && value) {
        const isAbnormal = checkAbnormality(value, referenceRange);
        setResultForm(prev => ({
          ...prev,
          parameterResults: prev.parameterResults.map((r, i) =>
            i === index ? { ...r, isAbnormal } : r
          )
        }));
      }
    }
  };

  const checkAbnormality = (value, referenceRange) => {
    // Simple range check: e.g., "70-100" or "< 100" or "> 50"
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;

    const range = referenceRange.trim();
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(v => parseFloat(v.trim()));
      return numValue < min || numValue > max;
    } else if (range.startsWith('<')) {
      const max = parseFloat(range.substring(1).trim());
      return numValue >= max;
    } else if (range.startsWith('>')) {
      const min = parseFloat(range.substring(1).trim());
      return numValue <= min;
    }
    return false;
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateParameterResult(index, 'value', data.fileUrl);
    } catch (e) {
      setMessage('File upload failed');
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
      setMessage('Failed to download report');
    }
  };

  const DRAWER_WIDTH = 260;
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, key: 'dashboard' },
    { label: 'Allocated Tasks', icon: <AssignmentIcon />, key: 'tasks' },
    { label: 'Lab Test Master', icon: <ScienceIcon />, key: 'tests' },
    { label: 'Pending Reports', icon: <PendingIcon />, key: 'pending' },
    { label: 'Completed Reports', icon: <CheckCircleIcon />, key: 'completed' },
    { label: 'ML Models', icon: <PsychologyIcon />, key: 'ml' }
  ];

  const statsData = [
    { label: 'Pending Tests', value: pending.length, icon: <PendingIcon sx={{ fontSize: 32 }} />, color: '#FF9800' },
    { label: 'Completed Today', value: pending.filter(p => p.status === 'Completed').length, icon: <DoneIcon sx={{ fontSize: 32 }} />, color: '#4CAF50' },
    { label: 'Active Tasks', value: tasks.filter(t => t.status === 'In Progress').length, icon: <TrendingIcon sx={{ fontSize: 32 }} />, color: '#2196F3' },
    { label: 'Lab Staff', value: 1, icon: <ScienceIcon sx={{ fontSize: 32 }} />, color: '#9C27B0' }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fb' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #6B46C1 0%, #7C3AED 100%)',
            color: '#fff',
            borderRight: 'none'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>MediTrack</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Lab Module</Typography>
        </Box>
        <List>
          {menuItems.map((item) => {
            let onClick;
            let isSelected = false;

            if (item.key === 'dashboard' || item.key === 'tasks') {
              onClick = () => setActiveMenu(item.key);
              isSelected = activeMenu === item.key;
            } else if (item.key === 'tests') {
              onClick = () => navigate('/lab-dashboard/tests');
            } else if (item.key === 'pending') {
              onClick = () => navigate('/lab-dashboard/reports/pending');
            } else if (item.key === 'completed') {
              onClick = () => navigate('/lab-dashboard/reports/completed');
            } else if (item.key === 'ml') {
              onClick = () => navigate('/ml-dashboard');
            }

            return (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  onClick={onClick}
                  selected={isSelected}
                  sx={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <List sx={{ mt: 'auto' }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <ListItemIcon sx={{ color: '#fff' }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', color: '#6B46C1', borderBottom: '1px solid #eaeef4' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar src={require('../assets/logo1.jpg')} variant="rounded" sx={{ width: 36, height: 36 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#6B46C1' }}>Holy Cross Hospital</Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ color: '#37474F' }}>Welcome {user?.name || 'Lab Staff'}</Typography>
              <Button variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
          {message && (
            <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>
          )}

          {activeMenu === 'dashboard' && (
            <>
              {/* Stat Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {statsData.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                        border: `1px solid ${stat.color}30`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                              {stat.label}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                              {stat.value}
                            </Typography>
                          </Box>
                          <Box sx={{ color: stat.color, opacity: 0.3 }}>
                            {stat.icon}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pending Tests */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PendingIcon sx={{ mr: 1, color: '#FF9800' }} />
                  Pending Tests
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Token</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Visit ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pending.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#999' }}>No pending tests</TableCell>
                      </TableRow>
                    ) : (
                      pending.map((r) => (
                        <TableRow key={`${r.consultationId}-${r.itemIndex}`} hover>
                          <TableCell><Chip label={r.tokenNumber || '-'} size="small" variant="outlined" /></TableCell>
                          <TableCell>{r.visitId}</TableCell>
                          <TableCell>{r.patient?.name} ({r.patient?.opNumber})</TableCell>
                          <TableCell>{r.doctor?.name}</TableCell>
                          <TableCell>{r.testName}</TableCell>
                          <TableCell>
                            <Chip
                              label={r.status}
                              size="small"
                              color={r.status === 'Completed' ? 'success' : r.status === 'Sample Collected' ? 'info' : 'warning'}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Button size="small" variant="outlined" onClick={() => markCollected(r)} disabled={r.status !== 'Pending'}>
                                Collect
                              </Button>
                              <Button size="small" variant="outlined" onClick={() => openDialog(r)} disabled={r.status === 'Completed'}>
                                Result
                              </Button>
                              {r.status === 'Completed' && (
                                <Button size="small" variant="contained" color="success" onClick={() => downloadReport(r.consultationId, r.itemIndex)}>
                                  Report
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>

              {/* History Search */}
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Search Results History</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <TextField
                    label="OP Number"
                    value={query.opNumber}
                    onChange={(e) => setQuery({ ...query, opNumber: e.target.value })}
                    size="small"
                    sx={{ minWidth: 200 }}
                  />
                  <Button variant="contained" onClick={searchHistory} sx={{ bgcolor: '#6B46C1' }}>Search</Button>
                </Stack>

                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Visit</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Doctor</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Tests</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: '#999' }}>No results</TableCell>
                      </TableRow>
                    ) : (
                      history.map((h) => (
                        <TableRow key={h.id} hover>
                          <TableCell>{h.visitId}</TableCell>
                          <TableCell>{h.patient?.name} ({h.patient?.opNumber})</TableCell>
                          <TableCell>{h.doctor?.name}</TableCell>
                          <TableCell>
                            {h.labRequests?.map((lr, i) => (
                              <Box key={i} sx={{ mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {lr.testName} 
                                  <Chip label={lr.status} size="small" sx={{ ml: 1 }} />
                                </Typography>
                                {lr.parameterResults && lr.parameterResults.length > 0 && (
                                  <Box sx={{ ml: 2, fontSize: '0.875rem' }}>
                                    {lr.parameterResults.map((pr, j) => (
                                      <Typography key={j} variant="caption" display="block">
                                        {pr.parameterName}: {pr.value || 'N/A'}
                                        {pr.isAbnormal && <Chip label="Abnormal" color="error" size="small" sx={{ ml: 1 }} />}
                                      </Typography>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}

          {/* Allocated Tasks */}
          {activeMenu === 'tasks' && (
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1, color: '#2196F3' }} />
                Allocated Tasks
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Task Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>OP Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#999' }}>No allocated tasks</TableCell>
                    </TableRow>
                  ) : (
                    tasks.map((task) => {
                      const patientName = task.relatedVisitId?.patientId
                        ? `${task.relatedVisitId.patientId.firstName} ${task.relatedVisitId.patientId.lastName}`
                        : 'Unknown';
                      const opNumber = task.relatedVisitId?.patientId?.opNumber || '-';
                      
                      return (
                        <TableRow key={task._id} hover>
                          <TableCell>
                            <Chip
                              label={task.taskType}
                              size="small"
                              color={task.taskType === 'Lab Test' ? 'primary' : 'secondary'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{task.description}</TableCell>
                          <TableCell>{patientName}</TableCell>
                          <TableCell>{opNumber}</TableCell>
                          <TableCell>
                            <Chip
                              label={task.status}
                              size="small"
                              color={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'warning' : 'default'}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {task.status === 'Pending' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => updateTaskStatus(task._id, 'In Progress')}
                                >
                                  Start
                                </Button>
                              )}
                              {task.status === 'In Progress' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => updateTaskStatus(task._id, 'Completed')}
                                >
                                  Complete
                                </Button>
                              )}
                              {task.status === 'Completed' && (
                                <Chip label="Done" size="small" icon={<CheckCircleIcon />} color="success" />
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Update Result Dialog */}
          <Dialog open={!!selected} onClose={closeDialog} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 700, color: '#6B46C1' }}>Enter Results — {selected?.testName}</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 1 }}>
                {resultForm.parameterResults.map((paramResult, index) => (
                  <Paper key={index} sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      {paramResult.parameterName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Reference Range: {paramResult.referenceRange || 'N/A'}
                    </Typography>

                    <Stack spacing={2}>
                      {paramResult.valueType === 'numeric' && (
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                          <TextField
                            label="Value"
                            type="number"
                            value={paramResult.value}
                            onChange={(e) => updateParameterResult(index, 'value', e.target.value)}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          <Typography variant="body2">Unit: {paramResult.unit}</Typography>
                          {paramResult.isAbnormal && (
                            <Chip label="Abnormal" color="error" size="small" />
                          )}
                        </Stack>
                      )}

                      {paramResult.valueType === 'text' && (
                        <TextField
                          label="Result"
                          value={paramResult.value}
                          onChange={(e) => updateParameterResult(index, 'value', e.target.value)}
                          multiline
                          minRows={2}
                          size="small"
                        />
                      )}

                      {paramResult.valueType === 'file' && (
                        <Stack spacing={1}>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(index, e.target.files[0])}
                            style={{ display: 'none' }}
                            id={`file-upload-${index}`}
                          />
                          <label htmlFor={`file-upload-${index}`}>
                            <Button variant="outlined" component="span" size="small">
                              Upload File
                            </Button>
                          </label>
                          {paramResult.value && (
                            <Typography variant="body2" color="primary">
                              File uploaded: {paramResult.value.split('/').pop()}
                            </Typography>
                          )}
                        </Stack>
                      )}

                      <TextField
                        label="Remarks"
                        value={paramResult.remarks}
                        onChange={(e) => updateParameterResult(index, 'remarks', e.target.value)}
                        size="small"
                        multiline
                        minRows={1}
                      />
                    </Stack>
                  </Paper>
                ))}

                <Divider />

                <TextField
                  label="Overall Remarks"
                  value={resultForm.overallRemarks}
                  onChange={(e) => setResultForm({ ...resultForm, overallRemarks: e.target.value })}
                  multiline
                  minRows={2}
                  size="small"
                />

                <TextField
                  label="Summary Result"
                  value={resultForm.summaryResult}
                  onChange={(e) => setResultForm({ ...resultForm, summaryResult: e.target.value })}
                  multiline
                  minRows={2}
                  size="small"
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Cancel</Button>
              <Button variant="contained" sx={{ bgcolor: '#6B46C1' }} onClick={saveResult}>Save Results</Button>
            </DialogActions>
          </Dialog>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            bgcolor: '#f5f7fb',
            borderTop: '1px solid #eaeef4',
            py: 2,
            px: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="textSecondary">
            © 2026 Holy Cross Hospital. Lab Management System. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
