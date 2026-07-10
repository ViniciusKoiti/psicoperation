/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Seleciona explicitamente o `AuthAdapter` ("mock" ou "http"). Sem esta
   * variável, o padrão é "http" em build de produção e "mock" nos demais
   * modos (ver `src/adapters/auth/index.ts`, único ponto de composição).
   */
  readonly VITE_AUTH_ADAPTER?: "mock" | "http";
  /**
   * Seleciona explicitamente o `SettingsAdapter` ("mock" ou "http"). Sem
   * esta variável, o padrão é "http" em build de produção e "mock" nos
   * demais modos (ver `src/adapters/settings/index.ts`, único ponto de
   * composição).
   */
  readonly VITE_SETTINGS_ADAPTER?: "mock" | "http";
  /**
   * Seleciona explicitamente o `TasksAdapter` ("mock" ou "http"). Sem esta
   * variável, o padrão é "http" em build de produção e "mock" nos demais
   * modos (ver `src/adapters/tasks/index.ts`, único ponto de composição).
   */
  readonly VITE_TASKS_ADAPTER?: "mock" | "http";
  /**
   * Seleciona explicitamente o `RemindersAdapter` ("mock" ou "http"). Sem
   * esta variável, o padrão é "http" em build de produção e "mock" nos
   * demais modos (ver `src/adapters/reminders/index.ts`, único ponto de
   * composição).
   */
  readonly VITE_REMINDERS_ADAPTER?: "mock" | "http";
  /** URL base da API usada por `HttpAuthAdapter`/`HttpSettingsAdapter` quando selecionados. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
