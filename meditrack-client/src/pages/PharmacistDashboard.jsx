// src/pages/PharmacistDashboard.jsx
import React, { useState } from "react";
import { Box, Typography, Paper, Stack, Button } from "@mui/material";
import AddMedicine from "./pharmacy/AddMedicine";
import MedicineList from "./pharmacy/MedicineList";
import PendingPrescriptions from "./pharmacy/PendingPrescriptions";

export default function PharmacistDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSaved = () => setRefreshKey((k) => k + 1);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Pharmacist Dashboard</Typography>
        <Button variant="outlined" onClick={handleLogout}>Logout</Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box sx={{ flex: 1 }}>
          <PendingPrescriptions />
        </Box>
        <AddMedicine onSaved={handleSaved} />
        <Box sx={{ flex: 1 }} key={refreshKey}>
          <MedicineList />
        </Box>
      </Stack>
    </Box>
  );
}
