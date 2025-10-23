// src/components/Header.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left: Logo or Title */}
        <Typography variant="h6" component={Link} to="/" 
          sx={{ textDecoration: 'none', color: 'white', fontWeight: 'bold' }}>
          MediTrack
        </Typography>

        {/* Right: Navigation */}
        <Box>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/login">Login</Button>
          
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
