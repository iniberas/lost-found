import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children, user, requiredRole }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/admin/auth" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/admin/home" replace />;
  }

  return children;
}