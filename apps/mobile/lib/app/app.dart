import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/home/data/profile_repository.dart';
import 'env.dart';
import 'router.dart';
import 'theme.dart';

/// Raiz do app companion do PsiOps.
///
/// Monta o tema derivado dos tokens ([PsiTheme]) e a navegação declarativa
/// ([buildRouter]). O adapter de perfil é escolhido conforme o [environment]:
/// em [AppEnvironment.dev] usa o mock em memória; ambientes com adapters reais
/// chegam na integração (PSI-045).
class PsiOpsApp extends StatelessWidget {
  PsiOpsApp({super.key, required this.environment})
    : _router = buildRouter(
        profileRepository: _profileRepositoryFor(environment),
      );

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

  final AppEnvironment environment;
  final GoRouter _router;

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
