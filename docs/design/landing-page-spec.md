# PsiOps Landing Page — Especificação de Design (Handoff)

> **Fonte da verdade**: `project/PsiOps Landing.html` (protótipo pixel-perfect, SOMENTE LEITURA).
> Este documento é a referência completa para reconstruir a página como componentes React semânticos.
> **Não converta o HTML diretamente para JSX** — reproduza o resultado visual com componentes limpos.

---

## 0. Metadados da página

- `lang="pt-BR"`
- `<title>`: `PsiOps — O financeiro da sua clínica, finalmente em ordem`
- Meta description: `Controle de mensalidades, lembretes automáticos e cobrança pelo WhatsApp para psicólogos autônomos. Organize o financeiro do seu consultório com o PsiOps.`
- Canonical: `https://psiops.com.br/`
- Favicon: `assets/psiops-mark.png`
- Open Graph / Twitter: mesmo título e descrição; imagem prevista `assets/og-image.png` (1200×630, ainda não existe)
- Meta Pixel (Facebook) com placeholder `XXXXXXXXXXXXXXXXXX`; dispara `PageView` no load e `Lead` no sucesso do formulário
- Formulário aponta para Formspree com placeholder `YOUR_FORM_ID`
- `html { scroll-behavior: smooth; }` (âncoras rolam suavemente)

---

## 1. Estrutura visual e hierarquia (ordem exata das seções)

| # | Seção | id / âncora | Fundo | Padding vertical |
|---|-------|-------------|-------|------------------|
| 1 | Nav (sticky) | `#nav` (âncora `#top` logo após) | `rgba(250,249,247,.82)` + blur | altura fixa 74px |
| 2 | Hero | — | `--psi-neutral-50` + gradientes radiais | 74px top / 86px bottom |
| 3 | Problema | `#problema` | `--psi-neutral-50` (padrão do body) | 96px / 96px |
| 4 | Solução | `#solucao` | `--psi-neutral-100` | 96px / 96px |
| 5 | Como funciona | `#como` | padrão | 96px / 96px |
| 6 | Quote | — | `--psi-primary-50` | 110px / 110px |
| 7 | Lead form | `#lista` | padrão | 96px / 96px |
| 8 | FAQ | `#faq` | padrão | 60px top / 100px bottom |
| 9 | CTA final | — | padrão (card com gradiente interno) | 0 top / 96px bottom |
| 10 | Footer | — | padrão, `border-top: 1px solid --psi-neutral-200` | 54px top / 60px bottom |

### 1.1 Nav (sticky)

- `position: sticky; top: 0; z-index: 50; backdrop-filter: blur(12px)`
- Estado inicial: `background: rgba(250,249,247,.82); border-bottom: 1px solid transparent`
- Estado `.scrolled` (scrollY > 12): `border-color: var(--psi-neutral-200); background: rgba(250,249,247,.92)`
- Transições: `border-color .3s ease, background .3s ease`
- Conteúdo dentro de `.wrap`, flex `justify-content: space-between`, altura **74px**:
  1. Logo à esquerda: `assets/psiops-logo-trim.png`, `height: 34px`, link para `#top`
  2. Nav central (oculta em mobile — `hidden md:flex` do Tailwind, ou seja, visível ≥ 768px), `gap: 38px`, links: "O problema" → `#problema`, "Recursos" → `#solucao`, "Como funciona" → `#como`, "Dúvidas" → `#faq`
  3. CTA à direita: botão primary "Acesso antecipado" → `#lista`, com padding compacto `11px 20px` e `font-size: 15px`

### 1.2 Hero

- `position: relative; overflow: hidden`
- Wash de fundo (camada absoluta `inset:0`, `pointer-events:none`):
  ```
  radial-gradient(680px 460px at 78% -8%, rgba(160,148,201,.20), transparent 70%),
  radial-gradient(560px 420px at 4% 18%, rgba(220,235,232,.55), transparent 65%)
  ```
- Grid `.hero-grid`: `grid-template-columns: 1.05fr .95fr; gap: 64px; align-items: center`

**Coluna esquerda** (`.reveal`):
- Pill (margin-bottom 26px) com status-dot `--psi-accent-500`: "Feito para psicólogos que trabalham com mensalidade"
- H1: `font-size: 62px; font-weight: 700; color: --psi-neutral-900; margin-bottom: 22px; text-wrap: balance` — a palavra "você" em `.serif` (Fraunces itálico) com `color: --psi-primary-600`
- Parágrafo: `font-size: 19px; color: --psi-neutral-600; max-width: 520px; margin-bottom: 34px`
- Linha de CTAs: `flex; flex-wrap: wrap; gap: 14px` — btn-primary "Quero acesso antecipado" (→ `#lista`) e btn-ghost "Ver como funciona" (→ `#solucao`) com ícone seta 18×18 (`.ico`, path `M5 12h14M13 6l6 6-6 6`)
- Social proof (margin-top 30px, flex gap 13px): 3 círculos 32×32px sobrepostos (`margin-left: -10px` no 2º e 3º), `border: 2px solid --psi-neutral-50`, fundos `--psi-primary-300`, `--psi-calm-base`, `--psi-accent-300`; texto 14.5px `--psi-neutral-600`: "Sendo construído junto com psicólogas autônomas do Brasil"

**Coluna direita** (`.reveal` com `transition-delay: .12s`), mockup de dashboard, container `position: relative`:

- **Chip flutuante de receita** (`.card.hero-chip`): `position: absolute; top: -26px; right: 6px; z-index: 3; padding: 16px 20px; border-radius: 18px; box-shadow: var(--shadow-lift)`
  - Label: DM Sans 12px, `letter-spacing: .06em`, uppercase, `--psi-neutral-500`: "Receita do mês"
  - Valor: DM Sans 700, 26px, `--psi-primary-700`: "R$ 4.200"
