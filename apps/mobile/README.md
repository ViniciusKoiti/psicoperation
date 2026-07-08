# psiops_mobile

App companion mobile do PsiOps (Flutter/Dart). Complementa o web da clínica
com acesso rápido em movimento para a psicóloga. Este pacote é o **scaffold**
(PSI-013): entrega a fundação técnica — tema, navegação, estrutura por
features e consumo de contratos — sem features de domínio.

## Requisitos

- Flutter **3.32.x** (Dart 3.8), conforme `environment.sdk` no `pubspec.yaml`.
  Ambiente local usa 3.32.4; CI usa 3.32.5.

## Comandos

```bash
flutter pub get        # resolve dependências (inclui psiops_contracts por path)
flutter analyze        # análise estática — deve terminar sem issues
flutter test           # testes (smoke test da Home)
flutter run            # roda no dispositivo/emulador conectado
```

Ambiente é selecionado por `--dart-define`:

```bash
flutter run --dart-define=PSIOPS_ENV=dev   # default: adapters em memória (mock)
```

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
  features/
    home/                       feature placeholder demonstrando o padrão por camadas
      data/profile_repository.dart    porta + adapter em memória (mock)
      state/home_controller.dart      estado (ChangeNotifier), separado da UI
      presentation/home_screen.dart   apresentação
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
  é `dev` com mocks; `prod` sem adapter real falha explícito (evita mock vazar).
- **Fontes embarcadas**: DM Sans / Inter / Fraunces são assets locais (não
  `google_fonts`), evitando fetch em runtime — previsibilidade offline e LGPD.
  Licenças OFL registradas no `LicenseRegistry` (ver `main.dart`).

## Fora de escopo (scaffold)

Features de domínio (pacientes, mensalidades, cobranças), integração HTTP real
(chega na PSI-045), push, deep links e autenticação.
