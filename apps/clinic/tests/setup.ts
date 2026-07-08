import "@testing-library/jest-dom/vitest";

// jsdom não implementa matchMedia; o MantineProvider usa para detectar o
// color-scheme do sistema. Stub mínimo, só para os testes renderizarem.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