- **Card principal**: `.card` com `padding: 24px; box-shadow: var(--shadow-lift); border-radius: 24px`
  - Header (flex space-between, margin-bottom 20px):
    - Título: DM Sans 600, 16px: "Pacientes — Maio"; subtítulo 13px `--psi-neutral-500`: "8 mensalistas ativos"
    - Badge verde: DM Sans 500, 12.5px, cor `--psi-success-dark`, fundo `--psi-success-light`, `padding: 6px 11px; border-radius: 999px`, com dot `--psi-success-medium`: "5 em dia"
  - 3 linhas de pacientes (`flex column; gap: 10px`), cada linha: `flex; gap: 14px; padding: 14px; border-radius: 15px`
    - Avatar de iniciais: círculo 40×40px, DM Sans 600 14px
    - Nome: DM Sans 600, 15px, `--psi-neutral-900`; sublinha 13px
    - Status à direita: DM Sans 500, 12.5px, com status-dot
    | Paciente | Avatar | Fundo da linha | Sublinha | Status |
    |---|---|---|---|---|
    | MR — Marcos Rocha | bg `--psi-primary-100` / texto `--psi-primary-700` | `--psi-neutral-50` + borda `--psi-neutral-200` | "Venc. dia 5 · R$ 350" | "Pago" (success) |
    | BL — Beatriz Lima | bg `--psi-calm-soft` / texto `--psi-calm-deep` | `--psi-neutral-50` + borda `--psi-neutral-200` | "Venc. dia 10 · R$ 300" | "Em aberto" (warning) |
    | CD — Carla Dias | bg `#fff` / texto `--psi-error-dark` | `--psi-error-light` + borda `--psi-error-medium` | "Atrasado 4 dias · R$ 357 com juros" (cor `--psi-error-dark`) | "Atrasado" (error) |
- **Chip flutuante de WhatsApp** (`.card.hero-chip`): `position: absolute; bottom: -30px; left: -14px; z-index: 3; padding: 13px 16px; border-radius: 16px; box-shadow: var(--shadow-lift); max-width: 248px`, flex gap 11px
  - Círculo 34×34px fundo `--psi-success-light`, ícone WhatsApp 18×18 cor `--psi-success-dark`
  - Texto 13px `--psi-neutral-700`, `line-height: 1.4`: "Lembrete enviado **automaticamente**" (strong em `--psi-success-dark`)

### 1.3 Problema (`#problema`)

- Header centralizado (`.reveal`, `max-width: 620px; margin: 0 auto 56px`):
  - Eyebrow: "A realidade de quem atende sozinho"
  - H2: 44px, 700, `margin-top: 16px`: "Você já passou por isso?"
- Grid `.grid-3`: `repeat(3, 1fr); gap: 24px`
- Cada card: `.card.lift.reveal`, `padding: 34px 30px`; delays de reveal: 0 / `.08s` / `.16s`
  - Ícone em quadrado 52×52px, `border-radius: 15px`, SVG 26×26 `.ico`
  - H3: 20px, 600, `margin-bottom: 10px`; parágrafo 16px `--psi-neutral-600`

| Card | Cor do ícone (bg / stroke) | Ícone (descrição) | Título | Texto |
|---|---|---|---|---|
| 1 | `--psi-primary-100` / `--psi-primary-600` | planilha (rect + linhas cruzadas) | Perdeu o controle de quem pagou | A planilha cresce e cada mês fica mais difícil saber quem está em dia. |
| 2 | `--psi-accent-100` / `--psi-accent-700` | relógio (círculo + ponteiros) | Cobrança toma tempo da semana | Digitar mensagem para cada paciente atrasado, entre uma sessão e outra. |
| 3 | `--psi-calm-soft` / `--psi-calm-deep` | calculadora (rect + teclas) | Juros e multa calculados na mão | Fazer a conta toda vez que alguém atrasa é desgastante e dá margem para erro. |

### 1.4 Solução (`#solucao`)

- Fundo: `--psi-neutral-100`
- Header centralizado (`max-width: 640px; margin: 0 auto 72px`): eyebrow "A solução"; H2 44px/700 "Tudo em um lugar, finalmente."
- 3 feature rows (`.feature.reveal`): `grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; margin-bottom: 104px` (a última sem margin-bottom)
- Cada feature tem `.feat-visual` (mockup) e `.feat-text` (texto). Padrão do texto:
  - Badge/tag: inline-flex, DM Sans 500, 12.5px, `padding: 6px 12px; border-radius: 999px; margin-bottom: 18px`
  - H3: 32px, 600, `margin-bottom: 16px`
  - Parágrafo: 18px, `--psi-neutral-600`, `max-width: 440px`

**Feature 1 — visual à esquerda, texto à direita**
- Badge: "Cadastro" — cor `--psi-primary-700`, fundo `--psi-primary-100`
- H3: "Carteira de pacientes mensalistas"
- Texto: "Cadastre cada paciente uma vez. Defina o valor da mensalidade e o dia de vencimento. Pronto — o sistema acompanha tudo para você."
- Visual: `.card` (`padding: 22px; shadow-soft; border-radius: 22px`) título DM Sans 600 15px "Carteira de pacientes"; 4 linhas (`flex column; gap: 9px`), cada uma `padding: 13px 15px; bg --psi-neutral-50; borda --psi-neutral-200; border-radius: 13px`, com status-dot 9×9px + nome (500, `--psi-neutral-800`) e valor à direita (DM Sans 14px, `--psi-neutral-600`):
  - Marcos Rocha (dot success) — R$ 350
  - Beatriz Lima (dot warning) — R$ 300
  - Carla Dias (dot error) — R$ 357
  - João Prado (dot success) — R$ 320

