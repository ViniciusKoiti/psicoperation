import { AppShell } from "@mantine/core";
import type { ReactNode } from "react";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export interface AppShellLayoutProps {
  children: ReactNode;
}

/**
 * Shell de layout usado pelas rotas protegidas: topbar fixa + sidebar de
 * navegação + área de conteúdo. `data-testid` nos dois primeiros habilita o
 * smoke test (ver `AppShellLayout.test.tsx`) sem depender de detalhes de
 * implementação do Mantine.
 *
 * Ver `ProtectedLayout` para o uso como rota de layout do React Router.
 */
export function AppShellLayout({ children }: AppShellLayoutProps) {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 260, breakpoint: "sm" }} padding="md">
      <AppShell.Header data-testid="app-topbar">
        <Topbar />
      </AppShell.Header>
      <AppShell.Navbar p="md" aria-label="Navegação principal" data-testid="app-sidebar">
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
