import { Navigate } from "react-router-dom";

import { FullScreenSpinner } from "@/components/common/FullScreenSpinner";
import { LandingHero } from "@/components/landing/LandingHero";
import { useAuth } from "@/providers/AuthProvider";

export const LandingPage = () => {
  const { status } = useAuth();

  if (status === "loading") {
    return <FullScreenSpinner />;
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingHero />;
};
