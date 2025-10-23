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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles?.length) {
    const userRole = user?.role || user?.type;
    if (!userRole || !roles.includes(userRole)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
