import { Navigate, Outlet, useLocation } from "react-router-dom";

import { FullScreenSpinner } from "@/components/common/FullScreenSpinner";
import { useAuth } from "@/providers/AuthProvider";

export const ProtectedRoute = () => {
  const location = useLocation();
  const { status } = useAuth();

  if (status === "loading") {
    return <FullScreenSpinner />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
