// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";
import axios from "axios";
import loginBg from "../assets/login1.jpg";

function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!identifier.trim() || !password.trim()) {
        return setError("Username/Email and Password are required");
      }
      const res = await axios.post("http://localhost:5000/api/auth/staff-login", {
        identifier: identifier.trim(),
        password: password.trim(),
      });

      // Save token & user info in localStorage
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Role-based redirection
      const role = res.data.user.role;

      if (res.data.requirePasswordChange) {
        navigate("/change-password"); // if temp password → force reset
      } else if (role === "Admin") {
        navigate("/dashboard"); 
      } else if (role === "Reception") {
        navigate("/reception-dashboard");
      } else if (role === "Pharmacist") {
        navigate("/pharmacy");
      } else if (role === "Lab") {
        navigate("/lab-dashboard");
      } else if (role === "Doctor") {
        navigate("/doctor-dashboard");
      } else if (role === "Nurse") {
        navigate("/nurse-dashboard");
      } else if (role === "Billing") {
        navigate("/billing-dashboard");
      } else {
        setError("Unauthorized role");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{ p: 4, maxWidth: 400, width: "100%", textAlign: "center" }}
      >
        <Typography variant="h5" gutterBottom>
          Staff Login
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            label="Username or Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!identifier.trim() || !password.trim()}
            sx={{ mt: 2, py: 1.2 }}
          >
            Login
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginPage;
