import 'package:psiops_contracts/api.dart';

/// Porta de acesso ao perfil da psicóloga autenticada.
///
/// O tipo de domínio [User] vem de `packages/contracts/gen/dart`
/// (codegen do `openapi.yaml` — fonte única de contratos, ADR 0008). O app
/// **nunca** redefine DTOs de API localmente; apenas os consome.
abstract interface class ProfileRepository {
  Future<User> currentProfile();
}

/// Adapter em memória usado no ambiente [AppEnvironment.dev].
///
/// Fornece um [User] fixo, sem rede, para exercitar o pipeline de estado e
/// UI no scaffold. O adapter real (HTTP contra a API) chega na integração
/// mobile (PSI-045); este mock nunca deve ser selecionado em produção.
final class InMemoryProfileRepository implements ProfileRepository {
  const InMemoryProfileRepository();

  @override
  Future<User> currentProfile() async {
    return User(
      id: 'demo-user',
      name: 'Dra. Ana Prado',
      email: 'ana@exemplo.com.br',
      // Data fixa (ISO 8601) — determinística para testes; não usar relógio.
      createdAt: DateTime.utc(2026, 1, 1),
    );
  }
}
