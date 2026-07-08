import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout } from "../components/layout/ProtectedLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AuthGuard } from "./AuthGuard";

/**
 * Árvore de rotas do app: `/login` é pública; tudo dentro do `AuthGuard` é
 * protegido (hoje sempre acessível — ver `AuthGuard`) e renderizado dentro
 * do shell de layout (`ProtectedLayout`).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