**Feature 2 — texto à esquerda, visual à direita** (no HTML o texto vem primeiro; em mobile as classes `.feat-order-1`/`.feat-order-2` mantêm texto acima do visual)
- Badge: "Automático" — cor `--psi-success-dark`, fundo `--psi-success-light`, com status-dot `--psi-success-medium`
- H3: "Lembretes automáticos pelo WhatsApp"
- Texto: "Configure uma vez e esqueça. Antes do vencimento, o sistema avisa seu paciente educadamente. Você só entra em cena quando precisa."
- Visual (mock de WhatsApp): container `background: #E9E2D7; border-radius: 22px; padding: 26px; shadow-soft`
  - Header (flex gap 11px, margin-bottom 18px): círculo 38×38px fundo `--psi-success-medium` com ícone WhatsApp branco 20×20; "PsiOps · Lembrete" (DM Sans 600, 14px) e "hoje, 09:02" (12px, `--psi-neutral-600`)
  - Balão de mensagem: fundo `#fff`, `border-radius: 4px 16px 16px 16px; padding: 14px 16px; box-shadow: 0 1px 2px rgba(0,0,0,.08); max-width: 330px`
    - Texto 15px, `line-height: 1.55`: "Olá Marcos, sua mensalidade de **R$ 350** vence em **3 dias**. Segue o link para pagamento. 💜"
    - Recibo: 12px, `--psi-success-dark`, alinhado à direita: "Entregue ✓✓"

**Feature 3 — visual à esquerda, texto à direita**
- Badge: "Sem conta de cabeça" — cor `--psi-accent-700`, fundo `--psi-accent-100`
- H3: "Juros calculados automaticamente"
- Texto: "Defina a regra uma vez — 1% ao mês, multa de 2%, o que fizer sentido pra você — e o sistema aplica em todos os atrasos. Sem conta de cabeça, sem erro."
- Visual (card calculadora de juros): `.card` (`padding: 24px; shadow-soft; border-radius: 22px; max-width: 380px`)
  - "Carla Dias" (DM Sans 600, 15px); "Atrasado há 4 dias" (13px, `--psi-error-dark`, margin-bottom 18px)
  - Linhas (flex space-between, 15px, gap vertical 12px):
    - Valor original — R$ 350,00
    - Juros (1% a.m.) — R$ 0,47
    - Multa (2%) — R$ 7,00
  - Divisor: 1px `--psi-neutral-200`
  - Total: "Total atualizado" (DM Sans 600) — "R$ 357,47" (DM Sans 700, 20px, `--psi-accent-700`)

### 1.5 Como funciona (`#como`)

- Header centralizado (`max-width: 620px; margin: 0 auto 60px`): eyebrow "Passo a passo"; H2 44px/700 "Simples como deve ser"
- Grid `.grid-3`: `repeat(3, 1fr); gap: 30px`; cada passo `.reveal` com `padding: 8px 12px`, delays 0 / `.08s` / `.16s`
- Número do passo: Fraunces (classe `.serif` mas com `font-style: normal; font-weight: 500`), `font-size: 60px; color: --psi-primary-300; line-height: 1; margin-bottom: 18px`
- H3: 21px, 600, margin-bottom 10px; parágrafo 16px `--psi-neutral-600`

| Nº | Título | Texto |
|---|---|---|
| 01 | Cadastre seus pacientes | Em menos de 2 minutos por paciente. Sem complicação. |
| 02 | Configure as regras | Defina valores, vencimentos e juros uma única vez. |
| 03 | Acompanhe e cobre | Receba alertas, envie lembretes, mantenha tudo em ordem. |

### 1.6 Quote

- Fundo `--psi-primary-50`, `padding: 110px 0`
- `.wrap.reveal` centralizado com `max-width: 860px`
- Divider superior: `.divider-line` (1px × 64px, `--psi-accent-300`), `margin: 0 auto 40px`
- Quote em `.serif` (Fraunces itálico): `font-size: 42px; color: --psi-primary-800; line-height: 1.32; text-wrap: balance`:
  > “Você cuida das pessoas. A gente cuida do que vem depois da sessão.”
- Divider inferior: `margin: 40px auto 0`

### 1.7 Lead form (`#lista`)

- Card container (`.card.reveal`): `max-width: 760px; margin: 0 auto; padding: 54px 56px; background: --psi-primary-50; border-color: --psi-primary-200; border-radius: 26px; box-shadow: var(--shadow-soft)`
- Header centralizado (margin-bottom 34px):
  - Eyebrow: "Lista de espera"
  - H2: 38px, 700, `margin: 14px 0 14px`: "Entre na lista de espera"
  - Parágrafo 17px, `--psi-neutral-600`, `max-width: 520px` centralizado: "Estamos construindo junto com psicólogas. Quem entrar agora terá acesso antecipado e condições especiais no lançamento."
- Formulário `#leadForm` (`novalidate`, POST para `https://formspree.io/f/YOUR_FORM_ID`), `flex column; gap: 18px`:
  - Campo "Nome completo" (`id="nome"`, type text, required) — placeholder "Como podemos te chamar?"
  - Grid `.form-grid` (`1fr 1fr; gap: 18px`):
    - "WhatsApp" (`id="whats"`, type tel, `inputmode="numeric"`, required) — placeholder "(11) 90000-0000"
    - "E-mail" (`id="email"`, type email, required) — placeholder "voce@email.com"
  - Botão submit btn-primary full-width: `padding: 17px; font-size: 17px; margin-top: 6px` — "Quero acesso antecipado"
  - Nota: 13.5px, `--psi-neutral-600`, centralizada: "Sem spam. Você só recebe quando a gente lançar."
- Estado de sucesso `#leadSuccess` (`display: none` inicialmente; centralizado, `padding: 18px 0`):
  - Círculo 64×64px fundo `--psi-success-light` com check SVG 32×32 (`stroke-width: 2`) cor `--psi-success-dark`, margin-bottom 20px
  - H3 26px/600: "Você está na lista!"
  - Parágrafo 16px: "Vamos te avisar pelo WhatsApp assim que o PsiOps abrir. Acesso antecipado e condições especiais garantidos para você."

### 1.8 FAQ (`#faq`)

