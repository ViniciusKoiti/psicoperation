import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../data/auth_adapter.dart';

/// Estado da sessão da usuária, observado pelo `go_router` (via
/// `refreshListenable`) para proteger rotas.
enum SessionStatus {
  /// Estado inicial, antes de [SessionController.bootstrap] resolver se há
  /// (ou não) uma sessão a restaurar. O `go_router` não deve tomar nenhuma
  /// decisão de redirect enquanto o status estiver neste valor — evita o
  /// flicker/loop citado nos riscos do manifesto PSI-040.
  unknown,

  /// Sem sessão válida: a usuária deve ser enviada ao login.
  unauthenticated,

  /// Sessão válida, com usuária e tokens carregados em memória.
  authenticated,
}

/// Gerencia a sessão autenticada do app.
///
/// Decisões de segurança (ver manifesto PSI-040 e CLAUDE.md):
/// - O access token vive **apenas em memória** (neste objeto), nunca em
///   disco.
/// - O refresh token também é mantido apenas em memória nesta versão: não há
///   persistência entre reinícios do app. Isso resolve a open_question do
///   manifesto ("a sessão deve sobreviver a reinício do app?") a favor do
///   MVP mais simples — cada abertura do app exige novo login. Persistir o
///   refresh token em armazenamento seguro do dispositivo (ex.:
///   flutter_secure_storage) fica para uma tarefa futura, se necessário.
///   [bootstrap] já isola esse ponto de extensão.
/// - Renovação do access token expirado é transparente (sem deslogar em
///   caso de sucesso) e **serializada**: chamadas concorrentes a
///   [validAccessToken] compartilham a mesma renovação em andamento, em vez
///   de disparar múltiplas requisições de refresh em corrida.
/// - Falha definitiva de refresh encerra a sessão e expõe uma mensagem
///   (via [consumePendingMessage]) para a tela de login exibir.
class SessionController extends ChangeNotifier {
  SessionController(this._adapter, {DateTime Function()? now})
    : _now = now ?? DateTime.now;

  final AuthAdapter _adapter;
  final DateTime Function() _now;

  SessionStatus _status = SessionStatus.unknown;
  SessionStatus get status => _status;

  User? _user;
  User? get user => _user;

  String? _accessToken;

  /// Access token corrente, se houver sessão autenticada. Exposto apenas em
  /// memória — nunca serializado ou persistido por este controller.
  String? get accessToken => _accessToken;

  DateTime? _accessTokenExpiresAt;
  String? _refreshToken;

  String? _pendingMessage;

  /// Consome (lê e limpa) a mensagem pendente de encerramento de sessão —
  /// exibida uma única vez pela tela de login após um logout forçado por
  /// falha definitiva de refresh.
  String? consumePendingMessage() {
    final message = _pendingMessage;
    _pendingMessage = null;
    return message;
  }

  Future<void>? _refreshInFlight;

  /// Resolve o estado inicial da sessão **antes** do primeiro redirect do
  /// `go_router`. Nesta versão não há refresh token persistido em disco para
  /// restaurar (ver documentação da classe), então o app sempre inicia
  /// deslogado — mas o método permanece assíncrono e é o único lugar que
  /// precisaria mudar caso uma persistência real seja adicionada depois.
  Future<void> bootstrap() async {
    _status = SessionStatus.unauthenticated;
    notifyListeners();
  }

  /// Autentica com e-mail e senha. Propaga exceções de `AuthAdapter`
  /// (ex.: [InvalidCredentialsException]) para a tela decidir a mensagem.
  Future<void> login(String email, String password) async {
    final response = await _adapter.login(email, password);
    _applyAuthResponse(response);
  }

  /// Registra uma nova conta e já inicia a sessão.
  Future<void> register(String name, String email, String password) async {
    final response = await _adapter.register(name, email, password);
    _applyAuthResponse(response);
  }

  void _applyAuthResponse(AuthResponse response) {
    _user = response.user;
    _accessToken = response.tokens.accessToken;
    _refreshToken = response.tokens.refreshToken;
    _accessTokenExpiresAt = _now().toUtc().add(
      Duration(seconds: response.tokens.expiresIn),
    );
    _status = SessionStatus.authenticated;
    notifyListeners();
  }

  /// Encerra a sessão por ação explícita da usuária.
  Future<void> logout() async {
    _clearSession();
    notifyListeners();
  }

  void _clearSession() {
    _user = null;
    _accessToken = null;
    _refreshToken = null;
    _accessTokenExpiresAt = null;
    _status = SessionStatus.unauthenticated;
  }

  /// Retorna um access token válido para uso imediato, renovando-o de forma
  /// transparente se estiver expirado ou perto de expirar (margem [skew]).
  ///
  /// Chamadas concorrentes durante uma renovação em andamento **não**
  /// disparam requisições de refresh adicionais: todas aguardam a mesma
  /// operação em voo (serialização — mitiga o risco de corrida do
  /// manifesto). Retorna `null` se não houver sessão autenticada ou se a
  /// renovação falhar definitivamente (nesse caso a sessão já foi encerrada
  /// e [consumePendingMessage] terá uma mensagem para exibir).
  Future<String?> validAccessToken({
    Duration skew = const Duration(seconds: 30),
  }) async {
    if (_status != SessionStatus.authenticated || _accessToken == null) {
      return null;
    }

    final expiresAt = _accessTokenExpiresAt;
    final expiringSoon =
        expiresAt == null || !_now().toUtc().isBefore(expiresAt.subtract(skew));
    if (!expiringSoon) {
      return _accessToken;
    }

    final inFlight = _refreshInFlight;
    if (inFlight != null) {
      await inFlight;
      return _status == SessionStatus.authenticated ? _accessToken : null;
    }

    final refreshFuture = _refreshSession();
    _refreshInFlight = refreshFuture;
    try {
      await refreshFuture;
    } finally {
      _refreshInFlight = null;
    }
    return _status == SessionStatus.authenticated ? _accessToken : null;
  }

  Future<void> _refreshSession() async {
    final refreshToken = _refreshToken;
    if (refreshToken == null) {
      _forceLogout(const RefreshFailedException().message);
      return;
    }
    try {
      final tokens = await _adapter.refresh(refreshToken);
      _accessToken = tokens.accessToken;
      _refreshToken = tokens.refreshToken;
      _accessTokenExpiresAt = _now().toUtc().add(
        Duration(seconds: tokens.expiresIn),
      );
      // Status continua authenticated; notifica mesmo assim para eventuais
      // observadores do token (ex.: um client HTTP com o token em cache).
      notifyListeners();
    } on AuthAdapterException catch (error) {
      _forceLogout(error.message);
    } catch (_) {
      _forceLogout(const RefreshFailedException().message);
    }
  }

  void _forceLogout(String message) {
    _clearSession();
    _pendingMessage = message;
    notifyListeners();
  }
}
