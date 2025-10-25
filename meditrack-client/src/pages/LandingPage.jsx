
import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

import logoWithName from '../assets/logo1.jpg';
import hospitalBg from '../assets/hospital.jpg';

function LandingPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        backgroundImage: `url(${hospitalBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Soft gradient overlay for readability */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.65))',
          zIndex: 1,
        }}
      />

      {/* Centered hero card */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          px: 2,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: '100%',
            maxWidth: 540,
            textAlign: 'center',
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(255,255,255,0.92)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
          }}
        >
          {/* Hospital logo/name */}
          <Box
            component="img"
            src={logoWithName}
            alt="Hospital Logo and Name"
            loading="lazy"
            sx={{
              width: '100%',
              maxWidth: 440,
              height: 'auto',
              borderRadius: 1,
              mb: 2,
              mx: 'auto',
              display: 'block',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              backgroundColor: '#fff',
              p: 1,
            }}
          />

          {/* Tagline (edit to your preference) */}
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
            Caring for you with compassion and excellence
          </Typography>

          {/* Login buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            {/* Staff Login button */}
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="large"
              sx={{
                borderRadius: 10,
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                boxShadow: '0 8px 18px rgba(25,118,210,.30)',
                transition: 'transform .15s ease, box-shadow .2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 12px 26px rgba(25,118,210,.38)',
                },
              }}
            >
              Staff Login
            </Button>
            
            {/* Patient Portal button */}
            <Button
              component={Link}
              to="/patient-login"
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 10,
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                borderColor: '#1976d2',
                color: '#1976d2',
                transition: 'transform .15s ease, box-shadow .2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(25,118,210,.20)',
                  borderColor: '#1565C0',
                  backgroundColor: 'rgba(25,118,210,0.04)',
                },
              }}
            >
              Patient Portal
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default LandingPage;