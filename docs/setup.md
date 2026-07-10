# Setup do zero

Guia único para preparar uma máquina limpa e rodar os três ecossistemas do
monorepo (JS/TS, API Java, app Flutter) mais a infraestrutura local. Os
passos abaixo foram verificados na prática (PSI-046) nesta ordem, em WSL2 +
Docker Desktop; ajustes específicos de outros sistemas operacionais estão
marcados como tal.

Para os comandos exatos de verificação (lint/typecheck/test/build) usados
antes de um PR, ver também [`docs/release-checklist.md`](./release-checklist.md).

## 1. Pré-requisitos

| Ferramenta | Versão | Como confirmar |
| --- | --- | --- |
| Node.js | 22 (fixado em `.nvmrc`) | `nvm use` então `node -v` |
| pnpm | 10.15.0 (fixado em `packageManager` no `package.json` raiz) | `corepack enable` resolve automaticamente; `pnpm -v` |
| JDK | 21 (Temurin recomendado) | `java -version` |
| Maven | via `./mvnw` (wrapper comitado em `apps/api`) — nenhuma instalação separada necessária | `cd apps/api && ./mvnw -v` |
| Docker | Engine com Compose v2+ (`docker compose`, sem hífen) | `docker compose version` |
| Flutter | 3.32.x / Dart 3.8 (fixado em `apps/mobile/pubspec.yaml`) | `flutter --version` |

Nenhuma dessas versões é negociável: os pipelines (`pnpm turbo run ...`,
`./mvnw verify`, `flutter analyze`/`flutter test`) foram desenhados e testados
contra elas especificamente.

## 2. Clonar e instalar o lado JS/TS

```bash
git clone <url-do-repo> psicoperation
cd psicoperation
nvm use            # Node 22
corepack enable     # garante o pnpm da versão fixada
pnpm install        # instala apps/{landing,clinic} e packages/* (workspace)
```

`apps/api` (Maven) e `apps/mobile` (Flutter) **não** entram nesse workspace —
são invocados diretamente (seção 4 e 5).

## 3. Subir a infraestrutura local (Docker Compose)

```bash
cp .env.example .env   # opcional — os defaults já funcionam sem editar nada
docker compose up -d
docker compose ps      # aguarde postgres e mailpit ficarem "healthy"
```

- PostgreSQL: `postgresql://psiops:psiops@localhost:5432/psiops`
- Mailpit (captura de e-mail): UI em <http://localhost:8025>, SMTP em `localhost:1025`

Detalhes completos (variáveis, reset de dados, logs) em
[`docs/infra/README.md`](./infra/README.md).

> **WSL2 + Docker Desktop**: se comandos Docker não encontrarem o daemon,
> exporte `DOCKER_HOST=unix:///var/run/docker.sock` antes de subir a
> infraestrutura e antes de rodar os testes de integração da API (seção 4).

## 4. API (Spring Boot + Axon)

```bash
export JAVA_HOME=~/.local/jdk/current   # ou o caminho do seu JDK 21
export PATH="$JAVA_HOME/bin:$PATH"
export DOCKER_HOST=unix:///var/run/docker.sock   # só se necessário (ver acima)

# instala os DTOs de contrato (com.psiops:psiops-contracts) no repositório
# Maven local — necessário antes de compilar apps/api pela primeira vez e
# após qualquer mudança em packages/contracts
mvn -B -q -f packages/contracts/gen/java/pom.xml install

cd apps/api
./mvnw clean verify      # compila, roda testes (Testcontainers, PostgreSQL real) e empacota
```

> **Contorno local (Testcontainers + Docker muito novo)**: se o build falhar
> com algo como `client version 1.32 is too old`, rode com
> `./mvnw clean verify -DargLine="-Dapi.version=1.43"`. É um contorno **só
> local** (docker-java conversando com daemons Docker recentes); o CI não
> precisa dele.

Subir a API de verdade (não só os testes), contra o Postgres do compose:

```bash
cd apps/api
./mvnw spring-boot:run
```

Aguarde `GET http://localhost:8080/actuator/health` responder `200 UP`.

### Perfil de demonstração (`demo`)

Para subir a API já povoada com dados de demonstração completos (psicóloga,
pacientes, agenda, mensalidades, tarefas, lembretes — ver
`com.psiops.api.demo.DemoDataSeeder`, PSI-046), ative o perfil Spring `demo`:

```bash
cd apps/api
SPRING_PROFILES_ACTIVE=demo ./mvnw spring-boot:run
```

O seed roda uma única vez por inicialização, é **idempotente** (reiniciar no
perfil `demo` não duplica dados) e **determinístico em relação à data de
execução** (a agenda de duas semanas e os vencimentos das mensalidades são
recalculados a partir do dia em que a API sobe). Nenhum outro perfil semeia
dado algum.

Credenciais da psicóloga demo (fixas, públicas, exclusivas deste perfil —
nunca usar em produção):

| Campo | Valor |
| --- | --- |
| E-mail | `demo@psiops.com.br` |
| Senha | `PsiopsDemo123!` |

## 5. App web da clínica e landing (Vite/React e Next.js)

```bash
pnpm --filter @psiops/clinic dev     # http://localhost:5173 (padrão Vite)
pnpm --filter @psiops/landing dev    # http://localhost:3000 (padrão Next.js)
```

Ambos dependem da API rodando (seção 4) para os fluxos autenticados; sem a
API, os apps caem nos adapters mock (ADR 0006) conforme configuração de
ambiente de cada um.

## 6. App mobile (Flutter)

```bash
cd apps/mobile
flutter pub get
flutter analyze
flutter test
flutter run --dart-define=PSIOPS_ENV=dev    # mocks em memória, sem rede
flutter run --dart-define=PSIOPS_ENV=prod --dart-define=PSIOPS_API_BASE_URL=http://localhost:8080/api/v1
```

Detalhes de integração real com a API (emulador Android vs. desktop, suíte
`integration_test`) em [`apps/mobile/README.md`](../apps/mobile/README.md).

## 7. Verificação de escopo (por tarefa, não faz parte do setup inicial)

```bash
node scripts/validate-task-scope.mjs --lint-all
node scripts/validate-task-scope.mjs --task PSI-0NN --base origin/main
```

## Resolução de problemas

- **`pnpm install` reclama de versão do pnpm**: rode `corepack enable` antes
  — `packageManager` no `package.json` raiz fixa a versão exata.
- **`./mvnw verify` falha ao resolver `com.psiops:psiops-contracts`**: rode o
  `mvn install` do passo 4 primeiro (o jar precisa estar no repositório Maven
  local; não é publicado em nenhum registry).
- **Testcontainers não sobe o PostgreSQL**: confirme `docker compose ps`
  saudável e, em WSL2, `DOCKER_HOST=unix:///var/run/docker.sock` (ver seção
  3/4).
- **`flutter analyze`/`flutter test` reclamam de SDK**: confirme a versão com
  `flutter --version` — precisa estar na série 3.32.x (Dart 3.8) fixada em
  `apps/mobile/pubspec.yaml`.
