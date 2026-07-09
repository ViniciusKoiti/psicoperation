import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { SessionContext, type SessionContextValue } from "../session/SessionContext";

/**
 * Helpers de teste para componentes que dependem de `useSession`. Não é
 * usado por nenhum caminho de produção — só por `*.test.tsx`.
 */

/**
 * Constrói um `SessionContextValue` sintético para testar componentes (ex.:
 * `AuthGuard`, `Topbar`) isolados de um `SessionProvider`/adapter real.
 * `login`/`register`/`withAuth` são `vi.fn()` por padrão — sobrescreva via
 * `overrides` quando o teste precisar inspecionar chamadas ou simular erros.
 */
export function createTestSessionValue(overrides: Partial<SessionContextValue> = {}): SessionContextValue {
  return {
    status: "anonymous",
    user: null,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    withAuth: vi.fn(async (operation: (accessToken: string) => Promise<unknown>) =>
      operation("test-access-token"),
    ) as unknown as SessionContextValue["withAuth"],
    ...overrides,
  };
}

export interface RenderWithSessionOptions {
  session?: Partial<SessionContextValue>;
  initialEntries?: string[];
}

/**
 * Renderiza `ui` dentro de `MantineProvider` + `MemoryRouter` + um
 * `SessionContext.Provider` sintético (ver `createTestSessionValue`).
 * Para testes que precisam do fluxo real (adapter mock de verdade), use
 * `SessionProvider` com `MockAuthAdapter` diretamente em vez deste helper.
 */
export function renderWithSession(ui: ReactElement, options: RenderWithSessionOptions = {}) {
  const value = createTestSessionValue(options.session);
  return {
    ...render(
      <MantineProvider theme={psiopsTheme}>
        <MemoryRouter initialEntries={options.initialEntries ?? ["/"]}>
          <SessionContext.Provider value={value}>{ui}</SessionContext.Provider>
        </MemoryRouter>
      </MantineProvider>,
    ),
    sessionValue: value,
  };
}
