import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Toolbar, 
  AppBar, 
  Button, 
  Avatar, 
  Stack 
} from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import ScienceIcon from '@mui/icons-material/Science';
import MedicationIcon from '@mui/icons-material/Medication';
import ReceiptIcon from '@mui/icons-material/Receipt';

function PatientDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/patient-login');
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
            background: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 100%)',
            color: '#fff',
            borderRight: 'none'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>MediTrack</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Patient Portal</Typography>
        </Box>
        <List>
          <ListItem button component={Link} to="">
            <ListItemIcon sx={{ color: '#fff' }}><PersonIcon /></ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItem>
          <ListItem button component={Link} to="visits">
            <ListItemIcon sx={{ color: '#fff' }}><HistoryIcon /></ListItemIcon>
            <ListItemText primary="Visit History" />
          </ListItem>
          <ListItem button component={Link} to="lab-reports">
            <ListItemIcon sx={{ color: '#fff' }}><ScienceIcon /></ListItemIcon>
            <ListItemText primary="Lab Reports" />
          </ListItem>
          <ListItem button component={Link} to="prescriptions">
            <ListItemIcon sx={{ color: '#fff' }}><MedicationIcon /></ListItemIcon>
            <ListItemText primary="Prescriptions" />
          </ListItem>
          <ListItem button component={Link} to="bills">
            <ListItemIcon sx={{ color: '#fff' }}><ReceiptIcon /></ListItemIcon>
            <ListItemText primary="Bills & Payments" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', color: '#0D47A1', borderBottom: '1px solid #eaeef4' }}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar src={require('../../assets/logo1.jpg')} variant="rounded" sx={{ width: 36, height: 36 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0D47A1' }}>Holy Cross Hospital</Typography>
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ color: '#37474F' }}>Welcome {user?.name || 'Patient'} </Typography>
              <Button variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default PatientDashboard;