import 'package:psiops_contracts/api.dart';

/// Porta de acesso à autenticação da psicóloga.
///
/// Os tipos [AuthResponse] e [TokenPair] vêm de `packages/contracts/gen/dart`
/// (codegen do `openapi.yaml` — fonte única de contratos, ADR 0008); este
/// adapter nunca redefine DTOs de API localmente.
///
/// Duas implementações:
/// - `InMemoryAuthAdapter`: mock em memória, padrão em dev/test.
/// - `HttpAuthAdapter`: client HTTP real tipado pelos mesmos modelos,
///   implementado e compilável, mas não exercitado contra a API real nesta
///   tarefa (integração real é PSI-045).
///
/// A escolha entre as duas acontece em um único ponto de composição:
/// `app/app.dart` (`_authAdapterFor`).
abstract interface class AuthAdapter {
  /// Autentica com e-mail e senha (`POST /auth/login`).
  ///
  /// Lança [InvalidCredentialsException] em credenciais inválidas.
  Future<AuthResponse> login(String email, String password);

  /// Registra uma nova conta e já inicia a sessão (`POST /auth/register`).
  ///
  /// Lança [EmailAlreadyRegisteredException] se o e-mail já estiver em uso.
  Future<AuthResponse> register(String name, String email, String password);

  /// Troca um refresh token válido por um novo par de tokens
  /// (`POST /auth/refresh`). O refresh token apresentado é invalidado
  /// (rotação de uso único), conforme a spec.
  ///
  /// Lança [RefreshFailedException] em falha definitiva (refresh token
  /// inválido, expirado ou já utilizado) — quem chama deve encerrar a sessão.
  Future<TokenPair> refresh(String refreshToken);
}

/// Erro genérico de autenticação (rede, servidor, resposta inesperada).
///
/// [message] é um texto pt-BR adequado para exibição direta na UI.
class AuthAdapterException implements Exception {
  const AuthAdapterException(this.message);

  final String message;

  @override
  String toString() => 'AuthAdapterException: $message';
}

/// Credenciais inválidas em `/auth/login` (HTTP 401).
class InvalidCredentialsException extends AuthAdapterException {
  const InvalidCredentialsException([
    super.message = 'E-mail ou senha incorretos.',
  ]);
}

/// E-mail já cadastrado em `/auth/register` (HTTP 409).
class EmailAlreadyRegisteredException extends AuthAdapterException {
  const EmailAlreadyRegisteredException([
    super.message = 'Este e-mail já está cadastrado.',
  ]);
}

/// Falha definitiva ao renovar o par de tokens em `/auth/refresh` (HTTP 401,
/// ou ausência de refresh token) — a sessão deve ser encerrada e a usuária
/// redirecionada ao login com esta mensagem.
class RefreshFailedException extends AuthAdapterException {
  const RefreshFailedException([
    super.message = 'Sua sessão expirou. Faça login novamente.',
  ]);
}
