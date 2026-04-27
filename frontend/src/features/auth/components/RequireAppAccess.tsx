import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function RequireAppAccess() {
  const { isAuthenticated, isGuest } = useAuth();

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
