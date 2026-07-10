import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/app/app.dart';
import 'package:psiops_mobile/app/env.dart';
import 'package:psiops_mobile/features/home/data/profile_repository.dart';
import 'package:psiops_mobile/features/settings/data/settings_adapter.dart';
import 'package:psiops_mobile/features/settings/presentation/settings_screen.dart';

Widget _wrap(Widget child) => MaterialApp(home: child);

Future<void> _login(WidgetTester tester) async {
  await tester.enterText(find.byKey(const Key('login-email-field')), 'ana@exemplo.com.br');
  await tester.enterText(find.byKey(const Key('login-password-field')), 'Psiops123');
  await tester.tap(find.byKey(const Key('login-submit-button')));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() async {
    final binding = TestWidgetsFlutterBinding.ensureInitialized();
    binding.platformDispatcher.views.first.physicalSize = const Size(400, 2000);
    binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    addTearDown(binding.platformDispatcher.views.first.resetPhysicalSize);
    addTearDown(binding.platformDispatcher.views.first.resetDevicePixelRatio);
  });

  testWidgets('salva o nome de exibição do perfil', (tester) async {
    final profileRepository = InMemoryProfileRepository();
    await tester.pumpWidget(
      _wrap(
        SettingsScreen(
          profileRepository: profileRepository,
          settingsAdapter: InMemorySettingsAdapter(),
          onLogout: () async {},
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('settings-name-field')), 'Dra. Ana Paula Prado');
    await tester.tap(find.byKey(const Key('settings-save-profile-button')));
    await tester.pumpAndSettle();

    expect(find.text('Perfil salvo.'), findsOneWidget);

    final profile = await tester.runAsync(() => profileRepository.currentProfile());
    expect(profile?.name, 'Dra. Ana Paula Prado');
  });

  testWidgets(
    'valor padrão de sessão aceita entrada mascarada pt-BR e persiste em centavos inteiros',
    (tester) async {
      final settingsAdapter = InMemorySettingsAdapter();
      await tester.pumpWidget(
        _wrap(
          SettingsScreen(
            profileRepository: InMemoryProfileRepository(),
            settingsAdapter: settingsAdapter,
            onLogout: () async {},
          ),
        ),
      );
      await tester.pumpAndSettle();

      final feeField = find.byKey(const Key('settings-default-fee-field'));
      await tester.enterText(feeField, '180,50');
      await tester.tap(find.byKey(const Key('settings-save-fee-button')));
      await tester.pumpAndSettle();

      expect(find.text('Valor padrão de sessão salvo.'), findsOneWidget);

      // Nunca ponto flutuante: persistido como inteiro em centavos (18050).
      final settings = await tester.runAsync(() => settingsAdapter.getSettings());
      expect(settings?.defaultMonthlyFee, 18050);
    },
  );

  testWidgets('valor padrão de sessão rejeita entrada monetária inválida', (tester) async {
    await tester.pumpWidget(
      _wrap(
        SettingsScreen(
          profileRepository: InMemoryProfileRepository(),
          settingsAdapter: InMemorySettingsAdapter(),
          onLogout: () async {},
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('settings-default-fee-field')), 'abc');
    await tester.tap(find.byKey(const Key('settings-save-fee-button')));
    await tester.pumpAndSettle();

    expect(find.text('Informe um valor monetário válido (ex.: 150,00).'), findsOneWidget);
    expect(find.text('Valor padrão de sessão salvo.'), findsNothing);
  });

  testWidgets('preferências de lembrete: liga/desliga e antecedência persistem', (tester) async {
    final settingsAdapter = InMemorySettingsAdapter();
    await tester.pumpWidget(
      _wrap(
        SettingsScreen(
          profileRepository: InMemoryProfileRepository(),
          settingsAdapter: settingsAdapter,
          onLogout: () async {},
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Texto que deixa claro que o disparo é responsabilidade do backend
    // (mitigação do risco do manifesto PSI-043).
    expect(find.textContaining('é feito pelo servidor do PsiOps'), findsOneWidget);

    await tester.tap(find.byKey(const Key('settings-reminder-enabled-switch')));
    await tester.pumpAndSettle();

    // Desligado: o seletor de antecedência some.
    expect(find.byKey(const Key('settings-reminder-days-field')), findsNothing);

    await tester.tap(find.byKey(const Key('settings-save-reminder-button')));
    await tester.pumpAndSettle();

    expect(find.text('Preferências de lembrete salvas.'), findsOneWidget);
    final preferences = await tester.runAsync(() => settingsAdapter.getReminderPreferences());
    expect(preferences?.enabled, isFalse);
  });

  testWidgets('logout na tela de configurações encerra a sessão da PSI-040 e volta ao login', (
    tester,
  ) async {
    await tester.pumpWidget(PsiOpsApp(environment: AppEnvironment.dev));
    await tester.pumpAndSettle();

    await _login(tester);
    expect(find.byKey(const Key('home-nav-settings-button')), findsOneWidget);

    await tester.tap(find.byKey(const Key('home-nav-settings-button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('settings-logout-button')), findsOneWidget);
    await tester.tap(find.byKey(const Key('settings-logout-button')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('login-email-field')), findsOneWidget);
    expect(find.byKey(const Key('settings-logout-button')), findsNothing);
  });
}
