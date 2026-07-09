import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout } from "../components/layout/ProtectedLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AuthGuard } from "./AuthGuard";

/**
 * Árvore de rotas do app: `/login` e `/registrar` são públicas; tudo dentro
 * do `AuthGuard` é protegido — redireciona para `/login` sem sessão
 * autenticada (ver `AuthGuard`) — e renderizado dentro do shell de layout
 * (`ProtectedLayout`).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrar" element={<RegisterPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
