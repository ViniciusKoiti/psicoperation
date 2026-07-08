/// Configuração por ambiente do app companion.
///
/// Decisão registrada (PSI-013): o MVP **não** usa flavors nativos
/// (Android/iOS) — a separação de ambientes é feita apenas no entrypoint Dart,
/// via [AppEnvironment]. Isso mantém o scaffold simples; flavors nativos
/// (staging distribuído, ícones por ambiente) ficam para quando houver
/// necessidade real de distribuição segmentada.
///
/// Regra de segurança: o default é [AppEnvironment.dev] com **mocks em
/// memória**, mas o `main.dart` de produção deve selecionar explicitamente
/// [AppEnvironment.prod]; adapters reais (HTTP) só chegam na integração
/// (fora do escopo deste scaffold).
enum AppEnvironment {
  /// Desenvolvimento: adapters em memória (mocks), sem rede.
  dev,

  /// Produção: adapters reais (HTTP contra a API). Ainda não implementado
  /// neste scaffold — ver PSI-045 (integração mobile).
  prod;

  /// Lê o ambiente de `--dart-define=PSIOPS_ENV=prod|dev`.
  /// Ausente ou desconhecido → [AppEnvironment.dev] (default seguro para
  /// desenvolvimento local e testes).
  static AppEnvironment fromDartDefine() {
    const raw = String.fromEnvironment('PSIOPS_ENV', defaultValue: 'dev');
    return AppEnvironment.values.firstWhere(
      (e) => e.name == raw,
      orElse: () => AppEnvironment.dev,
    );
  }

  bool get usesMocks => this == AppEnvironment.dev;
}
