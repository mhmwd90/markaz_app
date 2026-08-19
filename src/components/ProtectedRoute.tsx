import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FullSpinner } from "@/components/ui";
import type { UserRole } from "@/lib/types";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullSpinner label="Loading your session…" />;

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  if (session && !profile) {
    return <FullSpinner label="Loading your profile…" />;
  }

  return <>{children}</>;
}
