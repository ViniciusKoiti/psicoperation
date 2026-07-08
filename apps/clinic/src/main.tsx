import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { psiopsTheme } from "@psiops/ui/mantine";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("elemento #root não encontrado em index.html");
}

createRoot(container).render(
  <StrictMode>
    <MantineProvider theme={psiopsTheme}>
      <App />
    </MantineProvider>
  </StrictMode>,
);
