// src/pages/pharmacy/MedicineMaster.jsx
import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';
import AddMedicine from './AddMedicine';
import MedicineList from './MedicineList';

export default function MedicineMaster() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <AddMedicine onSaved={() => setRefreshKey(k => k + 1)} />
        <Box sx={{ flex: 1 }} key={refreshKey}>
          <MedicineList />
        </Box>
      </Stack>
    </Box>
  );
}