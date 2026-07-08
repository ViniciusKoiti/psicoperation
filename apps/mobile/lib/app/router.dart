import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/home/data/profile_repository.dart';
import '../features/home/presentation/home_screen.dart';

/// Nomes de rota do app (evita strings mágicas espalhadas na navegação).
abstract final class Routes {
  static const String home = 'home';
  static const String homePath = '/';
}

/// Configuração de navegação com go_router.
///
/// Nesta fase há apenas a rota placeholder [Routes.home]; rotas de domínio
/// (pacientes, mensalidades) chegam com as features reais. O [errorBuilder]
/// trata rotas desconhecidas com uma tela dedicada em vez do erro padrão.
///
/// O [ProfileRepository] é injetado (o entrypoint escolhe mock ou real),
/// mantendo o router agnóstico ao ambiente.
GoRouter buildRouter({required ProfileRepository profileRepository}) {
  return GoRouter(
    initialLocation: Routes.homePath,
    routes: [
      GoRoute(
        path: Routes.homePath,
        name: Routes.home,
        builder: (context, state) => HomeScreen(repository: profileRepository),
      ),
    ],
    errorBuilder: (context, state) => _UnknownRouteScreen(uri: state.uri),
  );
}

class _UnknownRouteScreen extends StatelessWidget {
  const _UnknownRouteScreen({required this.uri});

  final Uri uri;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Rota não encontrada')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Página não encontrada', style: textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(uri.toString(), style: textTheme.bodyMedium),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.goNamed(Routes.home),
                child: const Text('Voltar ao início'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
