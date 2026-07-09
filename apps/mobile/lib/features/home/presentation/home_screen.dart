import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../data/profile_repository.dart';
import '../state/home_controller.dart';

/// Tela inicial placeholder do app companion (PSI-013).
///
/// Demonstra o padrão por camadas da feature: apresentação ([HomeScreen]),
/// estado ([HomeController]) e dados ([ProfileRepository]) separados. Exibe o
/// perfil vindo do adapter (no dev, o mock em memória) usando o modelo de
/// contrato `User`. As features de domínio reais chegam depois deste scaffold.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.repository, required this.onLogout});

  final ProfileRepository repository;

  /// Encerra a sessão (shell de autenticação, PSI-040). O redirect do
  /// `go_router` leva a usuária de volta ao login automaticamente.
  final Future<void> Function() onLogout;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final HomeController _controller = HomeController(widget.repository);

  @override
  void initState() {
    super.initState();
    _controller.load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('PsiOps'),
        actions: [
          IconButton(
            key: const Key('home-logout-button'),
            tooltip: 'Sair',
            icon: const Icon(Icons.logout),
            onPressed: () => widget.onLogout(),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return switch (_controller.status) {
                HomeStatus.loading => const CircularProgressIndicator(),
                HomeStatus.error => Text(
                  'Não foi possível carregar o perfil.',
                  style: textTheme.bodyLarge?.copyWith(color: colors.error),
                ),
                HomeStatus.ready => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Olá,', style: textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      _controller.profile?.name ?? '',
                      key: const Key('home-profile-name'),
                      style: textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'seu financeiro, em ordem',
                      style: textTheme.titleLarge?.copyWith(
                        fontFamily: PsiTheme.serifAccent.fontFamily,
                        fontStyle: PsiTheme.serifAccent.fontStyle,
                        color: colors.primary,
                      ),
                    ),
                  ],
                ),
              };
            },
          ),
        ),
      ),
    );
  }
}
