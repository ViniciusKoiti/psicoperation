import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';
import 'package:psiops_mobile/features/patients/presentation/patient_form_screen.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

void main() {
  // O formulário rola (SingleChildScrollView) com vários campos; viewport
  // grande evita que o botão de envio fique fora do viewport padrão de
  // teste (mesma lição registrada em dashboard_screen_test.dart/
  // agenda_screen_test.dart).
  setUp(() async {
    final binding = TestWidgetsFlutterBinding.ensureInitialized();
    binding.platformDispatcher.views.first.physicalSize = const Size(400, 1400);
    binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    addTearDown(binding.platformDispatcher.views.first.resetPhysicalSize);
    addTearDown(binding.platformDispatcher.views.first.resetDevicePixelRatio);
  });

  testWidgets('cadastro: mostra erros de validação inline em pt-BR ao submeter vazio', (tester) async {
    final adapter = InMemoryPatientsAdapter(now: fixedNow);
    await tester.pumpWidget(MaterialApp(home: PatientFormScreen.create(adapter: adapter)));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('patient-form-submit-button')));
    await tester.pumpAndSettle();

    expect(find.text('Informe o nome do paciente.'), findsOneWidget);
    expect(find.text('Informe o valor da mensalidade.'), findsOneWidget);

    // Nenhum paciente deve ter sido criado. Chamada direta ao adapter fora
    // do ciclo de widgets roda em `runAsync` (zona real, fora do fake-async
    // do `testWidgets`) para que o `Future.delayed` interno do mock resolva
    // — sem isso, o timer fake nunca avança e o teste trava.
    final active = await tester.runAsync(() => adapter.listPatientsByStatus(PatientStatus.ativo));
    expect(active, hasLength(3));
  });

  testWidgets('cadastro: acusa WhatsApp e e-mail inválidos quando preenchidos', (tester) async {
    final adapter = InMemoryPatientsAdapter(now: fixedNow);
    await tester.pumpWidget(MaterialApp(home: PatientFormScreen.create(adapter: adapter)));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('patient-form-whatsapp-field')), '123');
    await tester.enterText(find.byKey(const Key('patient-form-email-field')), 'não-é-email');
    await tester.tap(find.byKey(const Key('patient-form-submit-button')));
    await tester.pumpAndSettle();

    expect(find.text('Informe um WhatsApp válido com DDD (11 dígitos).'), findsOneWidget);
    expect(find.text('Informe um e-mail válido.'), findsOneWidget);
  });

  testWidgets('cadastro: cria paciente com dados válidos e retorna à tela anterior', (tester) async {
    final adapter = InMemoryPatientsAdapter(now: fixedNow);

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: FilledButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => PatientFormScreen.create(adapter: adapter)),
                ),
                child: const Text('abrir formulário'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('abrir formulário'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('patient-form-name-field')), 'Fernanda Lima');
    await tester.enterText(find.byKey(const Key('patient-form-monthly-fee-field')), '180,00');
    await tester.tap(find.byKey(const Key('patient-form-submit-button')));
    await tester.pumpAndSettle();

    // Voltou para a tela anterior (formulário fechado).
    expect(find.byKey(const Key('patient-form-name-field')), findsNothing);
    expect(find.text('abrir formulário'), findsOneWidget);

    final active = await tester.runAsync(() => adapter.listPatientsByStatus(PatientStatus.ativo));
    expect(active!.map((p) => p.name), contains('Fernanda Lima'));
    final created = active.firstWhere((p) => p.name == 'Fernanda Lima');
    expect(created.monthlyFee, 18000);
    expect(created.billingDay, 5);
  });

  testWidgets('edição: pré-preenche os campos com os dados do paciente existente', (tester) async {
    final adapter = InMemoryPatientsAdapter(now: fixedNow);
    final existing = await tester.runAsync(() => adapter.getPatient('patient-2'));

    await tester.pumpWidget(MaterialApp(home: PatientFormScreen.edit(adapter: adapter, patient: existing!)));
    await tester.pumpAndSettle();

    final nameField = tester.widget<TextFormField>(find.byKey(const Key('patient-form-name-field')));
    expect(nameField.controller?.text, 'Carlos Eduardo Lima');

    final feeField = tester.widget<TextFormField>(
      find.byKey(const Key('patient-form-monthly-fee-field')),
    );
    expect(feeField.controller?.text, '200,00');

    expect(find.text('Editar paciente'), findsOneWidget);
    expect(find.text('Salvar alterações'), findsOneWidget);
  });

  testWidgets('edição: salva alterações no paciente existente', (tester) async {
    final adapter = InMemoryPatientsAdapter(now: fixedNow);
    final existing = await tester.runAsync(() => adapter.getPatient('patient-2'));

    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: Center(
              child: FilledButton(
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => PatientFormScreen.edit(adapter: adapter, patient: existing!),
                  ),
                ),
                child: const Text('abrir edição'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('abrir edição'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('patient-form-monthly-fee-field')), '300,00');
    await tester.tap(find.byKey(const Key('patient-form-submit-button')));
    await tester.pumpAndSettle();

    expect(find.text('abrir edição'), findsOneWidget);

    final updated = await tester.runAsync(() => adapter.getPatient('patient-2'));
    expect(updated!.monthlyFee, 30000);
    expect(updated.name, 'Carlos Eduardo Lima');
  });
}
