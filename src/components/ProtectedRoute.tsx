import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: ReactNode;
  requireRoles?: AppRole[]; // if set, user must have at least one
}

export const ProtectedRoute = ({ children, requireRoles }: Props) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (requireRoles && !requireRoles.some((r) => roles.includes(r))) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
