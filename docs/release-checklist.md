# Checklist de release do MVP

Checklist de fechamento (PSI-046) para validar que o monorepo está pronto
para release: os três ecossistemas verdes, a infraestrutura local sobe do
zero, e um smoke test manual no perfil de demonstração cobre os fluxos
centrais do produto. Pré-requisitos e comandos detalhados em
[`docs/setup.md`](./setup.md).

## 1. Os três ecossistemas verdes

- [ ] `pnpm install` na raiz termina sem erro (workspace JS/TS resolvido).
- [ ] `pnpm turbo run lint typecheck test build` — **verde** (lint, typecheck,
      testes e build de `apps/landing`, `apps/clinic` e `packages/*`).
- [ ] `cd apps/api && ./mvnw clean verify` — **BUILD SUCCESS** (compila,
      roda a suíte JUnit + Testcontainers com PostgreSQL real, empacota).
      Em WSL2 com Docker recente, usar o contorno documentado em
      `docs/setup.md` (`-DargLine="-Dapi.version=1.43"`).
- [ ] `cd apps/mobile && flutter analyze` — sem issues.
- [ ] `cd apps/mobile && flutter test` — todos os testes passam (inclui a
      checagem anti-mock de release, `test/release_guard/`).
- [ ] `node scripts/validate-task-scope.mjs --lint-all` — todos os manifestos
      de tarefa (`tasks/PSI-0NN.yaml`) válidos.

## 2. Infraestrutura local sobe do zero

- [ ] Em uma máquina/ambiente limpo (ou `docker compose down -v` para
      resetar), `docker compose up -d` sobe `postgres` e `mailpit`.
- [ ] `docker compose ps` mostra ambos os serviços `healthy` dentro de
      ~30s (healthchecks configurados em `docker-compose.yml`).
- [ ] `mvn -B -q -f packages/contracts/gen/java/pom.xml install` instala o
      jar de contratos Java no repositório Maven local sem erro.
- [ ] `cd apps/api && ./mvnw spring-boot:run` sobe a API; `GET
      http://localhost:8080/actuator/health` responde `200 UP`.

## 3. Smoke test com o perfil demo

Sobe a API com dados de demonstração completos (ver
`com.psiops.api.demo.DemoDataSeeder`, PSI-046) e verifica manualmente os
fluxos centrais do produto:

```bash
cd apps/api
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
```

- [ ] O log de startup mostra `seed demo: concluído` (sem exceção).
- [ ] Login com as credenciais documentadas (`demo@psiops.com.br` /
      `PsiopsDemo123!`) funciona — via `POST /auth/login` direto ou pelo app
      web da clínica (`pnpm --filter @psiops/clinic dev`, apontado para
      `http://localhost:8080`).
- [ ] **Pacientes**: a carteira lista ~8 pacientes fictícios, todos com
      dados administrativos plausíveis (nome, WhatsApp/e-mail, valor da
      mensalidade em reais, dia de vencimento) e **nenhum campo de conteúdo
      clínico**.
- [ ] **Agenda**: consultas visíveis cobrindo aproximadamente duas semanas
      em torno do dia atual (passado recente + próximos dias).
- [ ] **Financeiro/mensalidades**: pelo menos uma cobrança em cada situação
      — *em dia* (paga), *pendente* (a vencer) e *atrasada* (vencida) — com
      valores em reais coerentes (centavos convertidos corretamente).
- [ ] **Tarefas**: lista de tarefas administrativas de exemplo, incluindo
      pelo menos uma já concluída e outras pendentes.
- [ ] **Lembretes**: lista de lembretes agendados (inclui os automáticos de
      véspera/dia de consulta, gerados a partir da agenda, e os manuais de
      exemplo).
- [ ] Reiniciar a API (`Ctrl+C` e subir de novo com o mesmo
      `SPRING_PROFILES_ACTIVE=demo`, mesmo banco) **não duplica** nenhum dos
      itens acima — reconferir as mesmas contagens de pacientes/consultas/
      cobranças/tarefas/lembretes.
- [ ] Subir a API **sem** `SPRING_PROFILES_ACTIVE=demo` (perfil default) e
      confirmar que a conta `demo@psiops.com.br` **não existe** nesse banco
      (ou, se o mesmo banco do smoke test acima foi reutilizado, que nenhum
      dado novo de demonstração é criado) — prova de que o seed é exclusivo
      do perfil demo.

## 4. Fechamento do PR

- [ ] `git status` limpo (nada além do commit pretendido).
- [ ] Diff restrito aos `allowed_paths` do manifesto da tarefa —
      `node scripts/validate-task-scope.mjs --task PSI-0NN --base origin/main`
      responde `OK: diff dentro do escopo`.
- [ ] Mensagem de commit no padrão *conventional commits*, com o sufixo
      `[PSI-0NN]`.
- [ ] PR aberto como **draft**, com o resultado (verde/vermelho, colado) de
      cada um dos três ecossistemas da seção 1, e qualquer `assumption`/
      `open_question` registrada no corpo do PR para o orquestrador.
