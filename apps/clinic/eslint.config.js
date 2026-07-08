import { react } from "@psiops/config/eslint";

export default [
  {
    name: "@psiops/clinic/ignores",
    ignores: ["dist/**"],
  },
  ...react,
];
