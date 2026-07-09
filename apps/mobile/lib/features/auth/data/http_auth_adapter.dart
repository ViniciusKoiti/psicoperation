import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import 'auth_adapter.dart';

/// Client HTTP real do `AuthAdapter`, tipado pelos modelos Dart gerados de
/// `packages/contracts/gen/dart` (`AuthResponse`, `TokenPair`,
/// `LoginRequest`, `RegisterRequest`, `RefreshTokenRequest`, `Problem`) —
/// nunca redefine DTOs de API localmente (ADR 0008, regra 8 do CLAUDE.md).
///
/// Implementado e compilável, mas **não exercitado contra a API real** nesta
/// tarefa (PSI-040) — a integração real (endpoint de produção, tratamento
/// fino de erros de rede, etc.) acontece na PSI-045.
///
/// Usa `ApiClient.invokeAPI` (também gerado, de `packages/contracts`) em vez
/// de importar `package:http` diretamente no app: `http` já chega como
/// dependência transitiva via o path dependency `psiops_contracts`, mas
/// declarar o import aqui adicionaria uma dependência direta não autorizada
/// pelo manifesto sem necessidade real.
final class HttpAuthAdapter implements AuthAdapter {
  HttpAuthAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  @override
  Future<AuthResponse> login(String email, String password) async {
    final response = await _client.invokeAPI(
      '/auth/login',
      'POST',
      const [],
      LoginRequest(email: email, password: password),
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 200) {
      return AuthResponse.fromJson(_decode(response.body))!;
    }
    if (response.statusCode == 401) {
      throw InvalidCredentialsException(
        _problemMessage(response.body) ?? 'E-mail ou senha incorretos.',
      );
    }
    throw AuthAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível entrar (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<AuthResponse> register(
    String name,
    String email,
    String password,
  ) async {
    final response = await _client.invokeAPI(
      '/auth/register',
      'POST',
      const [],
      RegisterRequest(name: name, email: email, password: password),
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 201) {
      return AuthResponse.fromJson(_decode(response.body))!;
    }
    if (response.statusCode == 409) {
      throw EmailAlreadyRegisteredException(
        _problemMessage(response.body) ?? 'Este e-mail já está cadastrado.',
      );
    }
    throw AuthAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível registrar (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<TokenPair> refresh(String refreshToken) async {
    final response = await _client.invokeAPI(
      '/auth/refresh',
      'POST',
      const [],
      RefreshTokenRequest(refreshToken: refreshToken),
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 200) {
      return TokenPair.fromJson(_decode(response.body))!;
    }
    throw RefreshFailedException(
      _problemMessage(response.body) ??
          'Sua sessão expirou. Faça login novamente.',
    );
  }

  dynamic _decode(String body) => body.isEmpty ? null : jsonDecode(body);

  String? _problemMessage(String body) {
    if (body.isEmpty) return null;
    try {
      final problem = Problem.fromJson(_decode(body));
      return problem?.detail ?? problem?.title;
    } catch (_) {
      return null;
    }
  }
}
