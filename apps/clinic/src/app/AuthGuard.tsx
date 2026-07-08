import { Navigate, Outlet } from "react-router-dom";

/**
 * Guard das rotas protegidas — placeholder (PSI-012 entrega só o scaffold de
 * navegação, sem autenticação real).
 *
 * Hoje SEMPRE permite o acesso. Ponto de extensão explícito para quando a
 * tarefa de autenticação for implementada, ex.:
 *
 *   const session = useSession(); // ou equivalente
 *   if (!session) return <Navigate to="/login" replace />;
 *   return <Outlet />;
 *
 * Ver `tasks/PSI-012.yaml` (open_questions) para o mecanismo de auth a
 * integrar, ainda a definir em tarefa futura.
 */
export function AuthGuard() {
  // TODO(auth): substituir pela checagem real de sessão/token.
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
