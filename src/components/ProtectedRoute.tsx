import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "moderator" | "user";
  staffOnly?: boolean;
}

export function ProtectedRoute({ children, requiredRole, staffOnly }: Props) {
  const { user, role, loading, isStaff } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (staffOnly && !isStaff) return <Navigate to="/dashboard" replace />;
  if (requiredRole && role !== requiredRole && role !== "admin") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
