import 'package:flutter/material.dart';

/// Tela exibida enquanto `SessionController.bootstrap` resolve o estado
/// inicial da sessão (status `unknown`). O `go_router` não redireciona para
/// login/home até o status sair de `unknown` — ver `app/router.dart`.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
