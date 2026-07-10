# psiops_mobile

App companion mobile do PsiOps (Flutter/Dart). Complementa o web da clínica
com acesso rápido em movimento para a psicóloga: autenticação, agenda,
pacientes e financeiro (PSI-013 a PSI-043), ligado à API real na integração
mobile (PSI-045, ver seção correspondente abaixo).

## Requisitos

- Flutter **3.32.x** (Dart 3.8), conforme `environment.sdk` no `pubspec.yaml`.
  Ambiente local usa 3.32.4; CI usa 3.32.5.

## Comandos

```bash
flutter pub get        # resolve dependências (inclui psiops_contracts por path)
flutter analyze        # análise estática — deve terminar sem issues (inclui integration_test/)
flutter test           # testes unit/widget com mock (padrão) + checagem anti-mock de release
flutter run            # roda no dispositivo/emulador conectado
```

Ambiente é selecionado por `--dart-define`:

```bash
flutter run --dart-define=PSIOPS_ENV=dev   # default: adapters em memória (mock)
flutter run --dart-define=PSIOPS_ENV=prod --dart-define=PSIOPS_API_BASE_URL=https://api.psiops.com.br/api/v1
```

`PSIOPS_ENV=prod` seleciona os `Http*Adapter` reais no ponto de composição
único (`app/app.dart`) — mock nunca é usado nesse ambiente. `dev` (default,
usado por `flutter run`/`flutter test` sem flags) continua usando os
adapters em memória, sem rede.

## Integração real com a API (PSI-045)

Todos os `Http*Adapter` (auth, agenda/dashboard, pacientes, financeiro/
configurações) são clients reais, tipados pelos modelos Dart de
`packages/contracts/gen/dart`, e mapeiam falhas de rede/parsing para as
mesmas exceções de domínio que a UI já trata (mensagens pt-BR, sem crash em
falha de conexão — ver `lib/app/http_adapter_support.dart`).

### 1. Subir a infraestrutura local

Da raiz do monorepo (não deste diretório):

```bash
docker compose up -d               # PostgreSQL 16 + Mailpit (docs em docs/infra/README.md)
docker compose ps                  # aguarde ambos "healthy"

# instala os DTOs de contrato no repositório Maven local (uma vez, ou após mudança no contrato)
mvn -f packages/contracts/gen/java/pom.xml install

cd apps/api
export JAVA_HOME=~/.local/jdk/current && export PATH="$JAVA_HOME/bin:$PATH"
./mvnw spring-boot:run              # sobe a API Spring em http://localhost:8080
```

Aguarde `GET http://localhost:8080/actuator/health` responder `200 UP`
antes de rodar a suíte — a API pode levar alguns segundos para subir depois
do Postgres/Flyway.

### 2. Apontar o app para a API local

- **Desktop Linux** (`flutter config --enable-linux-desktop`, se ainda não
  habilitado) ou **emulador Android**: use `--dart-define=PSIOPS_API_BASE_URL`.
  - Desktop Linux / navegador rodando na mesma máquina: `http://localhost:8080/api/v1`.
  - Emulador Android: use `http://10.0.2.2:8080/api/v1` (o emulador não
    enxerga `localhost` do host) — ver open_question do manifesto PSI-045
    sobre padronizar esse valor por ambiente.
- Cleartext HTTP (sem TLS) para esses hosts já está liberado **apenas na
  variante debug** do Android (`android/app/src/debug/AndroidManifest.xml`,
  `usesCleartextTraffic="true"`) — a variante de release/produção continua
  exigindo HTTPS normalmente.

### 3. Rodar a suíte `integration_test`

Cobre o caminho crítico: **login (registro de conta nova) → criar paciente
→ agendar consulta**, com asserções sobre o estado final na UI (perfil na
Home, paciente na lista, consulta na agenda do dia). Cada execução registra
uma conta e um paciente com nomes/e-mail únicos (derivados do relógio), então
pode ser reexecutada sem limpar o banco manualmente.

Precisa de um dispositivo/emulador Android conectado, ou do target desktop
Linux habilitado (`flutter config --enable-linux-desktop`, reinicie o
`flutter devices` depois):

```bash
cd apps/mobile
flutter devices   # confirme que há ao menos um device/emulador/desktop

flutter test integration_test/app_test.dart \
  --dart-define=PSIOPS_API_BASE_URL=http://10.0.2.2:8080/api/v1   # ajuste o host conforme o target
```

Esta suíte **não roda** como parte do `flutter test` padrão (que não deve
depender de rede) nem do CI (execução em emulador/desktop no pipeline é uma
questão aberta do manifesto PSI-045) — é uma etapa manual/local, documentada
aqui.

### 4. Checagem "sem mocks no build de release"