- `.wrap` com `max-width: 820px` (mais estreito que o padrão)
- Header centralizado (margin-bottom 44px): eyebrow "Dúvidas"; H2 **40px**/700 "Perguntas que você pode ter"
- `#faqList` (`.reveal`) — itens injetados por JS a partir de um array (ver §8.3). Anatomia do item:
  - `.faq-item`: `border-bottom: 1px solid --psi-neutral-200`
  - `.faq-q` (button, `aria-expanded`): `padding: 26px 4px; flex space-between; gap: 20px`; DM Sans 600, **19px**, `--psi-neutral-900`
  - Chevron `.faq-chev`: SVG "+" 22×22 (`stroke-width: 1.8`), cor `--psi-primary-500`; rotaciona 45° quando aberto (`transition: transform .35s cubic-bezier(.4,0,.2,1)`)
  - `.faq-a`: `max-height: 0; overflow: hidden; opacity: 0`; transições `max-height .4s cubic-bezier(.4,0,.2,1), opacity .4s ease`; texto 16.5px, `--psi-neutral-600`
  - `.faq-a-inner`: `padding: 0 4px 26px; max-width: 760px`

**Perguntas e respostas (transcrição fiel):**

1. **Quando vai lançar?** — Estamos na fase final de construção. Quem entrar na lista de espera será avisado primeiro, com previsão para os próximos 2–3 meses.
2. **Quanto vai custar?** — Ainda estamos definindo, mas a faixa será acessível para profissionais autônomos. Quem entrar agora terá condição especial garantida.
3. **Funciona com WhatsApp comum?** — Sim. Você não precisa de WhatsApp Business para usar o PsiOps.
4. **E se eu não trabalho só com mensalidade?** — Por enquanto o foco é mensalidade. Em breve, sessão avulsa também.
5. **Meus dados de pacientes ficam seguros?** — Sim. Seguimos as boas práticas de segurança e a LGPD. Seus dados nunca são compartilhados.

### 1.9 CTA final

- Seção com `padding: 0 0 96px` (sem padding-top — encosta no FAQ)
- Card interno (`.reveal`): `position: relative; overflow: hidden; border-radius: 30px; padding: 78px 56px; text-align: center`
- Fundo: `linear-gradient(135deg, var(--psi-primary-800) 0%, var(--psi-primary-600) 100%)`
- Overlay radial (camada absoluta, `opacity: .5`, `pointer-events: none`):
  ```
  radial-gradient(420px 300px at 88% 0%, rgba(220,235,232,.22), transparent 70%),
  radial-gradient(420px 320px at 6% 100%, rgba(224,142,117,.20), transparent 70%)
  ```
- Conteúdo (`position: relative`):
  - Marca: `assets/psiops-mark.png`, `height: 54px`, centralizada, `margin-bottom: 26px`, **invertida para branco** via `filter: brightness(0) invert(1); opacity: .92`
  - H2: 42px, 700, `#fff`, `text-wrap: balance`: "Pronto para colocar o financeiro em ordem?"
  - Parágrafo: 18px, `rgba(255,255,255,.8)`, `max-width: 480px`, `margin-bottom: 32px`: "Entre na lista de espera e ganhe acesso antecipado."
  - Botão btn-white: "Quero acesso antecipado" → `#lista`

### 1.10 Footer

- `border-top: 1px solid --psi-neutral-200; padding: 54px 0 60px`
- Grid `.footer-grid`: `grid-template-columns: 1.6fr 1fr 1fr; gap: 40px`

**Coluna 1 — marca**
- Logo `assets/psiops-logo-trim.png`, `height: 30px`, margin-bottom 16px
- Tagline: 15px, `--psi-neutral-600`, `max-width: 280px`: "O financeiro da sua clínica, com a calma que a sua rotina merece."
- Copyright: 13.5px: "© 2026 PsiOps"

**Coluna 2 — Navegação** (título de coluna: DM Sans 600, 13px, `letter-spacing: .06em`, uppercase, `--psi-neutral-500`, margin-bottom 16px; lista `gap: 11px`, links `.nav-link` 15px)
- Sobre → `#solucao`
- FAQ → `#faq`
- Contato → `#lista`

**Coluna 3 — Legal**
- Política de Privacidade → `#` (placeholder)
- Termos de Uso → `#` (placeholder)

---

## 2. Tipografia

### Famílias (Google Fonts)

```
--font-display: "DM Sans", "Inter", sans-serif;   /* headings, botões, labels, badges, valores */
--font-body:    "Inter", sans-serif;              /* corpo de texto (default do body) */
--font-serif:   "Fraunces", Georgia, serif;       /* acentos serifados itálicos */
```

Import: DM Sans (opsz 9..40; pesos 400, 500, 600, 700), Inter (400, 500, 600), Fraunces (itálico 400/500 e normal 500/600, opsz 9..144), `display=swap`.

### Regras globais

- `body`: Inter, `background: --psi-neutral-50`, `color: --psi-neutral-900`, `line-height: 1.7`, antialiased
- `h1–h4`: DM Sans, `letter-spacing: -0.02em`, `line-height: 1.08`, `font-weight: 600`, `margin: 0`
- `.serif`: Fraunces, `font-style: italic`, `font-weight: 400`, `letter-spacing: -0.01em`

### Escala de uso

