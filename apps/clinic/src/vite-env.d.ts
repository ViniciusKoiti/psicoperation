/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Seleciona explicitamente o `AuthAdapter` ("mock" ou "http"). Sem esta
   * variável, o padrão é "http" em build de produção e "mock" nos demais
   * modos (ver `src/adapters/auth/index.ts`, único ponto de composição).
   */
  readonly VITE_AUTH_ADAPTER?: "mock" | "http";
  /** URL base da API usada por `HttpAuthAdapter` quando selecionado. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
