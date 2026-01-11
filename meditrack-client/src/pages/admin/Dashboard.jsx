// src/pages/admin/Dashboard.jsx
import React, { useState } from "react";
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Toolbar, AppBar, Button, Avatar, Stack } from "@mui/material";
import { Link, Outlet, useNavigate } from "react-router-dom";
import TaskAllocation from "./TaskAllocation";

import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssignmentIcon from '@mui/icons-material/Assignment';

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [activeMenu, setActiveMenu] = useState(null);

  // ==== LOGOUT ====
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
            background: 'linear-gradient(180deg, #0D47A1 0%, #1565C0 100%)',
            color: '#fff',
            borderRight: 'none'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.3 }}>MediTrack</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>Admin Panel</Typography>
        </Box>
        <List>
          <ListItem button component={Link} to="add-staff" onClick={() => setActiveMenu(null)}>
            <ListItemIcon sx={{ color: '#fff' }}><GroupAddIcon /></ListItemIcon>
            <ListItemText primary="Add Staff" />
          </ListItem>
          <ListItem button component={Link} to="staff" onClick={() => setActiveMenu(null)}>
            <ListItemIcon sx={{ color: '#fff' }}><PeopleAltIcon /></ListItemIcon>
            <ListItemText primary="Manage Staff" />
          </ListItem>
          <ListItem button component={Link} to="shift-management" onClick={() => setActiveMenu(null)}>
            <ListItemIcon sx={{ color: '#fff' }}><ScheduleIcon /></ListItemIcon>
            <ListItemText primary="Shift Management" />
          </ListItem>
          <ListItem button component={Link} to="departments" onClick={() => setActiveMenu(null)}>
            <ListItemIcon sx={{ color: '#fff' }}><CorporateFareIcon /></ListItemIcon>
            <ListItemText primary="Departments" />
          </ListItem>
          <ListItem button component={Link} to="services" onClick={() => setActiveMenu(null)}>
            <ListItemIcon sx={{ color: '#fff' }}><MiscellaneousServicesIcon /></ListItemIcon>
            <ListItemText primary="Services" />
          </ListItem>
          <ListItem button component={Link} to="doctors" onClick={() => setActiveMenu(null)}>
            <ListItemIcon sx={{ color: '#fff' }}><LocalHospitalIcon /></ListItemIcon>
            <ListItemText primary="Doctors" />
          </ListItem>
          <ListItem button onClick={() => setActiveMenu('tasks')} sx={{ backgroundColor: activeMenu === 'tasks' ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
            <ListItemIcon sx={{ color: '#fff' }}><AssignmentIcon /></ListItemIcon>
            <ListItemText primary="Task Allocation" />
          </ListItem>
          <ListItem button component={Link} to="reports" onClick={() => setActiveMenu(null)}>
            <ListItemIcon sx={{ color: '#fff' }}><AssessmentIcon /></ListItemIcon>
            <ListItemText primary="Reports" />
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
              <Typography variant="body2" sx={{ color: '#37474F' }}>Welcome {user?.name || 'Admin'} </Typography>
              <Button variant="outlined" color="inherit" onClick={handleLogout}>Logout</Button>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {activeMenu === 'tasks' ? (
            <TaskAllocation />
          ) : (
            <Outlet />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default Dashboard;