| Elemento | Fonte | Peso | Tamanho | Observações |
|---|---|---|---|---|
| H1 hero | DM Sans | 700 | 62px (48px ≤920px, 38px ≤600px) | `text-wrap: balance`; palavra em Fraunces itálico |
| H2 seções (problema/solução/como) | DM Sans | 700 | 44px (32px ≤600px) | |
| H2 CTA final | DM Sans | 700 | 42px | branco |
| H2 FAQ | DM Sans | 700 | 40px | |
| H2 lead form | DM Sans | 700 | 38px | |
| H3 feature | DM Sans | 600 | 32px | |
| H3 sucesso do form | DM Sans | 600 | 26px | |
| H3 passos | DM Sans | 600 | 21px | |
| H3 cards problema | DM Sans | 600 | 20px | |
| Quote | Fraunces itálico | 400 | 42px (26px ≤600px, lh 1.4) | `line-height: 1.32`, cor `--psi-primary-800` |
| Números dos passos | Fraunces | 500 | 60px | `font-style: normal`, `line-height: 1`, cor `--psi-primary-300` |
| Pergunta FAQ | DM Sans | 600 | 19px (16px ≤600px) | |
| Lead do hero | Inter | 400 | 19px | `--psi-neutral-600` |
| Parágrafo de feature | Inter | 400 | 18px | |
| Subtítulo lead form | Inter | 400 | 17px | |
| Resposta FAQ | Inter | 400 | 16.5px | `--psi-neutral-600` |
| Corpo de cards / passos / inputs / botões | Inter ou DM Sans | 400/600 | 16px | botão = DM Sans 600 16px |
| Nomes em listas | DM Sans | 600 | 15px | |
| Nav links / footer links | DM Sans | 500 | 15px | `--psi-neutral-700` → hover `--psi-primary-700` |
| Social proof hero | Inter | 400 | 14.5px | |
| Valores em listas | DM Sans | 400 | 14px | |
| Sublinhas / metadados | Inter | 400 | 13px | `--psi-neutral-500` |
| Eyebrow | DM Sans | 600 | 13px | uppercase, `letter-spacing: .14em`, `--psi-accent-700` |
| Títulos de coluna do footer | DM Sans | 600 | 13px | uppercase, `letter-spacing: .06em`, `--psi-neutral-500` |
| Pill / labels de form / nota do form | DM Sans | 500 | 13.5px | |
| Badges de status / tags de feature | DM Sans | 500 | 12.5px | |
| Label do chip de receita / timestamps | DM Sans / Inter | — | 12px | chip: uppercase, `letter-spacing: .06em` |

---

## 3. Cores — CSS custom properties de `:root` (valores exatos)

### Primary (roxo)

| Token | Hex |
|---|---|
| `--psi-primary-50` | `#F5F3FA` |
| `--psi-primary-100` | `#EBE7F4` |
| `--psi-primary-200` | `#D9D2EA` |
| `--psi-primary-300` | `#C0B5DC` |
| `--psi-primary-400` | `#A294C9` |
| `--psi-primary-500` | `#8676B5` |
| `--psi-primary-600` | `#6E5E9E` |
| `--psi-primary-700` | `#594C81` |
| `--psi-primary-800` | `#443A61` |
| `--psi-primary-900` | `#2F2842` |

### Accent (terracota)

| Token | Hex |
|---|---|
| `--psi-accent-50` | `#FCF3F0` |
| `--psi-accent-100` | `#FAE6DF` |
| `--psi-accent-200` | `#F4CCBF` |
| `--psi-accent-300` | `#ECAE9B` |
| `--psi-accent-400` | `#E08E75` |
| `--psi-accent-500` | `#D2725A` |
| `--psi-accent-600` | `#BC5C45` |
| `--psi-accent-700` | `#9C4A37` |
| `--psi-accent-800` | `#7A3A2C` |
| `--psi-accent-900` | `#532823` |

### Neutral (cinza quente)

| Token | Hex |
|---|---|
| `--psi-neutral-0` | `#FFFFFF` |
| `--psi-neutral-50` | `#FAF9F7` |
| `--psi-neutral-100` | `#F4F2EE` |
| `--psi-neutral-200` | `#E9E5DF` |
| `--psi-neutral-300` | `#D8D2C9` |
| `--psi-neutral-400` | `#BAB2A6` |
| `--psi-neutral-500` | `#968D7F` |
| `--psi-neutral-600` | `#756D61` |
| `--psi-neutral-700` | `#595348` |
| `--psi-neutral-800` | `#3D3833` |
| `--psi-neutral-900` | `#262320` |
| `--psi-neutral-950` | `#181614` |

### Semânticas

| Token | Hex |
|---|---|
| `--psi-success-light` | `#E7F1EA` |
| `--psi-success-medium` | `#7FB08D` |
| `--psi-success-dark` | `#3D6B4E` |
| `--psi-warning-light` | `#FBF1DE` |
| `--psi-warning-medium` | `#E0B057` |
| `--psi-warning-dark` | `#8A6321` |
| `--psi-error-light` | `#F9E9E6` |
| `--psi-error-medium` | `#D38478` |
| `--psi-error-dark` | `#9B4035` |
| `--psi-info-light` | `#E7EEF4` |
| `--psi-info-medium` | `#7CA0C4` |
| `--psi-info-dark` | `#3C5F84` |

### Calm (teal)

| Token | Hex |
|---|---|
| `--psi-calm-soft` | `#DCEBE8` |
| `--psi-calm-base` | `#88BAB2` |
| `--psi-calm-deep` | `#436E68` |

### Sombras

```css
--shadow-soft: 0 2px 8px rgba(110,94,158,.06), 0 12px 32px rgba(110,94,158,.07);
--shadow-lift: 0 4px 12px rgba(110,94,158,.08), 0 24px 56px rgba(110,94,158,.12);
--shadow-card: 0 1px 2px rgba(47,40,66,.05), 0 6px 20px rgba(47,40,66,.06);
```

### Cores fora dos tokens (usadas inline)

- Fundo do mock de WhatsApp: `#E9E2D7`
- Sombra do balão do WhatsApp: `0 1px 2px rgba(0,0,0,.08)`
- Nav: `rgba(250,249,247,.82)` / scrolled `rgba(250,249,247,.92)`
- Sombras dos botões: primary `0 6px 18px rgba(188,92,69,.28)` → hover `0 12px 28px rgba(188,92,69,.34)`; white `0 8px 24px rgba(0,0,0,.18)` → hover `0 14px 34px rgba(0,0,0,.24)`
- Texto sob H2 do CTA final: `rgba(255,255,255,.8)`
- Gradientes: ver §1.2 (hero) e §1.9 (CTA final)

---

## 4. Espaçamentos e layout

### Container `.wrap`

