// src/components/Footer.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

function Footer() {
  return (
    <Box sx={{ backgroundColor: '#f5f5f5', py: 2, mt: 'auto', textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} MediTrack | All rights reserved.
      </Typography>
    </Box>
  );
}

export default Footer;
