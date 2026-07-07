# @psiops/ui

Design system do PsiOps: tokens de design multi-alvo e componentes primitivos
React. Os valores vêm de `docs/design/landing-page-spec.md` (§2 tipografia e
§3 cores/sombras), a spec de handoff do protótipo `project/PsiOps Landing.html`.

## Fonte única e alvos derivados

A definição canônica vive em **`src/tokens/index.ts`** (objeto TypeScript
tipado). Todos os demais alvos derivam dela — nunca edite um alvo à mão:

| Alvo                               | Como deriva                         | Consumidor                      |
| ---------------------------------- | ----------------------------------- | ------------------------------- |
| `@psiops/ui` / `@psiops/ui/tokens` | é a própria fonte (build `tsc`)     | qualquer código TS/JS           |
| `@psiops/ui/tokens.css`            | **gerado** (`pnpm generate`)        | injeção de `--psi-*` em `:root` |
| `@psiops/ui/tokens.json`           | **gerado** (`pnpm generate`)        | **tema Flutter (PSI-013)**      |
| `@psiops/ui/mantine`               | derivado em runtime (`createTheme`) | `apps/clinic`                   |
| `@psiops/ui/tailwind`              | derivado em runtime (objeto puro)   | `apps/landing`                  |
| `@psiops/ui/components.css`        | referencia as vars de tokens.css    | apps que usam as primitivas     |
| `@psiops/ui/styles.css`            | `@import` de tokens + components    | atalho para os dois acima       |

Coerência garantida por testes:

- `tests/spec-fidelity.test.ts` parseia a spec markdown e compara **todos** os
  47 hex, as 3 sombras e as 3 pilhas de fonte com a fonte única;
- `tests/artifacts-drift.test.ts` falha se `tokens.json`/`css/tokens.css`
  comitados divergirem do que a fonte gera (regenere com
  `pnpm --filter @psiops/ui generate`);
- `tests/mantine-theme.test.ts` e `tests/tailwind-preset.test.ts` verificam que
  tema e preset apontam para os mesmos valores.

## tokens.json (fonte do tema Flutter — PSI-013)

`tokens.json` é o artefato canônico e agnóstico de plataforma:

- `colors.*`: hex `#RRGGBB` (paletas `primary` 50–900, `accent` 50–900,
  `neutral` 0–950; semânticas `success/warning/error/info` com
  `light/medium/dark`; `calm` com `soft/base/deep`);
- `shadows.{soft,lift,card}.layers[]`: camadas estruturadas
  `{ offsetX, offsetY, blur, spread, color: { hex, alpha } }` em px —
  mapeáveis para `BoxShadow` no Flutter; o campo `css` é a serialização
  equivalente para web;
- `typography.{display,body,serif}`: família principal, pilha de fallback,
  pesos disponíveis por estilo e estilo padrão (`serif` é itálico). As fontes
  **não** são embarcadas: cada app carrega DM Sans/Inter/Fraunces e este
  pacote só referencia as famílias.

## Uso

```ts
// Tokens tipados (tree-shakeable)
import { colors, shadows, typography, tokens } from "@psiops/ui/tokens";

// Tema Mantine (apps/clinic) — requer @mantine/core (peer opcional)
import { psiopsTheme } from "@psiops/ui/mantine";

// Preset Tailwind (apps/landing) — objeto puro, sem dependência de tailwindcss
import { psiopsPreset } from "@psiops/ui/tailwind";

// Primitivas React (requerem os estilos do pacote)
import { Button, Card, Pill } from "@psiops/ui";
import "@psiops/ui/styles.css";
```

```tsx
<Button variant="ghost" size="compact" href="#solucao">Ver como funciona</Button>
<Card shadow="soft" lift>…</Card>
<Pill dotColor="var(--psi-accent-500)">Feito para psicólogos</Pill>
```

## Scripts

- `pnpm build` — compila `src/` para `dist/` (`tsc`);
- `pnpm generate` — build + regeneração de `tokens.json` e `css/tokens.css`;
- `pnpm test` / `pnpm lint` / `pnpm typecheck` — validação local.