```css
max-width: 1180px; margin: 0 auto; padding-left: 24px; padding-right: 24px;
/* ≤860px: padding 20px; ≤600px: padding 18px */
```
Variante: FAQ usa `.wrap` com `max-width: 820px` inline.

### Paddings de seção (vertical)

- Padrão: **96px** (problema, solução, como funciona, lead form)
- Quote: **110px**
- FAQ: **60px top / 100px bottom**
- CTA final: **0 top / 96px bottom**
- Footer: **54px top / 60px bottom**
- Hero: **74px top / 86px bottom** (dentro do `.wrap`)
- ≤600px: todas as sections viram **60px / 60px** (`!important`)

### Gaps de grid

- Hero: `1.05fr .95fr`, gap **64px** (→ 1 coluna, gap 56px ≤920px)
- Features: `1fr 1fr`, gap **64px**, margin-bottom **104px** (→ 1 coluna, gap 36px, mb 72px ≤920px)
- Grid-3 (problema/como): `repeat(3,1fr)`, gap **24px** (problema) / **30px** (como) (→ 1 coluna, gap 18px ≤920px)
- Form-grid: `1fr 1fr`, gap **18px** (→ 1 coluna ≤600px)
- Footer-grid: `1.6fr 1fr 1fr`, gap **40px** (→ 1 coluna, gap 32px ≤600px)
- Nav interna: altura 74px; links com gap **38px**

### Border-radius recorrentes

| Raio | Uso |
|---|---|
| 999px | pills, badges, dots |
| 50% | avatares, círculos de ícone |
| 30px | card do CTA final |
| 26px | card do lead form |
| 24px | card do dashboard hero |
| 22px | `.card` padrão, mocks de feature, mock WhatsApp |
| 18px | chip de receita |
| 16px | chip de WhatsApp; balão de mensagem (`4px 16px 16px 16px`) |
| 15px | linhas de paciente do hero; quadrados de ícone dos cards de problema |
| 14px | `.btn` |
| 13px | `.field` (inputs); linhas da carteira de pacientes |

### Outros

- `.divider-line`: 1px × 64px, `--psi-accent-300`
- `.status-dot`: 8×8px (9×9px na carteira de pacientes), `border-radius: 50%`
- Ícones `.ico`: `stroke: currentColor; stroke-width: 1.6; fill: none; stroke-linecap: round; stroke-linejoin: round`

---

## 5. Conteúdo (transcrição fiel)

Todo o copy já está transcrito por seção no §1. Resumo dos textos-chave:

- **H1**: "Cuidar da sua clínica é cuidar de *você* também." ("você" em serif roxo)
- **Sub hero**: "Controle de mensalidades, lembretes automáticos e cobrança pelo WhatsApp — o financeiro do seu consultório organizado num só lugar, com a calma que a sua rotina merece."
- **Pill hero**: "Feito para psicólogos que trabalham com mensalidade"
- **Social proof**: "Sendo construído junto com psicólogas autônomas do Brasil"
- **H2 problema**: "Você já passou por isso?" (eyebrow "A realidade de quem atende sozinho")
- **H2 solução**: "Tudo em um lugar, finalmente." (eyebrow "A solução")
- **H2 como**: "Simples como deve ser" (eyebrow "Passo a passo")
- **Quote**: “Você cuida das pessoas. A gente cuida do que vem depois da sessão.”
- **H2 form**: "Entre na lista de espera" (eyebrow "Lista de espera")
- **H2 FAQ**: "Perguntas que você pode ter" (eyebrow "Dúvidas")
- **H2 CTA final**: "Pronto para colocar o financeiro em ordem?" / "Entre na lista de espera e ganhe acesso antecipado."
- **Tagline footer**: "O financeiro da sua clínica, com a calma que a sua rotina merece." / "© 2026 PsiOps"
- Cards de problema, features, passos, FAQ, formulário e estado de sucesso: ver §1.3–1.8 (tabelas com texto integral).

---

## 6. Catálogo de componentes React propostos

Mapeamento das classes do protótipo para componentes semânticos (não converter HTML→JSX; recompor):

