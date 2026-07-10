import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/features/agenda/data/in_memory_appointment_adapter.dart';
import 'package:psiops_mobile/features/dashboard/data/charge_adapter.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';
import 'package:psiops_mobile/features/patients/presentation/patient_detail_screen.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

Widget _wrap(Widget child) => MaterialApp(home: child);

void main() {
  // O detalhe também usa uma lista rolável (ListView com várias seções);
  // viewport grande evita que seções mais abaixo (financeiro) fiquem fora do
  // cache extent padrão — mesma lição registrada em
  // dashboard_screen_test.dart/agenda_screen_test.dart.
  setUp(() async {
    final binding = TestWidgetsFlutterBinding.ensureInitialized();
    binding.platformDispatcher.views.first.physicalSize = const Size(400, 2600);
    binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    addTearDown(binding.platformDispatcher.views.first.resetPhysicalSize);
    addTearDown(binding.platformDispatcher.views.first.resetDevicePixelRatio);
  });

  Widget buildDetail({required InMemoryPatientsAdapter adapter, String patientId = 'patient-1'}) => _wrap(
    PatientDetailScreen(
      adapter: adapter,
      appointmentAdapter: InMemoryAppointmentAdapter(now: fixedNow),
      chargeAdapter: InMemoryChargeAdapter(now: fixedNow),
      patientId: patientId,
      now: fixedNow,
    ),
  );

  testWidgets('renderiza dados cadastrais, histórico de consultas, registros administrativos e financeiro', (
    tester,
  ) async {
    await tester.pumpWidget(buildDetail(adapter: InMemoryPatientsAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    expect(find.text('Beatriz Andrade'), findsWidgets);
    expect(find.text('Ativo'), findsOneWidget);
    expect(find.text('(11) 99000-0001'), findsOneWidget);
    expect(find.text('Dia 5'), findsOneWidget);

    // O valor da mensalidade (R$ 250,00) coincide com o valor da cobrança
    // seedada (charge-mock-1) do mesmo paciente — verifica pela key da
    // seção cadastral para não depender de um texto ambíguo.
    final monthlyFeeFinder = find.byKey(const Key('patient-detail-monthly-fee'));
    expect(monthlyFeeFinder, findsOneWidget);
    expect(tester.widget<Text>(monthlyFeeFinder).data, 'R\$ 250,00');

    // Histórico de consultas: consulta seedada hoje 09:00 para patient-1.
    expect(find.byKey(const Key('patient-detail-appointments-empty')), findsNothing);

    // Registros administrativos seedados para patient-1 (compareceu +
    // remarcada).
    expect(find.text('Compareceu'), findsOneWidget);
    expect(find.text('Remarcada'), findsOneWidget);

    // Situação financeira: charge-mock-1 (em dia) pertence a patient-1.
    expect(find.text('Em dia'), findsOneWidget);
  });

  testWidgets('mostra estados vazios em pt-BR quando não há histórico', (tester) async {
    await tester.pumpWidget(buildDetail(adapter: InMemoryPatientsAdapter(now: fixedNow), patientId: 'patient-3'));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('patient-detail-records-empty')), findsOneWidget);
    expect(find.text('Nenhum registro administrativo para este paciente.'), findsOneWidget);
  });

  testWidgets('arquiva o paciente após confirmação e atualiza a situação exibida', (tester) async {
    await tester.pumpWidget(buildDetail(adapter: InMemoryPatientsAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('patient-detail-archive-button')), findsOneWidget);

    await tester.tap(find.byKey(const Key('patient-detail-archive-button')));
    await tester.pumpAndSettle();

    expect(find.text('Arquivar paciente?'), findsOneWidget);
    await tester.tap(find.byKey(const Key('patient-archive-confirm-button')));
    await tester.pumpAndSettle();

    expect(find.text('Paciente arquivado.'), findsOneWidget);
    expect(find.text('Arquivado'), findsOneWidget);
    expect(find.byKey(const Key('patient-detail-archive-button')), findsNothing);
    expect(find.byKey(const Key('patient-detail-archived-banner')), findsOneWidget);
  });
}
