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

// jsdom não implementa ResizeObserver; componentes Mantine com indicador
// flutuante (ex.: `SegmentedControl`, usado na lista de pacientes — PSI-033)
// o utilizam para medir o elemento ativo. Stub mínimo, sem observação real.
if (typeof globalThis.ResizeObserver !== "function") {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
