import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout } from "../components/layout/ProtectedLayout";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { AuthGuard } from "./AuthGuard";

/**
 * Árvore de rotas do app: `/login` e `/registrar` são públicas; tudo dentro
 * do `AuthGuard` é protegido — redireciona para `/login` sem sessão
 * autenticada (ver `AuthGuard`). `/onboarding` (PSI-031) fica protegida mas
 * fora do `ProtectedLayout`: é um wizard de tela cheia, sem o shell de
 * navegação (sidebar/topbar), no mesmo espírito de `/login`/`/registrar`.
 * `RegisterPage` navega para cá logo após criar a conta; a própria página
 * redireciona ao dashboard quando o onboarding já está concluído.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrar" element={<RegisterPage />} />
      <Route element={<AuthGuard />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
