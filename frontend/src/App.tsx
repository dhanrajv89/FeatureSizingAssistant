import { Route, Routes } from "react-router-dom";

import { DashboardPage } from "@/pages/DashboardPage";
import { EstimateDetailPage } from "@/pages/EstimateDetailPage";
import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/estimates/:estimateId" element={<EstimateDetailPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);
