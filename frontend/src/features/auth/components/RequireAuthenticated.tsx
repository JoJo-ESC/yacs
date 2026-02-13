import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function RequireAuthenticated() {
  const { isAuthenticated, isGuest } = useAuth();

  if (isAuthenticated) {
    return <Outlet />;
  }

  if (isGuest) {
    return <Navigate to="/app" replace />;
  }

  return <Navigate to="/" replace />;
}
