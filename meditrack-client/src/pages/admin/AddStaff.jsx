// src/pages/admin/AddStaff.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import axios from "axios";

function AddStaff() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Reception");
  const [message, setMessage] = useState("");

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/admin/add-staff",
        { name, username, email, role },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(
        `✅ Staff created! Username: ${res.data.staff.username}, Temp Password: ${res.data.tempPassword}`
      );

      setName("");
      setUsername("");
      setEmail("");
      setRole("Reception");
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Error adding staff");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper elevation={4} sx={{ p: 4, maxWidth: 720, mx: 'auto', borderRadius: 3, bgcolor: '#ffffff' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0D47A1' }}>
          Add New Staff
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create accounts for hospital staff. Temporary password will be generated automatically.
        </Typography>

        {message && (
          <Typography color="primary" sx={{ mb: 2 }}>
            {message}
          </Typography>
        )}

        <form onSubmit={handleAddStaff}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
              <MenuItem value="Reception">Reception</MenuItem>
              <MenuItem value="Doctor">Doctor</MenuItem>
              <MenuItem value="Nurse">Nurse</MenuItem>
              <MenuItem value="Lab">Lab</MenuItem>
              <MenuItem value="Pharmacist">Pharmacist</MenuItem>
              <MenuItem value="Billing">Billing</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
          </Box>

          <Button type="submit" variant="contained" sx={{ mt: 3, px: 3, py: 1.2, borderRadius: 2, bgcolor: '#1565C0' }}>
            Add Staff
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default AddStaff;
