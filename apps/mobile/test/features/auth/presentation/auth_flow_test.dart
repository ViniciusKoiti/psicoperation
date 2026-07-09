import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/app/app.dart';
import 'package:psiops_mobile/app/env.dart';

/// Testes de widget do shell de autenticação (PSI-040), cobrindo com o
/// adapter mock: redirect de rota protegida, login com sucesso, credenciais
/// inválidas e logout.
void main() {
  testWidgets(
    'usuária não autenticada é redirecionada para o login (rota protegida)',
    (tester) async {
      await tester.pumpWidget(PsiOpsApp(environment: AppEnvironment.dev));
      await tester.pumpAndSettle();

      // Estado inicial: sem sessão, a rota "/" (protegida) é substituída
      // pela tela de login.
      expect(find.byKey(const Key('login-email-field')), findsOneWidget);
      expect(find.byKey(const Key('home-logout-button')), findsNothing);
    },
  );

  testWidgets('login com sucesso leva à home com o perfil do adapter', (
    tester,
  ) async {
    await tester.pumpWidget(PsiOpsApp(environment: AppEnvironment.dev));
    await tester.pumpAndSettle();

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

    expect(find.byKey(const Key('home-profile-name')), findsOneWidget);
    expect(find.text('Dra. Ana Prado'), findsOneWidget);
  });

  testWidgets('credenciais inválidas exibem erro e permanecem no login', (
    tester,
  ) async {
    await tester.pumpWidget(PsiOpsApp(environment: AppEnvironment.dev));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const Key('login-email-field')),
      'ana@exemplo.com.br',
    );
    await tester.enterText(
      find.byKey(const Key('login-password-field')),
      'senha-errada',
    );
    await tester.tap(find.byKey(const Key('login-submit-button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('login-error-message')), findsOneWidget);
    expect(find.text('E-mail ou senha incorretos.'), findsOneWidget);
    expect(find.byKey(const Key('login-email-field')), findsOneWidget);
  });

  testWidgets('logout encerra a sessão e retorna ao login', (tester) async {
    await tester.pumpWidget(PsiOpsApp(environment: AppEnvironment.dev));
    await tester.pumpAndSettle();

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
    expect(find.byKey(const Key('home-logout-button')), findsOneWidget);

    await tester.tap(find.byKey(const Key('home-logout-button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('login-email-field')), findsOneWidget);
    expect(find.byKey(const Key('home-logout-button')), findsNothing);
  });
}
