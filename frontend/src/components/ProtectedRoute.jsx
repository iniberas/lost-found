import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, user, requiredRole }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  return children;
}