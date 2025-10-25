// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");
  const user = (() => {
    try {
      return userRaw ? JSON.parse(userRaw) : null;
    } catch (error) {
      console.warn("Failed to parse user info", error);
      return null;
    }
  })();

  // Check if token exists
  if (!token) {
    // Redirect to appropriate login page based on required role
    if (roles?.includes("Patient")) {
      return <Navigate to="/patient-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (roles?.length) {
    const userRole = user?.role || user?.type;
    if (!userRole || !roles.includes(userRole)) {
      // Redirect to appropriate login page based on required role
      if (roles?.includes("Patient")) {
        return <Navigate to="/patient-login" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
