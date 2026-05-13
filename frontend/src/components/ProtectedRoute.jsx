import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, user, requiredRole }) {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }
  return children;
}