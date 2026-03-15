// src/pages/NurseDashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
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
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import Footer from "../components/Footer";

// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import TodayIcon from '@mui/icons-material/Today';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';

function formatDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

const drawerWidth = 260;

export default function NurseDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [date, setDate] = useState(formatDate(new Date()));
  const [visits, setVisits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [activeVisit, setActiveVisit] = useState(null);
  const [vitalsDialog, setVitalsDialog] = useState(false);
  const [vitals, setVitals] = useState({
    bp: "",
    temperature: "",
    oxygen: "",
    weight: "",
  });
  const [markingReady, setMarkingReady] = useState(null);

  const loadVisits = useCallback(async () => {
    try {
      const { data } = await api.get(`/visits?date=${date}`);
      let filtered = data.visits || [];
      if (selectedDept) {
        filtered = filtered.filter(v => v.departmentId?._id === selectedDept || v.departmentId === selectedDept);
      }
      setVisits(filtered);
    } catch (e) {
      console.error('Nurse Dashboard - API Error:', e);
      setMessage(e.response?.data?.message || "Failed to load visits");
    }
  }, [date, selectedDept]);

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/departments");
      setDepartments(data.departments || []);
    } catch (e) {
      console.error("Failed to load departments", e);
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      navigate("/login");
      return;
    }
    loadVisits();
    loadDepartments();
  }, [date, navigate, loadVisits, loadDepartments]);

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
      setMessageType("success");
      setMessage("Vitals recorded successfully");
      setVitalsDialog(false);
      loadVisits();
    } catch (e) {
      setMessageType("error");
      setMessage(e.response?.data?.message || "Failed to save vitals");
    }
  };

  const handleMarkReady = async (visitId) => {
    try {
      setMarkingReady(visitId);
      await api.post(`/queue/visit/${visitId}/ready`);
      setMessageType("success");
      setMessage("Patient marked as ready for consultation");
      loadVisits();
    } catch (e) {
      setMessageType("error");
      setMessage(e.response?.data?.message || "Failed to mark patient as ready");
    } finally {
      setMarkingReady(null);
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a237e', color: '#fff' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#fff', color: '#1a237e' }}>
          <LocalHospitalIcon />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1 }}>
          MEDITRACK
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {[
          { text: 'Queue', icon: <TodayIcon />, path: '/nurse-dashboard' },
          { text: 'Vital Monitoring', icon: <MonitorHeartIcon />, path: '/nurse-dashboard' },
          { text: 'Task Allocation', icon: <AssignmentIcon />, path: '/nurse-dashboard' },
          { text: 'Reports', icon: <AssessmentIcon />, path: '/nurse-dashboard' },
        ].map((item, index) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
            sx={{ 
              borderRadius: 2, 
              mb: 1,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              bgcolor: index === 0 ? 'rgba(255,255,255,0.12)' : 'transparent'
            }}
          >
            <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{ borderRadius: 2, bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#ff8a80', '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' } }}
        >
          <ListItemIcon sx={{ color: '#ff8a80', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        {/* Enhanced Header */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', color: '#1a237e', borderBottom: '1px solid #e0e0e0' }}>
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 2, display: { md: 'none' } }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                  DASHBOARD <Typography component="span" variant="h6" sx={{ fontWeight: 400, color: '#666' }}>OVERVIEW</Typography>
                </Typography>
              </Stack>

              <Stack direction="row" spacing={{ xs: 1, sm: 3 }} alignItems="center">
                <Tooltip title="Notifications">
                  <IconButton size="small">
                    <NotificationsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                  <Box sx={{ textAlign: 'right', mr: 1 }}>
                    <Typography variant="body2" sx={{ color: '#1a237e', fontWeight: 700, lineHeight: 1 }}>
                      {nurseName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Registered Nurse
                    </Typography>
                  </Box>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#e3f2fd', color: '#1a237e', fontWeight: 700 }}>
                    {nurseName.charAt(0)}
                  </Avatar>
                </Box>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Statistics Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2', mr: 2, width: 56, height: 56 }}>
                  <TodayIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{visits.length}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Visits</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ bgcolor: '#fff3e0', color: '#ef6c00', mr: 2, width: 56, height: 56 }}>
                  <MonitorHeartIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{counts.Registered || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Awaiting Vitals</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', mr: 2, width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{counts.VitalsCompleted || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Vitals Done</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                <Avatar sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', mr: 2, width: 56, height: 56 }}>
                  <PendingActionsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>{counts.ReadyForConsultation || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Ready for Doctor</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Area */}
        <Paper sx={{ p: 0, borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 25px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, bgcolor: '#fff' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e' }}>Patient Queue</Typography>
              <Typography variant="caption" color="textSecondary">Manage vitals and prepare patients for consultation</Typography>
            </Box>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                select
                size="small"
                label="Department"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                sx={{ width: 200 }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                type="date"
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                sx={{ width: 170 }}
              />
              <IconButton onClick={loadVisits} color="primary" sx={{ bgcolor: '#f5f5f5' }}>
                <RefreshIcon />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ p: 2 }}>
            {message && (
              <Box sx={{ 
                mb: 2, p: 2, 
                bgcolor: messageType === 'success' ? '#e8f5e9' : '#ffebee',
                color: messageType === 'success' ? '#2e7d32' : '#c62828',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {messageType === 'success' ? <CheckCircleIcon fontSize="small" /> : <AssignmentIcon fontSize="small" />}
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{message}</Typography>
              </Box>
            )}

            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>TOKEN</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>PATIENT INFO</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>SCHEDULE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>VITALS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                      <Box sx={{ opacity: 0.5 }}>
                        <AssignmentIcon sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="body1">No appointments found for this date</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((v) => {
                    const getStatusProps = (status) => {
                      switch(status) {
                        case 'Registered': return { color: 'info', label: 'Registered' };
                        case 'VitalsCompleted': return { color: 'secondary', label: 'Vitals Done' };
                        case 'ReadyForConsultation': return { color: 'primary', label: 'Ready' };
                        case 'InConsultation': return { color: 'warning', label: 'In Visit' };
                        case 'ConsultationCompleted': return { color: 'success', label: 'Completed' };
                        case 'cancelled': return { color: 'error', label: 'Cancelled' };
                        default: return { color: 'default', label: status };
                      }
                    };
                    const sp = getStatusProps(v.status);

                    return (
                      <TableRow key={v._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e' }}>
                            #{v.tokenNumber || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1.5, fontSize: '0.875rem', bgcolor: '#f0f2f5', color: '#333' }}>
                              {v.patientId?.firstName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {v.patientId?.firstName} {v.patientId?.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {v.patientId?.gender}, {v.patientId?.age} yrs | OP: {v.opNumber}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {v.slot?.startTime || '--:--'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Today
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={sp.label} 
                            color={sp.color} 
                            size="small" 
                            sx={{ fontWeight: 600, fontSize: '0.7rem', borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {v.vitals ? (
                              <>
                                <Tooltip title={`BP: ${v.vitals.bp}, Temp: ${v.vitals.temperature}`}>
                                  <Chip label="Recorded" size="small" variant="outlined" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                                </Tooltip>
                              </>
                            ) : (
                              <Chip label="Pending" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button 
                              size="small" 
                              variant="outlined"
                              startIcon={<AssignmentIcon />}
                              onClick={() => selectVisit(v)}
                              disabled={['InConsultation', 'ConsultationCompleted', 'Completed', 'cancelled'].includes(v.status)}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                            >
                              Vitals
                            </Button>
                            {v.status === 'VitalsCompleted' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<PlayArrowIcon />}
                                onClick={() => handleMarkReady(v._id)}
                                disabled={markingReady === v._id}
                                sx={{ borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}
                              >
                                {markingReady === v._id ? '...' : 'Mark Ready'}
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Container>

      {/* Vitals Dialog */}
      <Dialog 
        open={vitalsDialog} 
        onClose={() => setVitalsDialog(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 0, pt: 3, fontWeight: 700 }}>Record Patient Vitals</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="textSecondary" sx={{ mb: 3, display: 'block' }}>
            Enter current vital signs for {activeVisit?.patientId?.firstName}
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Blood Pressure"
              placeholder="120/80"
              value={vitals.bp}
              onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
              fullWidth
              variant="filled"
            />
            <TextField
              label="Temperature"
              placeholder="98.6 F"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
              fullWidth
              variant="filled"
            />
            <TextField
              label="Oxygen Saturation (SpO2)"
              placeholder="98%"
              value={vitals.oxygen}
              onChange={(e) => setVitals({ ...vitals, oxygen: e.target.value })}
              fullWidth
              variant="filled"
            />
            <TextField
              label="Weight"
              placeholder="65 kg"
              value={vitals.weight}
              onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
              fullWidth
              variant="filled"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setVitalsDialog(false)} sx={{ color: '#666', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSaveVitals} variant="contained" sx={{ borderRadius: 2, px: 4, textTransform: 'none', bgcolor: '#1a237e' }}>Save Vitals</Button>
        </DialogActions>
      </Dialog>
      </Box>

      <Footer />
    </Box>
  );
}