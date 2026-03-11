// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  PersonOutline,
  LockOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import axios from "axios";
import loginBg from "../assets/loginbg.jpg";

function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        backgroundRepeat: "no-repeat",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)", // Optional overlay for better text contrast
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          maxWidth: 450,
          width: "90%",
          textAlign: "center",
          borderRadius: 4,
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)",
          backgroundColor: "rgba(255, 255, 255, 0.95)", // Slightly transparent paper
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: "600", mb: 1.5, color: "#111827" }}
        >
          Staff Login
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, color: "#6b7280" }}
        >
          Enter your credentials to access the system
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleLogin}>
          <Box sx={{ textAlign: "left", mb: 2.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.8, fontWeight: "500", color: "#374151" }}
            >
              Username
            </Typography>
            <TextField
              variant="outlined"
              fullWidth
              placeholder="Enter your username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline sx={{ color: "#9ca3af", fontSize: "1.2rem" }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, height: "48px" },
              }}
            />
          </Box>

          <Box sx={{ textAlign: "left", mb: 3.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.8, fontWeight: "500", color: "#374151" }}
            >
              Password
            </Typography>
            <TextField
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: "#9ca3af", fontSize: "1.2rem" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffOutlined sx={{ color: "#9ca3af", fontSize: "1.2rem" }} />
                      ) : (
                        <VisibilityOutlined sx={{ color: "#9ca3af", fontSize: "1.2rem" }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, height: "48px" },
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              py: 1.6,
              borderRadius: 2,
              backgroundColor: "#2563eb", // Vibrant blue
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: "600",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#1d4ed8",
                boxShadow: "none",
              },
            }}
          >
            Sign In
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginPage;
