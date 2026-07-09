import type { LoginRequest, RegisterRequest, User } from "@psiops/contracts";
import { createContext, useContext, useMemo, useRef, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import type { AuthAdapter } from "../adapters/auth/AuthAdapter";
import { SessionManager, type SessionStatus } from "./SessionManager";

export interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  login(payload: LoginRequest): Promise<void>;
  register(payload: RegisterRequest): Promise<void>;
  logout(): void;
  /**
   * Executa uma operação autenticada com renovação transparente de sessão
   * (expiração/401 → renova e repete a operação uma vez). Usado por futuros
   * adapters de domínio que precisem de bearer token (ex.: HttpPatientsAdapter,
   * PSI-039) — ver `SessionManager.withAuth`.
   */
  withAuth<T>(operation: (accessToken: string) => Promise<T>): Promise<T>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export interface SessionProviderProps {
  /** Adapter de autenticação a usar — vem de `src/adapters/auth` (ponto único de composição). */
  adapter: AuthAdapter;
  children: ReactNode;
}

/**
 * Provedor de sessão do app: instancia um `SessionManager` para o `adapter`
 * recebido e o expõe via contexto/`useSession`. Uma única instância por
 * ciclo de vida do provider (guardada em `useRef`) garante que o estado de
 * autenticação sobrevive a re-renders.
 */
export function SessionProvider({ adapter, children }: SessionProviderProps) {
  const managerRef = useRef<SessionManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new SessionManager(adapter);
  }
  const manager = managerRef.current;

  const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot, manager.getSnapshot);

  const value = useMemo<SessionContextValue>(
    () => ({
      status: snapshot.status,
      user: snapshot.user,
      login: (payload) => manager.login(payload),
      register: (payload) => manager.register(payload),
      logout: () => manager.logout(),
      withAuth: (operation) => manager.withAuth(operation),
    }),
    [snapshot, manager],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Acesso ao estado/ações de sessão. Deve ser usado dentro de `SessionProvider`. */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession deve ser usado dentro de <SessionProvider>.");
  }
  return context;
}

/** Exportado só para testes que precisam fornecer um valor de contexto sintético. */
export { SessionContext };
