import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSession } from "../session/SessionContext";

/**
 * Guard das rotas protegidas: redireciona para `/login` quando não há
 * sessão autenticada, preservando a rota de destino (`state.from`) para que
 * `LoginPage` retome a navegação após o login (ver `LoginPage.tsx`).
 */
export function AuthGuard() {
  const { status } = useSession();
  const location = useLocation();

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
