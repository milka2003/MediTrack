import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";
import axios from "axios";

function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/auth/change-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // After success → go to login again
      alert("Password updated successfully. Please login with your new password.");
      localStorage.removeItem("token"); // clear old token
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Paper elevation={6} sx={{ p: 4, maxWidth: 400, width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleChangePassword}>
          <TextField
            type="password"
            label="New Password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, py: 1.2 }}
          >
            Update Password
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default ChangePassword;
