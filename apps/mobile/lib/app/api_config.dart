/// Configuração da API HTTP consumida pelos adapters reais (ex.:
/// [HttpAuthAdapter]).
///
/// A spec (`packages/contracts/openapi/openapi.yaml`, `servers`) declara
/// apenas o caminho relativo `/api/v1` — o host concreto é responsabilidade
/// de cada ambiente, conforme o comentário da própria spec ("Ambientes
/// concretos são configurados por env, não na spec"). Aqui isso é resolvido
/// via `--dart-define=PSIOPS_API_BASE_URL=<host>/api/v1`.
///
/// Exercitado contra a API real na integração mobile (PSI-045), inclusive
/// pela suíte `integration_test/` (ver `apps/mobile/README.md` para como
/// apontar para a API local subida via docker compose + `./mvnw
/// spring-boot:run`). O valor default abaixo é apenas um placeholder
/// plausível para manter o app compilável sem exigir o `--dart-define` em
/// builds de desenvolvimento/teste (que usam o adapter mock e nunca chegam a
/// montar este client).
abstract final class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'PSIOPS_API_BASE_URL',
    defaultValue: 'https://api.psiops.com.br/api/v1',
  );
}