Roda localmente **sem a API** (é parte do `flutter test` padrão, mas pode
ser executada isolada):

```bash
flutter test test/release_guard/release_composition_excludes_mocks_test.dart
```

Falha se algum adapter `InMemory*` (mock) for construído fora do braço
`if (environment.usesMocks)` do ponto de composição (`app/app.dart`) ou se
qualquer outro arquivo de `lib/` construir e retornar um mock — ver
docstring do teste para os detalhes de como a checagem funciona (inspeção
estática do código-fonte, já que o app não usa flavors nativos/entrypoints
separados para comparar via tree-shaking).

## Arquitetura

```
lib/
  main.dart                     entrypoint; resolve ambiente e registra licenças OFL
  app/
    app.dart                    raiz (MaterialApp.router): tema + router + injeção de adapter
    env.dart                    AppEnvironment (dev/prod); sem flavors nativos no MVP
    router.dart                 go_router: rotas nomeadas + tela de rota desconhecida
    theme.dart                  ThemeData Material 3 derivado dos tokens (mapeamento documentado)
    tokens.dart                 cores/tipografia espelhadas de packages/ui/tokens.json
    api_config.dart             base URL da API real, por --dart-define
    http_adapter_support.dart   mapeamento compartilhado de erro de rede/parsing → exceção de domínio (PSI-045)
  features/
    <feature>/
      data/<feature>_adapter.dart        porta (interface) + InMemory*Adapter (mock, padrão dev/test)
      data/http_<feature>_adapter.dart   client HTTP real, tipado por packages/contracts/gen/dart
      state/<feature>_controller.dart    estado (ChangeNotifier), separado da UI
      presentation/<feature>_screen.dart apresentação
integration_test/
  app_test.dart                  login → criar paciente → agendar consulta, contra a API real (PSI-045)
test/release_guard/
  release_composition_excludes_mocks_test.dart   checagem anti-mock de release (PSI-045)
```

### Decisões registradas

- **Tema a partir de tokens**: `theme.dart` mapeia cada slot do `ColorScheme`
  Material 3 para um token de `packages/ui/tokens.json` (tabela no docstring da
  classe `PsiTheme`), para auditoria de fidelidade visual. App é light-only no
  MVP (o design system define só a paleta clara).
- **Contratos consumidos, nunca redefinidos**: os DTOs (`User`, etc.) vêm de
  `packages/contracts/gen/dart` via path dependency (`psiops_contracts`). Fonte
  única é o `openapi.yaml` (ADR 0008).
- **Sem flavors nativos no MVP**: a separação de ambientes é feita só no
  entrypoint Dart (`AppEnvironment`), não em flavors Android/iOS. Default seguro
  é `dev` com mocks; `prod` sempre usa os adapters HTTP reais (PSI-045) — nunca
  o mock, verificado pela checagem automatizada da seção acima.
- **Fontes embarcadas**: DM Sans / Inter / Fraunces são assets locais (não
  `google_fonts`), evitando fetch em runtime — previsibilidade offline e LGPD.
  Licenças OFL registradas no `LicenseRegistry` (ver `main.dart`).

## Divergências conhecidas entre mocks/contratos e a API real (PSI-045)

Confirmadas ao ligar os `Http*Adapter` contra a API real; correções exigem
mudança em `packages/contracts` (fora dos `allowed_paths` desta tarefa) —
registradas aqui e no PR para o orquestrador tratar:

- **Sem endpoint de escrita de perfil**: a spec OpenAPI não modela alteração
  de nome de exibição (nem de outros campos de perfil). `currentProfile()`
  usa `GET /auth/session`; `updateProfile()` (tela de configurações) sempre
  falha com mensagem pt-BR (`HttpProfileRepository`).
- **Preferências de lembrete de cobrança sem contrato**: `Settings`/`Reminder`
  não modelam liga/desliga + antecedência de lembrete por conta. Antes desta
  tarefa, `HttpSettingsAdapter.getReminderPreferences` lançava
  incondicionalmente — como a tela de configurações carrega perfil, valor
  padrão de sessão e preferências de lembrete numa única chamada, isso fazia
  a tela inteira cair em erro permanente contra a API real. Corrigido para
  manter um valor local (em memória, não persistido/sincronizado) em vez de
  lançar.
- **Sem leitura em lote do histórico de presença por paciente**:
  `HttpPatientsAdapter.listAdministrativeRecords` retorna sempre vazio — a
  spec só expõe escrita de presença por consulta, sem endpoint de leitura em
  lote por paciente.

## Fora de escopo

Execução de `integration_test` em CI (emulador/desktop no pipeline — questão
aberta do manifesto PSI-045), integração web real (PSI-044), push, deep
links e testes de carga/performance contra a API.
