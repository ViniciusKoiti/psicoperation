import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/app/app.dart';
import 'package:psiops_mobile/app/env.dart';

void main() {
  testWidgets('monta o app e renderiza a Home com o perfil do adapter', (
    tester,
  ) async {
    // Ambiente dev → adapter de perfil em memória (mock), sem rede.
    await tester.pumpWidget(PsiOpsApp(environment: AppEnvironment.dev));

    // Primeiro frame: carregamento assíncrono do perfil.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Resolve o Future do adapter e reconstrói.
    await tester.pumpAndSettle();

    // Home placeholder exibe o nome vindo do modelo de contrato `User`.
    expect(find.byKey(const Key('home-profile-name')), findsOneWidget);
    expect(find.text('Dra. Ana Prado'), findsOneWidget);
  });
}
