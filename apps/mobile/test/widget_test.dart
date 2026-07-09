import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/app/app.dart';
import 'package:psiops_mobile/app/env.dart';

void main() {
  testWidgets(
    'monta o app, autentica com o mock e renderiza a Home com o perfil do adapter',
    (tester) async {
      // Ambiente dev → adapters em memória (mock), sem rede.
      await tester.pumpWidget(PsiOpsApp(environment: AppEnvironment.dev));

      // Sem sessão: a rota protegida "/" redireciona para o login (PSI-040).
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('login-email-field')), findsOneWidget);

      // Autentica com a usuária semente do InMemoryAuthAdapter.
      await tester.enterText(
        find.byKey(const Key('login-email-field')),
        'ana@exemplo.com.br',
      );
      await tester.enterText(
        find.byKey(const Key('login-password-field')),
        'Psiops123',
      );
      await tester.tap(find.byKey(const Key('login-submit-button')));
      await tester.pumpAndSettle();

      // Home placeholder exibe o nome vindo do modelo de contrato `User`.
      expect(find.byKey(const Key('home-profile-name')), findsOneWidget);
      expect(find.text('Dra. Ana Prado'), findsOneWidget);
    },
  );
}
