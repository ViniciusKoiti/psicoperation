import { BrowserRouter } from "react-router-dom";

import { authAdapter } from "./adapters/auth";
import { AppRoutes } from "./app/routes";
import { SessionProvider } from "./session/SessionContext";

/**
 * Raiz da aplicação: `SessionProvider` usa o `AuthAdapter` composto em
 * `src/adapters/auth` (mock em dev/test, http por padrão em produção — ver
 * `src/adapters/auth/index.ts`) e envolve o roteador para que `AuthGuard`
 * (dentro de `AppRoutes`) tenha acesso à sessão.
 */
export function App() {
  return (
    <SessionProvider adapter={authAdapter}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SessionProvider>
  );
}
