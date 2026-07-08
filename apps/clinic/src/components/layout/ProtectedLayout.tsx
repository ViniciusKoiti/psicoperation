import { Outlet } from "react-router-dom";

import { AppShellLayout } from "./AppShellLayout";

/** Rota de layout do React Router: envolve as rotas protegidas com o shell. */
export function ProtectedLayout() {
  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  );
}
