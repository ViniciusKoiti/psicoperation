# @psiops/testing

Caixa de ferramentas de teste do lado JS/TS do monorepo PsiOps:

- **Builders determinísticos de fixtures**, tipados pelos tipos gerados de
  `@psiops/contracts` (nunca redeclarados aqui);
- **Infraestrutura genérica de mock adapters em memória** (padrão ADR 0006);
- **Helpers Vitest** de setup/reset e asserções de formato recorrentes.

É **devDependency** dos consumidores e nunca entra em bundle de produção.

```jsonc
// package.json do consumidor
"devDependencies": {
  "@psiops/testing": "workspace:*"
}
```

## Builders determinísticos

Determinismo por seed fixa: a **mesma seed produz exatamente os mesmos dados em
qualquer máquina** (PRNG próprio — mulberry32 + FNV-1a — só aritmética inteira
de 32 bits, sem dependência externa). Isso dá testes reprodutíveis e snapshots
estáveis.

Entidades cobertas: domínio completo do MVP — `User`, `Lead`, `Patient`,
`Appointment`, `Charge`, `Task` e `Reminder` (mais os respectivos payloads de
criação, ex. `PatientCreateRequest`). Os dados respeitam os formatos da spec:
UUID v4, e-mail válido, WhatsApp brasileiro E.164 (`+55DD9XXXXXXXX`, DDD sem
zero), instantes ISO 8601 em UTC, datas civis `YYYY-MM-DD` e valores
monetários em centavos inteiros BRL. Nenhum builder gera dado clínico —
pacientes/consultas só carregam campos administrativos e de cobrança, como os
próprios contratos exigem.

### Builders avulsos

```ts
import { buildLead, buildUser, buildUsers } from "@psiops/testing";

const user = buildUser(); // seed padrão — sempre o mesmo User
const lead = buildLead({ seed: "meu-teste" }); // seed própria do teste
const admin = buildUser({ overrides: { name: "Ana Beatriz Souza" } });
const users = buildUsers(10, { seed: 42 }); // série reprodutível de 10
```

Overrides são `Partial<T>` tipados pelos contratos e sobrepõem os valores
gerados campo a campo.

### Fábrica com sequência (`createFixtures`)

Para vários registros distintos dentro de um mesmo teste, use a fábrica: cada
chamada avança a sequência (ids/e-mails diferentes), mas a série inteira é
reprodutível para a mesma seed.

```ts
import { createFixtures } from "@psiops/testing";

const fixtures = createFixtures("lista-de-espera");
const primeira = fixtures.lead();
const segunda = fixtures.lead({ email: "fixa@exemplo.com.br" });
fixtures.reset(); // volta ao início: a próxima chamada repete `primeira`
```

Overrides não afetam o determinismo das entidades seguintes — o PRNG é
consumido da mesma forma com ou sem override.

## Mock adapters em memória (ADR 0006)

`InMemoryStore<T>` é o bloco genérico que os apps estendem/compõem para
implementar seus `Mock*Adapter` sem rede nem banco: estado em memória, isolado
por `structuredClone`, com `reset()` para voltar ao estado inicial.

```ts
import { InMemoryStore, createFixtures } from "@psiops/testing";
import type { Lead } from "@psiops/contracts";

const fixtures = createFixtures("leads");

class MockLeadAdapter {
  private readonly store = new InMemoryStore<Lead>();

  create(input: { name: string; whatsapp: string; email: string }): Lead {
    if (this.store.find((lead) => lead.email === input.email)) {
      throw new Error("e-mail já cadastrado");
    }
    return this.store.save(fixtures.lead(input));
  }

  list(): Lead[] {
    return this.store.list();
  }

  reset(): void {
    this.store.reset();
    fixtures.reset();
  }
}
```

API: `save` (upsert), `saveAll`, `get`, `getOrThrow`, `has`, `list(predicate?)`,
`find(predicate)`, `delete`, `clear`, `reset`, `size`. Por padrão o id vem da
propriedade `id` (string); para outros formatos passe `getId` nas opções.
`initialItems` define o estado restaurado por `reset()`.

Mocks são padrão em dev/teste e **proibidos em build de produção** (a
verificação automatizada chega com as integrações HTTP reais, PSI-044/045).

## Helpers Vitest (`@psiops/testing/vitest`)

Subpath separado para manter o entry point principal livre do runner
(`vitest` é peer dependency opcional).

```ts
import {
  resetBetweenTests,
  useFixtures,
  expectUuid,
  expectEmail,
  expectWhatsAppBR,
  expectIsoDate,
  expectIsoDateTime,
} from "@psiops/testing/vitest";

const store = new InMemoryStore<Lead>({ initialItems: [buildLead()] });
resetBetweenTests(store); // beforeEach: restaura o estado inicial

const fixtures = useFixtures("meu-arquivo"); // beforeEach: reinicia a sequência

it("valida formatos dos contratos", () => {
  const lead = fixtures.lead();
  expectUuid(lead.id);
  expectEmail(lead.email);
  expectWhatsAppBR(lead.whatsapp);
  expectIsoDateTime(lead.createdAt);
});
```

- `resetBetweenTests(...resettables)` — registra `beforeEach` chamando
  `reset()` em cada alvo (`InMemoryStore`, `Fixtures` ou qualquer objeto com
  `reset(): void`).
- `useFixtures(seed?)` — cria uma fábrica reiniciada antes de cada teste, para
  que todo teste veja a mesma sequência independentemente da ordem.
- `expectUuid` / `expectEmail` / `expectWhatsAppBR` / `expectIsoDate` /
  `expectIsoDateTime` — asserções dos formatos dos contratos, com mensagens
  claras. As regexes brutas também são exportadas em `patterns` (entry
  principal) para uso direto.

## Escopo e evolução

- Cobre o domínio completo do MVP (ver "Entidades cobertas" acima). Registros
  administrativos de consulta (`AttendanceRecord`, PSI-025) e configurações
  (`Settings`) ainda não têm builder dedicado — adicionar aqui se/quando um
  consumidor (app ou E2E) precisar.
- Fora de escopo: utilitários para Java (JUnit/Testcontainers) e Flutter, e
  mocks de rede nível HTTP (ex.: MSW).

## Scripts

```bash
pnpm --filter @psiops/testing build      # emite dist/ (tsc)
pnpm --filter @psiops/testing test       # vitest
pnpm --filter @psiops/testing typecheck  # tsc --noEmit (src + tests)
pnpm --filter @psiops/testing lint       # eslint
```
