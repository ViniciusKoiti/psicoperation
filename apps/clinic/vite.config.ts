import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite do @psiops/clinic. `vitest.config.js` é o arquivo usado pelos testes
 * (preset de @psiops/config); este arquivo cobre apenas dev/build da SPA.
 */
export default defineConfig({
  plugins: [react()],
});
