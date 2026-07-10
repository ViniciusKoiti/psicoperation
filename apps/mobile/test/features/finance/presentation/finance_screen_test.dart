import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/features/dashboard/data/charge_adapter.dart';
import 'package:psiops_mobile/features/finance/presentation/finance_screen.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

Widget _wrap(Widget child) => MaterialApp(home: child);

/// Pumpa em passos fixos em vez de `pumpAndSettle` para as ações de "gerar
/// mensalidades do mês": enquanto a geração está em andamento, o botão
/// mostra um `CircularProgressIndicator` indeterminado (animação que se
/// repete indefinidamente) — `pumpAndSettle` nunca considera a árvore
/// "assentada" enquanto ele estiver visível e trava aguardando a animação
/// parar sozinha. Passos fixos são tempo mais que suficiente para os
/// `Future.delayed` do mock (`InMemoryChargeAdapter`/`InMemoryPatientsAdapter`,
/// ~10ms cada) resolverem antes do spinner sumir.
Future<void> _pumpUntilGenerationSettles(WidgetTester tester) async {
  for (var i = 0; i < 10; i++) {
    await tester.pump(const Duration(milliseconds: 50));
  }
}

void main() {
  // Tela com várias seções em ListView; viewport grande evita que seções
  // mais abaixo fiquem fora do cache extent padrão — mesma lição registrada
  // em dashboard_screen_test.dart/patient_detail_screen_test.dart.
  setUp(() async {
    final binding = TestWidgetsFlutterBinding.ensureInitialized();
    binding.platformDispatcher.views.first.physicalSize = const Size(400, 2600);
    binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    addTearDown(binding.platformDispatcher.views.first.resetPhysicalSize);
    addTearDown(binding.platformDispatcher.views.first.resetDevicePixelRatio);
  });

  Widget buildFinance({required InMemoryChargeAdapter chargeAdapter}) => _wrap(
    FinanceScreen(
      chargeAdapter: chargeAdapter,
      patientsAdapter: InMemoryPatientsAdapter(now: fixedNow),
      now: fixedNow,
    ),
  );

  testWidgets('mostra mensalidades agrupadas por status com totais em pt-BR', (tester) async {
    await tester.pumpWidget(buildFinance(chargeAdapter: InMemoryChargeAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    expect(find.text('julho de 2026'), findsOneWidget);
    expect(find.text('Beatriz Andrade'), findsOneWidget);
    expect(find.text('Carlos Eduardo Lima'), findsOneWidget);
    expect(find.text('Daniela Souza'), findsOneWidget);

    expect(
      tester.widget<Text>(find.byKey(const Key('finance-total-em-dia'))).data,
      'R\$ 250,00',
    );
    expect(
      tester.widget<Text>(find.byKey(const Key('finance-total-pendente'))).data,
      'R\$ 200,00',
    );
    expect(
      tester.widget<Text>(find.byKey(const Key('finance-total-atrasada'))).data,
      'R\$ 220,00',
    );
    expect(
      tester.widget<Text>(find.byKey(const Key('finance-total-geral'))).data,
      'R\$ 670,00',
    );
  });

  testWidgets('marcar mensalidade pendente como paga move para em dia e atualiza os totais', (
    tester,
  ) async {
    await tester.pumpWidget(buildFinance(chargeAdapter: InMemoryChargeAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('finance-mark-paid-charge-mock-2')));
    await tester.pumpAndSettle();

    expect(find.text('Marcar mensalidade como paga?'), findsOneWidget);
    await tester.tap(find.byKey(const Key('finance-mark-paid-confirm-button')));
    await tester.pumpAndSettle();

    expect(find.text('Mensalidade marcada como paga.'), findsOneWidget);
    expect(
      tester.widget<Text>(find.byKey(const Key('finance-total-pendente'))).data,
      'R\$ 0,00',
    );
    expect(
      tester.widget<Text>(find.byKey(const Key('finance-total-em-dia'))).data,
      'R\$ 450,00',
    );
    expect(find.byKey(const Key('finance-pendente-empty')), findsOneWidget);
  });

  testWidgets('cancelar a confirmação de pagamento não altera os totais', (tester) async {
    await tester.pumpWidget(buildFinance(chargeAdapter: InMemoryChargeAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('finance-mark-paid-charge-mock-2')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('finance-mark-paid-dismiss-button')));
    await tester.pumpAndSettle();

    expect(
      tester.widget<Text>(find.byKey(const Key('finance-total-pendente'))).data,
      'R\$ 200,00',
    );
  });

  testWidgets('gerar mensalidades do mês cria uma cobrança por paciente ativo e avisa o resultado', (
    tester,
  ) async {
    final chargeAdapter = InMemoryChargeAdapter(now: fixedNow, seedSampleData: false);
    await tester.pumpWidget(buildFinance(chargeAdapter: chargeAdapter));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('finance-empty')), findsOneWidget);

    await tester.tap(find.byKey(const Key('finance-generate-button')));
    await _pumpUntilGenerationSettles(tester);

    expect(find.textContaining('3 mensalidade(s) gerada(s)'), findsOneWidget);
    expect(find.byKey(const Key('finance-empty')), findsNothing);

    // Chamada direta ao adapter mock (fora do ciclo de `pump`) precisa
    // rodar em `runAsync`: o `Future.delayed` interno do mock fica pendente
    // para sempre se nada mais avançar o relógio fake do teste de widget.
    final allCharges = await tester.runAsync(() => chargeAdapter.listCharges());
    expect(allCharges, hasLength(3));
  });

  testWidgets(
    'gerar mensalidades do mês quando já foram geradas não duplica e avisa que já existiam (idempotência)',
    (tester) async {
      // Adapter padrão (com seed) já tem uma mensalidade por paciente ativo
      // para a competência corrente — a geração deve ignorar os três.
      final chargeAdapter = InMemoryChargeAdapter(now: fixedNow);
      await tester.pumpWidget(buildFinance(chargeAdapter: chargeAdapter));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('finance-generate-button')));
      await _pumpUntilGenerationSettles(tester);

      expect(find.textContaining('já haviam sido geradas'), findsOneWidget);
      // Não duplicou: continuam as 3 cobranças semeadas originalmente (ver
      // nota sobre `runAsync` no teste anterior).
      final allCharges = await tester.runAsync(() => chargeAdapter.listCharges());
      expect(allCharges, hasLength(3));
    },
  );

  testWidgets('navegação entre meses troca o rótulo e mostra o estado vazio em meses sem geração', (
    tester,
  ) async {
    await tester.pumpWidget(buildFinance(chargeAdapter: InMemoryChargeAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    expect(find.text('julho de 2026'), findsOneWidget);
    expect(find.byKey(const Key('finance-empty')), findsNothing);

    await tester.tap(find.byKey(const Key('finance-next-month-button')));
    await tester.pumpAndSettle();

    expect(find.text('agosto de 2026'), findsOneWidget);
    expect(find.byKey(const Key('finance-empty')), findsOneWidget);
    expect(find.text('Nenhuma mensalidade gerada para este mês ainda.'), findsOneWidget);

    await tester.tap(find.byKey(const Key('finance-prev-month-button')));
    await tester.pumpAndSettle();

    expect(find.text('julho de 2026'), findsOneWidget);
    expect(find.byKey(const Key('finance-empty')), findsNothing);
  });
}