| Componente | Classes de origem | Props sugeridas | Notas |
|---|---|---|---|
| `<Button>` | `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-white` | `variant: 'primary' \| 'ghost' \| 'white'`, `size: 'md' \| 'compact' (nav) \| 'lg' (form)`, `href`, `icon` | base: DM Sans 600 16px, `padding: 15px 26px`, radius 14px, `gap: 9px`; hover translateY(-2px) scale(1.02); ver sombras em §3 |
| `<Section>` | sections + `.wrap` | `id`, `background`, `paddingY` | encapsula `.wrap` (1180px) e paddings de §4 |
| `<SectionHeader>` | `.eyebrow` + h2 centralizado | `eyebrow`, `title`, `maxWidth` | eyebrow: DM Sans 600 13px uppercase ls .14em accent-700; h2 44px 700 mt 16px |
| `<Card>` | `.card` | `padding`, `radius`, `shadow: 'card' \| 'soft' \| 'lift'`, `lift?: boolean` | bg neutral-0, borda neutral-200, radius 22px, shadow-card |
| `<Pill>` | `.pill` | `dotColor?`, `children` | DM Sans 500 13.5px, bg primary-100, borda primary-200, radius 999px, `padding: 7px 14px 7px 11px` |
| `<Eyebrow>` | `.eyebrow` | `children` | pode ficar interno ao SectionHeader |
| `<Badge>` / `<Tag>` | badges inline (status/feature) | `tone: 'primary' \| 'success' \| 'accent' \| 'warning' \| 'error'`, `withDot?` | DM Sans 500 12.5px, radius 999px, padding 6px 11–12px |
| `<StatusDot>` | `.status-dot` | `tone`, `size?: 8 \| 9` | círculo com cor semântica medium |
| `<Reveal>` | `.reveal`, `html.reveal-on`, `.in` | `delay?: 0 \| 0.08 \| 0.12 \| 0.16` (s) | wrapper com IntersectionObserver; ver §8.1 |
| `<FeatureRow>` | `.feature`, `.feat-visual`, `.feat-text`, `.feat-order-*` | `badge`, `title`, `text`, `visual`, `reverse?: boolean` | grid 1fr/1fr gap 64px mb 104px; em mobile texto sempre acima quando `reverse` |
| `<FaqItem>` / `<FaqAccordion>` | `.faq-item`, `.faq-q`, `.faq-a`, `.faq-chev` | `items: {q, a}[]` | um aberto por vez; animação max-height; chevron "+" rotaciona 45°; `aria-expanded` |
| `<FloatingChip>` (ChipFlutuante) | `.hero-chip` + `.card` | `position` (offsets), `children` | absoluto sobre o mockup; **display none ≤920px** |
| `<HeroMockup>` | card do dashboard + `<PatientRow>` | dados estáticos | linhas de paciente com avatar de iniciais + status |
| `<PatientRow>` | linhas do dashboard/carteira | `initials`, `name`, `meta`, `status`, `tone` | duas variantes: dashboard (avatar 40px) e carteira (dot 9px) |
| `<WhatsAppMock>` | mock da feature 2 | — | fundo `#E9E2D7`, balão radius `4px 16px 16px 16px` |
| `<InterestCard>` | card da feature 3 | linhas de valores | calculadora de juros |
| `<StepItem>` | passos do "como funciona" | `number`, `title`, `text` | número Fraunces 60px primary-300 |
| `<TextField>` | `.field` + `label.lbl` | `label`, `id`, `type`, `placeholder`, `error?` | focus: borda primary-400 + ring `0 0 0 4px primary-100`; erro: borda error-medium |
| `<LeadForm>` | `#leadForm` + `#leadSuccess` | `onSubmit` | máscara de WhatsApp, validação, estado de sucesso (§8.4–8.6) |
| `<Nav>` | `header.nav`, `.nav-link` | — | sticky + estado scrolled (§8.2) |
| `<Footer>` | footer + `.footer-grid` | — | 3 colunas `1.6fr 1fr 1fr` |
| `<Icon>` | `.ico` | `name`, `size` | SVGs inline stroke 1.6, currentColor |
| `<Divider>` | `.divider-line` | — | 1×64px accent-300 |
| `<Quote>` | seção quote + `.serif` | `children` | Fraunces itálico 42px primary-800 |
| `<FinalCta>` | card gradiente | — | gradiente 135deg primary-800→600 + overlays radiais |

Utilitário `.lift` → prop `lift` em `<Card>` (hover `translateY(-4px) scale(1.015)` + `--shadow-lift`, transição `.3s cubic-bezier(.2,.8,.2,1)`).

---

## 7. Comportamento responsivo

### ≤920px (breakpoint principal)

- `.hero-grid` → 1 coluna, gap 56px; H1 → 48px
- `.feature` → 1 coluna, gap 36px, margin-bottom 72px
- `.feat-order-1` (texto) / `.feat-order-2` (visual): na feature 2 (invertida), o texto fica acima do visual via `order`
- `.grid-3` → 1 coluna, gap 18px
- `.hero-chip` → `display: none` (chips flutuantes somem)
- Padding vertical extra do mockup do hero zerado

### ≤860px

- `.wrap` → padding lateral 20px

### <768px (Tailwind `md`)

- Links centrais da nav somem (`hidden md:flex`) — restam logo + botão CTA. **Não há menu hambúrguer no protótipo.**

### ≤600px

- H1 → 38px; H2 de seções → 32px
- Quote → 26px, `line-height: 1.4`
- `.form-grid` → 1 coluna (WhatsApp e e-mail empilham)
- `.footer-grid` → 1 coluna, gap 32px
- `.wrap` → padding lateral 18px
- Card do lead form (`#lista .card`) → padding `36px 24px`
- Todas as sections → padding vertical 60px
- Card do CTA final → padding `52px 28px`
- `.faq-q` → 16px, padding `20px 4px`

---

## 8. Comportamentos JS

### 8.1 Scroll reveal (progressive enhancement)

- Estado visível por padrão (sem JS nada fica oculto). Ao rodar, o JS adiciona `reveal-on` ao `<html>`, armando: `html.reveal-on .reveal:not(.in) { opacity: 0; transform: translateY(26px); }`
- Transição do `.reveal`: `opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)`; delays escalonados via `transition-delay` inline (`.08s`, `.12s`, `.16s`)
- `IntersectionObserver` com `{ threshold: 0.08, rootMargin: '0px 0px -40px 0px' }`; ao intersectar: adiciona `.in`, força `opacity: 1; transform: none` e faz `unobserve`
- Snap de segurança por elemento: após **850ms**, se `opacity < 0.99` (aba em background pausa transições), zera a transition e aplica estado final
- Fallback adicional `showInView()` por `getBoundingClientRect` (`top < vh − 40 && bottom > 0`) rodando em `load` e `scroll` (passive)
- Garantia global: `setTimeout` de **2600ms** revela todos os `.reveal` independentemente de scroll/observer

### 8.2 Nav opaca no scroll

- `nav.classList.toggle('scrolled', window.scrollY > 12)` — executado imediatamente e em `scroll` (passive)
- `.scrolled`: borda inferior `--psi-neutral-200` e fundo `rgba(250,249,247,.92)`; transição `.3s ease`

### 8.3 Accordion do FAQ

- Itens construídos dinamicamente por JS a partir do array `faqs` (pares [pergunta, resposta] — texto integral em §1.8) e injetados em `#faqList`
- **Apenas um aberto por vez**: ao clicar, fecha todos os `.faq-item.open` (remove classe, `maxHeight = null`, `aria-expanded="false"`); se o clicado não estava aberto, abre com `ans.style.maxHeight = ans.scrollHeight + 'px'` e `aria-expanded="true"`
- Clicar no item aberto o fecha (toggle)
- Animações: `max-height .4s cubic-bezier(.4,0,.2,1)` + `opacity .4s ease`; chevron "+" rotaciona 45° (vira "×") em `.35s cubic-bezier(.4,0,.2,1)`

