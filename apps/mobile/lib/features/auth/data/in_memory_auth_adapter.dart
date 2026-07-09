import 'package:psiops_contracts/api.dart';

import 'auth_adapter.dart';

/// Adapter em memória usado no ambiente `AppEnvironment.dev` (e em testes).
///
/// Fornece uma usuária semente (`ana@exemplo.com.br` / `Psiops123`) para
/// exercitar o fluxo de login sem rede, e aceita registro de novas contas em
/// memória (perdidas ao reiniciar o processo — não há persistência real).
///
/// O adapter real (HTTP contra a API) é o `HttpAuthAdapter`; este mock nunca
/// deve ser selecionado em produção — a seleção é feita em `app/app.dart`.
final class InMemoryAuthAdapter implements AuthAdapter {
  InMemoryAuthAdapter() : _accounts = [_defaultSeedAccount];

  static final _SeedAccount _defaultSeedAccount = _SeedAccount(
    id: 'demo-user',
    name: 'Dra. Ana Prado',
    email: 'ana@exemplo.com.br',
    password: 'Psiops123',
    createdAt: DateTime.utc(2026, 1, 1),
  );

  final List<_SeedAccount> _accounts;
  int _tokenSequence = 0;

  @override
  Future<AuthResponse> login(String email, String password) async {
    await Future<void>.delayed(const Duration(milliseconds: 30));
    final account = _findByEmail(email);
    if (account == null || account.password != password) {
      throw const InvalidCredentialsException();
    }
    return _authResponseFor(account);
  }

  @override
  Future<AuthResponse> register(
    String name,
    String email,
    String password,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 30));
    if (_findByEmail(email) != null) {
      throw const EmailAlreadyRegisteredException();
    }
    final account = _SeedAccount(
      id: 'user-${_accounts.length + 1}',
      name: name,
      email: email,
      password: password,
      createdAt: DateTime.now().toUtc(),
    );
    _accounts.add(account);
    return _authResponseFor(account);
  }

  @override
  Future<TokenPair> refresh(String refreshToken) async {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    if (!refreshToken.startsWith('mock-refresh-')) {
      throw const RefreshFailedException();
    }
    return _issueTokens();
  }

  _SeedAccount? _findByEmail(String email) {
    for (final account in _accounts) {
      if (account.email == email) return account;
    }
    return null;
  }

  AuthResponse _authResponseFor(_SeedAccount account) {
    return AuthResponse(
      user: User(
        id: account.id,
        name: account.name,
        email: account.email,
        createdAt: account.createdAt,
      ),
      tokens: _issueTokens(),
    );
  }

  TokenPair _issueTokens() {
    _tokenSequence++;
    final marker = '$_tokenSequence-${DateTime.now().microsecondsSinceEpoch}';
    return TokenPair(
      tokenType: TokenPairTokenTypeEnum.bearer,
      accessToken: 'mock-access-$marker',
      // Curto o suficiente para os testes exercitarem o refresh sem esperar
      // de verdade (a expiração é comparada a DateTime.now() na
      // SessionController); generoso o bastante para não expirar em uso
      // manual/dev.
      expiresIn: 900,
      refreshToken: 'mock-refresh-$marker',
    );
  }
}

class _SeedAccount {
  _SeedAccount({
    required this.id,
    required this.name,
    required this.email,
    required this.password,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String email;
  final String password;
  final DateTime createdAt;
}
