import { react } from "@psiops/config/eslint";

export default [
  {
    name: "@psiops/landing/ignores",
    ignores: ["next-env.d.ts", "playwright-report/**", "test-results/**"],
  },
  ...react,
];
