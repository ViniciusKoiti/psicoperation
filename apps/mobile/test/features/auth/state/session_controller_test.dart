import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/auth/data/auth_adapter.dart';
import 'package:psiops_mobile/features/auth/data/in_memory_auth_adapter.dart';
import 'package:psiops_mobile/features/auth/state/session_controller.dart';

/// Adapter de teste com respostas roteirizadas: permite controlar
/// precisamente o par de tokens emitido (inclusive `expiresIn`) e contar
/// quantas vezes `refresh` foi chamado, para testar a serialização de
/// renovações concorrentes sem depender de temporização real.
class _ScriptedAuthAdapter implements AuthAdapter {
  _ScriptedAuthAdapter();

  int refreshCalls = 0;
  Duration refreshDelay = Duration.zero;
  bool refreshShouldFail = false;
  TokenPair Function()? nextRefreshTokens;

  @override
  Future<AuthResponse> login(String email, String password) async {
    if (email == 'ana@exemplo.com.br' && password == 'Psiops123') {
      return _authResponse(expiresIn: 900);
    }
    throw const InvalidCredentialsException();
  }

  @override
  Future<AuthResponse> register(
    String name,
    String email,
    String password,
  ) async {
    return _authResponse(expiresIn: 900);
  }

  @override
  Future<TokenPair> refresh(String refreshToken) async {
    refreshCalls++;
    if (refreshDelay > Duration.zero) {
      await Future<void>.delayed(refreshDelay);
    }
    if (refreshShouldFail) {
      throw const RefreshFailedException();
    }
    return nextRefreshTokens?.call() ??
        TokenPair(
          tokenType: TokenPairTokenTypeEnum.bearer,
          accessToken: 'access-refreshed-$refreshCalls',
          expiresIn: 900,
          refreshToken: 'refresh-token-$refreshCalls',
        );
  }

  AuthResponse _authResponse({required int expiresIn}) {
    return AuthResponse(
      user: User(
        id: 'demo-user',
        name: 'Dra. Ana Prado',
        email: 'ana@exemplo.com.br',
        createdAt: DateTime.utc(2026, 1, 1),
      ),
      tokens: TokenPair(
        tokenType: TokenPairTokenTypeEnum.bearer,
        accessToken: 'access-initial',
        expiresIn: expiresIn,
        refreshToken: 'refresh-token-0',
      ),
    );
  }
}

void main() {
  group('SessionController com InMemoryAuthAdapter (mock)', () {
    test('login com sucesso autentica a sessão', () async {
      final session = SessionController(InMemoryAuthAdapter());
      expect(session.status, SessionStatus.unknown);

      await session.bootstrap();
      expect(session.status, SessionStatus.unauthenticated);

      await session.login('ana@exemplo.com.br', 'Psiops123');

      expect(session.status, SessionStatus.authenticated);
      expect(session.user?.email, 'ana@exemplo.com.br');
      expect(session.accessToken, isNotNull);
    });

    test('credenciais inválidas lançam InvalidCredentialsException e não autenticam', () async {
      final session = SessionController(InMemoryAuthAdapter());
      await session.bootstrap();

      await expectLater(
        session.login('ana@exemplo.com.br', 'senha-errada'),
        throwsA(isA<InvalidCredentialsException>()),
      );

      expect(session.status, SessionStatus.unauthenticated);
      expect(session.user, isNull);
    });

    test('logout encerra a sessão autenticada', () async {
      final session = SessionController(InMemoryAuthAdapter());
      await session.bootstrap();
      await session.login('ana@exemplo.com.br', 'Psiops123');
      expect(session.status, SessionStatus.authenticated);

      await session.logout();

      expect(session.status, SessionStatus.unauthenticated);
      expect(session.user, isNull);
      expect(session.accessToken, isNull);
    });

    test('registro com sucesso autentica e permite login subsequente', () async {
      final session = SessionController(InMemoryAuthAdapter());
      await session.bootstrap();

      await session.register('Nova Psicóloga', 'nova@exemplo.com.br', 'SenhaForte1');
      expect(session.status, SessionStatus.authenticated);
      expect(session.user?.name, 'Nova Psicóloga');

      await session.logout();
      await session.login('nova@exemplo.com.br', 'SenhaForte1');
      expect(session.status, SessionStatus.authenticated);
    });

    test('registro com e-mail já cadastrado lança EmailAlreadyRegisteredException', () async {
      final session = SessionController(InMemoryAuthAdapter());
      await session.bootstrap();

      await expectLater(
        session.register('Outra Conta', 'ana@exemplo.com.br', 'OutraSenha1'),
        throwsA(isA<EmailAlreadyRegisteredException>()),
      );
    });
  });

  group('SessionController — renovação transparente de token', () {
    test('token perto de expirar é renovado de forma transparente sem deslogar', () async {
      final adapter = _ScriptedAuthAdapter();
      var now = DateTime.utc(2026, 1, 1, 12);
      final session = SessionController(adapter, now: () => now);
      await session.bootstrap();
      await session.login('ana@exemplo.com.br', 'Psiops123');

      // Avança o relógio para dentro da margem de expiração (skew).
      now = now.add(const Duration(seconds: 890));

      final token = await session.validAccessToken();

      expect(token, 'access-refreshed-1');
      expect(session.status, SessionStatus.authenticated);
      expect(adapter.refreshCalls, 1);
    });

    test('token ainda válido não dispara renovação', () async {
      final adapter = _ScriptedAuthAdapter();
      final now = DateTime.utc(2026, 1, 1, 12);
      final session = SessionController(adapter, now: () => now);
      await session.bootstrap();
      await session.login('ana@exemplo.com.br', 'Psiops123');

      final token = await session.validAccessToken();

      expect(token, 'access-initial');
      expect(adapter.refreshCalls, 0);
    });

    test('chamadas concorrentes durante expiração compartilham uma única renovação', () async {
      final adapter = _ScriptedAuthAdapter()
        ..refreshDelay = const Duration(milliseconds: 50);
      var now = DateTime.utc(2026, 1, 1, 12);
      final session = SessionController(adapter, now: () => now);
      await session.bootstrap();
      await session.login('ana@exemplo.com.br', 'Psiops123');
      now = now.add(const Duration(seconds: 890));

      final results = await Future.wait([
        session.validAccessToken(),
        session.validAccessToken(),
        session.validAccessToken(),
      ]);

      expect(adapter.refreshCalls, 1, reason: 'renovações concorrentes devem ser serializadas');
      expect(results, everyElement('access-refreshed-1'));
    });

    test('falha definitiva de refresh encerra a sessão com mensagem pendente', () async {
      final adapter = _ScriptedAuthAdapter()..refreshShouldFail = true;
      var now = DateTime.utc(2026, 1, 1, 12);
      final session = SessionController(adapter, now: () => now);
      await session.bootstrap();
      await session.login('ana@exemplo.com.br', 'Psiops123');
      now = now.add(const Duration(seconds: 890));

      final token = await session.validAccessToken();

      expect(token, isNull);
      expect(session.status, SessionStatus.unauthenticated);
      expect(session.user, isNull);
      expect(
        session.consumePendingMessage(),
        'Sua sessão expirou. Faça login novamente.',
      );
      // Mensagem é consumida uma única vez.
      expect(session.consumePendingMessage(), isNull);
    });
  });
}
