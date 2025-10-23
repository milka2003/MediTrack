// src/pages/pharmacy/Dashboard.jsx
import React from 'react';
import { Box, Drawer, List, ListItem, ListItemText, Typography, Toolbar, AppBar, Button } from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function PharmacyDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 220,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 220,
            boxSizing: 'border-box',
            backgroundColor: '#1976d2',
            color: 'white',
          },
        }}
      >
        <Toolbar />
        <Typography variant="h6" sx={{ p: 2, textAlign: 'center', fontWeight: 'bold' }}>
          Pharmacy
        </Typography>
        <List>
          <ListItem button component={Link} to="prescriptions">
            <ListItemText primary="Prescriptions" />
          </ListItem>
          <ListItem button component={Link} to="medicine-master">
            <ListItemText primary="Medicine Master" />
          </ListItem>
          <ListItem button component={Link} to="reports">
            <ListItemText primary="Reports" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1 }}>
        {/* Top Bar */}
        <AppBar position="static" color="primary">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Pharmacy Dashboard – Welcome {user?.name || 'Pharmacist'}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>Logout</Button>
          </Toolbar>
        </AppBar>

        {/* Nested pages */}
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}