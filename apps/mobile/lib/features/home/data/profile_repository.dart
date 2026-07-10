import 'package:psiops_contracts/api.dart';

/// Porta de acesso ao perfil da psicóloga autenticada.
///
/// O tipo de domínio [User] vem de `packages/contracts/gen/dart`
/// (codegen do `openapi.yaml` — fonte única de contratos, ADR 0008). O app
/// **nunca** redefine DTOs de API localmente; apenas os consome.
///
/// [updateProfile] foi adicionado na PSI-043 (tela de configurações, edição
/// de perfil). Escopo MVP: apenas o nome de exibição é editável — o e-mail é
/// o identificador de login (`User.email`, único por conta) e a spec
/// OpenAPI não modela um endpoint de alteração de e-mail nem de outros
/// campos de perfil; ver assumption correspondente no manifesto PSI-043.
abstract interface class ProfileRepository {
  Future<User> currentProfile();

  /// Atualiza o nome de exibição da conta autenticada e retorna o [User]
  /// atualizado.
  Future<User> updateProfile(String name);
}

/// Adapter em memória usado no ambiente [AppEnvironment.dev].
///
/// Fornece um [User] fixo (mutável apenas via [updateProfile]), sem rede,
/// para exercitar o pipeline de estado e UI no scaffold. O adapter real
/// (HTTP contra a API) chega na integração mobile (PSI-045); este mock nunca
/// deve ser selecionado em produção.
final class InMemoryProfileRepository implements ProfileRepository {
  InMemoryProfileRepository();

  User _user = User(
    id: 'demo-user',
    name: 'Dra. Ana Prado',
    email: 'ana@exemplo.com.br',
    // Data fixa (ISO 8601) — determinística para testes; não usar relógio.
    createdAt: DateTime.utc(2026, 1, 1),
  );

  Future<void> _delay() => Future<void>.delayed(const Duration(milliseconds: 10));

  @override
  Future<User> currentProfile() async {
    await _delay();
    return _user;
  }

  @override
  Future<User> updateProfile(String name) async {
    await _delay();
    _user = User(id: _user.id, name: name, email: _user.email, createdAt: _user.createdAt);
    return _user;
  }
}