### 8.4 Máscara de WhatsApp

- No evento `input` do campo `#whats`: remove não-dígitos, limita a **11 dígitos**, formata progressivamente:
  - ≥1 dígito: `(XX`
  - ≥2 dígitos: `(XX) XXXXX`
  - ≥7 dígitos: `(XX) XXXXX-XXXX`

### 8.5 Validação inline do formulário

- Form com `novalidate`; validação própria no submit (preventDefault)
- Campos `nome`, `whats`, `email`: se vazios (trim), `borderColor = var(--psi-error-medium)`; senão limpa
- E-mail: regex `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`; falha também marca borda de erro
- Se inválido, aborta o envio (sem mensagens de texto — só cor de borda)

### 8.6 Submit e estado de sucesso

- Botão: `disabled = true`, texto vira "Enviando…"
- `fetch POST https://formspree.io/f/${FORMSPREE_ID}` com `FormData` e header `Accept: application/json`
- Sucesso: esconde o form (`display: none`), mostra `#leadSuccess` (`display: block`), dispara `fbq('track', 'Lead')` se o Pixel existir
- Erro: reabilita o botão, restaura o texto, `alert('Erro ao enviar. Verifique sua conexão e tente novamente.')`

---

## 9. Inventário de CTAs

| Local | Texto | Estilo | Destino |
|---|---|---|---|
| Nav (direita) | Acesso antecipado | btn-primary compacto (11px 20px, 15px) | `#lista` |
| Hero (primário) | Quero acesso antecipado | btn-primary | `#lista` |
| Hero (secundário) | Ver como funciona | btn-ghost + ícone seta | `#solucao` |
| Lead form (submit) | Quero acesso antecipado | btn-primary full-width (padding 17px, 17px) | submit → Formspree |
| CTA final | Quero acesso antecipado | btn-white | `#lista` |
| Nav links | O problema / Recursos / Como funciona / Dúvidas | `.nav-link` | `#problema` / `#solucao` / `#como` / `#faq` |
| Footer navegação | Sobre / FAQ / Contato | `.nav-link` 15px | `#solucao` / `#faq` / `#lista` |
| Footer legal | Política de Privacidade / Termos de Uso | `.nav-link` 15px | `#` (placeholders) |
| Logo da nav | (imagem) | — | `#top` |

Conversão única da página: entrar na lista de espera (`#lista`).

---

## 10. Assets

Local no repositório do protótipo: `project/assets/`

| Arquivo | Uso | Dimensões de exibição | Tratamento |
|---|---|---|---|
| `psiops-logo-trim.png` | Logo da nav | `height: 34px; width: auto` | — |
| `psiops-logo-trim.png` | Logo do footer | `height: 30px; width: auto` | — |
| `psiops-logo.png` | Variante completa do logo | não usada na página | disponível no bundle |
| `psiops-mark.png` | Favicon (`<link rel="icon">`) | — | — |
| `psiops-mark.png` | Marca no CTA final | `height: 54px`, centralizada, `margin-bottom: 26px` | `filter: brightness(0) invert(1); opacity: .92` (invertida para branco) |
| `og-image.png` | Open Graph (1200×630) | — | **ainda não existe** — criar |

---

## Apêndice — especificações completas dos utilitários base

```css
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 9px;
  font-family: var(--font-display); font-weight: 600; font-size: 16px;
  padding: 15px 26px; border-radius: 14px; cursor: pointer; border: 1px solid transparent;
  transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease,
              background .2s ease, color .2s ease;
  text-decoration: none; white-space: nowrap;
}
.btn-primary { background: var(--psi-accent-600); color: #fff; box-shadow: 0 6px 18px rgba(188,92,69,.28); }
.btn-primary:hover { background: var(--psi-accent-700); transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 28px rgba(188,92,69,.34); }
.btn-ghost { background: transparent; color: var(--psi-primary-700); border-color: var(--psi-primary-200); }
.btn-ghost:hover { background: var(--psi-primary-50); border-color: var(--psi-primary-300); transform: translateY(-2px); }
.btn-white { background: #fff; color: var(--psi-primary-700); box-shadow: 0 8px 24px rgba(0,0,0,.18); }
.btn-white:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 14px 34px rgba(0,0,0,.24); }

.eyebrow { font-family: var(--font-display); font-weight: 600; font-size: 13px;
           letter-spacing: .14em; text-transform: uppercase; color: var(--psi-accent-700); }

.pill { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-display);
        font-weight: 500; font-size: 13.5px; color: var(--psi-primary-700);
        background: var(--psi-primary-100); border: 1px solid var(--psi-primary-200);
        padding: 7px 14px 7px 11px; border-radius: 999px; }

.card { background: var(--psi-neutral-0); border: 1px solid var(--psi-neutral-200);
        border-radius: 22px; box-shadow: var(--shadow-card); }

.reveal { transition: opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
html.reveal-on .reveal:not(.in) { opacity: 0; transform: translateY(26px); }

.lift { transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s ease; }
.lift:hover { transform: translateY(-4px) scale(1.015); box-shadow: var(--shadow-lift); }

.ico { stroke: currentColor; stroke-width: 1.6; fill: none;
       stroke-linecap: round; stroke-linejoin: round; }

.field { width: 100%; font-family: var(--font-body); font-size: 16px;
         color: var(--psi-neutral-900); background: var(--psi-neutral-0);
         border: 1px solid var(--psi-neutral-300); border-radius: 13px; padding: 14px 16px;
         transition: border-color .2s ease, box-shadow .2s ease; }
.field:focus { outline: none; border-color: var(--psi-primary-400);
               box-shadow: 0 0 0 4px var(--psi-primary-100); }
.field::placeholder { color: var(--psi-neutral-500); }
label.lbl { font-family: var(--font-display); font-weight: 500; font-size: 13.5px;
            color: var(--psi-neutral-700); display: block; margin-bottom: 7px; }
```
