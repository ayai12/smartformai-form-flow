import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading indicator while authentication is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Encode the current path to use in query parameter
    const returnTo = encodeURIComponent(location.pathname + location.search);
    // Redirect to login page while saving the attempted URL as both state and query param for robustness
    return <Navigate to={`/login?returnTo=${returnTo}`} state={{ from: location, returnTo: location.pathname }} replace />;
  }

  return <Outlet />;
}; 