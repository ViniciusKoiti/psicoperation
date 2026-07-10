import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout } from "../components/layout/ProtectedLayout";
import { AgendaPage } from "../features/agenda/AgendaPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { PatientDetailPage } from "../features/patients/PatientDetailPage";
import { PatientFormPage } from "../features/patients/PatientFormPage";
import { PatientsListPage } from "../features/patients/PatientsListPage";
import { AuthGuard } from "./AuthGuard";

/**
 * Árvore de rotas do app: `/login` e `/registrar` são públicas; tudo dentro
 * do `AuthGuard` é protegido — redireciona para `/login` sem sessão
 * autenticada (ver `AuthGuard`). `/onboarding` (PSI-031) fica protegida mas
 * fora do `ProtectedLayout`: é um wizard de tela cheia, sem o shell de
 * navegação (sidebar/topbar), no mesmo espírito de `/login`/`/registrar`.
 * `RegisterPage` navega para cá logo após criar a conta; a própria página
 * redireciona ao dashboard quando o onboarding já está concluído.
 *
 * `/pacientes` (PSI-033): lista de pacientes com o shell padrão. Cadastro e
 * edição usam o mesmo componente (`PatientFormPage`) em `/pacientes/novo` e
 * `/pacientes/:patientId/editar`, também dentro do shell (diferente do
 * onboarding: aqui é uma feature de domínio recorrente, não um wizard único).
 * `/pacientes/:patientId` (PSI-034): detalhe do paciente, acessado a partir
 * da lista — a edição continua em `/pacientes/:patientId/editar`, reutilizada
 * pelo detalhe via link (não há conflito de rota: react-router prioriza o
 * segmento estático "editar" sobre `:patientId` sozinho).
 *
 * `/agenda` (PSI-035): visões semanal e diária de consultas (criar,
 * remarcar, cancelar, série recorrente semanal simples), também dentro do
 * shell padrão.
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
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/pacientes" element={<PatientsListPage />} />
          <Route path="/pacientes/novo" element={<PatientFormPage />} />
          <Route path="/pacientes/:patientId/editar" element={<PatientFormPage />} />
          <Route path="/pacientes/:patientId" element={<PatientDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
