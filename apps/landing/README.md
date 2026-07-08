# @psiops/landing

Landing page pública do PsiOps — Next.js (App Router, TypeScript) com Tailwind
compilado por pipeline PostCSS próprio (nunca via CDN, que é artefato do
protótipo de handoff).

Esta é a fundação técnica entregue pela **PSI-009**; a implementação fiel das
seções (hero, problema, solução, FAQ, formulário de lista de espera) e os e2e
reais chegam na **PSI-019**, a partir de `docs/design/landing-page-spec.md`.

## Design system

- **Tokens**: `tailwind.config.ts` consome o preset `@psiops/ui/tailwind`
  (classes `bg-psi-primary-600`, `shadow-card`, `font-display`, …) e
  `src/app/globals.css` importa `@psiops/ui/tokens.css` (vars `--psi-*`).
- **Fontes**: DM Sans (display), Inter (body) e Fraunces itálica (serif) via
  `next/font/google` — self-hosted no build, sem requisição externa em runtime.
  Elas são expostas como `--font-display` / `--font-body` / `--font-serif` e
  ligadas às famílias `font-display` / `font-body` / `font-serif` do Tailwind.

## Comandos

```bash
pnpm dev          # servidor de desenvolvimento (http://localhost:3000)
pnpm build        # build de produção (.next/)
pnpm start        # serve o build de produção
pnpm lint         # ESLint (preset react de @psiops/config)
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (unit; jsdom)
pnpm test:e2e     # Playwright (smoke; sobe o app via webServer)
```

O app depende do build de `@psiops/ui` (dist/). Na raiz,
`pnpm turbo run build --filter @psiops/landing` resolve a ordem automaticamente.

## Playwright (e2e local)

Os e2e **não** rodam no job padrão de CI nesta fase — execução local:

```bash
pnpm exec playwright install chromium   # uma vez (baixa o browser)
pnpm --filter @psiops/landing test:e2e
```

O `webServer` do `playwright.config.ts` sobe `next dev` sozinho (e reutiliza
um servidor já em execução fora de CI). Se faltarem bibliotecas de sistema,
use `pnpm exec playwright install chromium --with-deps` (pede sudo).
