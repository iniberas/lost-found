import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({ children, admin, requiredRole }) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/admin/auth" replace />;
  }

  if (!admin) {
    return <Navigate to="/admin/auth" replace />;
  }

  if (requiredRole && admin?.role !== requiredRole && admin?.role !== "superadmin") {
    return <Navigate to="/admin/home" replace />;
  }

  return children;
}