# psiops-api

Backend único do PsiOps: Spring Boot 3 sobre Java 21, com Axon Framework (nas
tarefas de domínio), JPA/Hibernate e Flyway sobre PostgreSQL. Este é o
**scaffold** (PSI-010): sobe a aplicação com `/actuator/health`, a migration
inicial e a infraestrutura de testes — sem endpoints de negócio.

## Requisitos

- **JDK 21** (Temurin recomendado). Localmente: `~/.local/jdk/current`
  (`export JAVA_HOME=~/.local/jdk/current`).
- **Docker** em execução — os testes de integração usam Testcontainers
  (PostgreSQL real).
- Os DTOs de contrato (`com.psiops:psiops-contracts`) precisam estar no
  repositório Maven local. Instale-os a partir do codegen comitado:

  ```bash
  # na raiz do monorepo
  mvn -f packages/contracts/gen/java/pom.xml install
  ```

## Comandos

```bash
cd apps/api
./mvnw verify          # compila, roda testes (Testcontainers) e empacota
./mvnw spring-boot:run # sobe a API (usa o PostgreSQL do docker compose — PSI-003)
```

A conexão lê as variáveis do `.env.example` (PSI-003):
`POSTGRES_HOST/PORT/USER/PASSWORD/DB` (defaults `localhost:5432`, `psiops`).

## Organização (módulos de domínio × camadas)

Cada domínio é um pacote de topo sob `com.psiops.api` (`auth`, `lead`,
`settings`); dentro dele, as camadas `web` / `application` / `domain` /
`persistence`. Ver o `package-info.java` do pacote raiz. Neste scaffold só
existem as camadas exercitadas: `persistence` nos três módulos e `application`
(mapper para o DTO de contrato) em `lead`. Endpoints de negócio e os agregados
state-stored do Axon chegam com as features.

## Persistência e migrations

- Flyway em `src/main/resources/db/migration` (`V1__init.sql` cria `users`,
  `settings`, `leads`). **Migrations são sequenciais e imutáveis após o
  merge** (ADR 0009): correções vêm em novas versões, nunca editando a V1.
- Hibernate roda com `ddl-auto: validate` — o Flyway é o dono do schema; o JPA
  apenas valida o mapeamento contra as tabelas. Se entidade e schema
  divergirem, o contexto (e os testes) falham ao subir.
- Identificadores são UUID gerados pela aplicação (open_question do manifesto,
  até definição arquitetural).

## Testes

- `PsiopsApiApplicationTests` — sobe o contexto contra PostgreSQL real
  (Testcontainers), aplica a V1 e valida o mapeamento JPA.
- `HealthEndpointTest` — `GET /actuator/health` responde `200 UP`.
- `LeadRepositoryTest` — persiste/lê um lead e mapeia para o DTO de contrato
  `com.psiops.contracts.model.Lead` (prova o consumo do gen/java).

## Dados de demonstração (perfil `demo`)

`com.psiops.api.demo.DemoDataSeeder` (PSI-046) é um `ApplicationRunner`
ativo **somente** com o perfil Spring `demo` — nenhum outro perfil (incluindo
o default usado em dev/produção) semeia dado algum:

```bash
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
```

Cria, usando os MESMOS casos de uso (`*Service`) expostos via HTTP — nunca
`INSERT` cru contornando regras de domínio: 1 psicóloga demo (credenciais
abaixo), ~8 pacientes fictícios sem qualquer dado clínico (apenas nome,
WhatsApp/e-mail, valor de mensalidade e dia de vencimento), agenda de 2
semanas em torno do dia em que a API sobe, mensalidades nos três status do
contrato (`em_dia`, `pendente`, `atrasada`), e tarefas/lembretes de exemplo.

- **Idempotente**: reiniciar a API no perfil `demo` contra o mesmo banco não
  duplica nada — cada tipo de entidade é conferido e completado
  independentemente antes de criar (não apenas "a psicóloga demo já existe,
  então paro"), então uma reexecução após uma falha parcial também não deixa
  duplicata nem buraco.
- **Determinístico em relação à data de execução**: a agenda e os
  vencimentos de mensalidade são calculados a partir de um `Clock` injetado
  (nunca `LocalDate.now()`/`OffsetDateTime.now()` direto) — ver
  `com.psiops.api.demo.DemoDatePlanner`, testado isoladamente com relógio
  fixo em `DemoDatePlannerTest`.
- Cobertura de integração (Testcontainers) em
  `com.psiops.api.demo.DemoDataSeederDemoProfileIntegrationTest` (ativação,
  idempotência, ausência de dado clínico, credenciais funcionais) e
  `DemoDataSeederOtherProfilesIntegrationTest` (nada é semeado fora do
  perfil `demo`).

Credenciais (fixas, públicas, exclusivas deste perfil local — nunca usar em
produção):

| Campo | Valor |
| --- | --- |
| E-mail | `demo@psiops.com.br` |
| Senha | `PsiopsDemo123!` |

Ver também [`docs/setup.md`](../../docs/setup.md) e
[`docs/release-checklist.md`](../../docs/release-checklist.md).

> Nota de ambiente (WSL2 + Docker recente): se o Testcontainers reclamar
> `client version 1.32 is too old`, exporte `DOCKER_HOST=unix:///var/run/docker.sock`
> e rode com `./mvnw verify -DargLine="-Dapi.version=1.43"`. É um contorno
> local do docker-java com daemons Docker muito novos; o CI não precisa dele.
