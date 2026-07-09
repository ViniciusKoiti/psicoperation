import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/data/auth_adapter.dart';
import '../features/auth/data/http_auth_adapter.dart';
import '../features/auth/data/in_memory_auth_adapter.dart';
import '../features/auth/state/session_controller.dart';
import '../features/home/data/profile_repository.dart';
import 'env.dart';
import 'router.dart';
import 'theme.dart';

/// Raiz do app companion do PsiOps.
///
/// Monta o tema derivado dos tokens ([PsiTheme]), a sessão autenticada
/// ([SessionController]) e a navegação declarativa ([buildRouter]).
///
/// **Único ponto de composição** para a escolha de adapters por ambiente
/// (PSI-040, acceptance criteria): [_authAdapterFor] e
/// [_profileRepositoryFor] são os únicos lugares do app que decidem mock vs.
/// implementação real, a partir do [environment] resolvido em `main.dart`.
class PsiOpsApp extends StatefulWidget {
  const PsiOpsApp({super.key, required this.environment});

  final AppEnvironment environment;

  @override
  State<PsiOpsApp> createState() => _PsiOpsAppState();
}

class _PsiOpsAppState extends State<PsiOpsApp> {
  late final SessionController _session = SessionController(
    _authAdapterFor(widget.environment),
  );
  late final GoRouter _router = buildRouter(
    profileRepository: _profileRepositoryFor(widget.environment),
    session: _session,
  );

  @override
  void initState() {
    super.initState();
    // Resolve o estado inicial da sessão antes do primeiro redirect do
    // go_router (o router mantém a usuária na splash enquanto o status for
    // `unknown` — ver app/router.dart e SessionStatus).
    unawaited(_session.bootstrap());
  }

  @override
  void dispose() {
    _session.dispose();
    super.dispose();
  }

  /// Seleciona o `AuthAdapter` por ambiente: mock em memória por padrão em
  /// dev/test; client HTTP real (implementado e compilável, mas não
  /// exercitado contra a API nesta tarefa — PSI-045) em produção. O mock
  /// nunca é selecionável fora de [AppEnvironment.usesMocks].
  static AuthAdapter _authAdapterFor(AppEnvironment environment) {
    if (environment.usesMocks) {
      return InMemoryAuthAdapter();
    }
    return HttpAuthAdapter();
  }

  static ProfileRepository _profileRepositoryFor(AppEnvironment environment) {
    if (environment.usesMocks) {
      return const InMemoryProfileRepository();
    }
    // Adapter real (HTTP contra a API) ainda não implementado neste scaffold
    // — chega na integração mobile (PSI-045). Falhar explícito impede que o
    // mock em memória vaze para um build de produção por engano.
    throw UnimplementedError(
      'Adapter real de perfil ainda não implementado (ver PSI-045). '
      'Ambiente ${environment.name} não é suportado neste scaffold.',
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'PsiOps',
      debugShowCheckedModeBanner: false,
      theme: PsiTheme.light(),
      routerConfig: _router,
    );
  }
}
