import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/agenda/data/appointment_adapter.dart';
import 'package:psiops_mobile/features/agenda/data/in_memory_appointment_adapter.dart';
import 'package:psiops_mobile/features/dashboard/data/charge_adapter.dart';
import 'package:psiops_mobile/features/dashboard/data/task_adapter.dart';
import 'package:psiops_mobile/features/dashboard/presentation/dashboard_screen.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

/// Adapters vazios (sem seed) para exercitar o estado vazio do dashboard.
class _EmptyAppointmentAdapter implements AppointmentAdapter {
  @override
  Future<List<Appointment>> listAppointments({required DateTime from, required DateTime to}) async => [];

  @override
  Future<Appointment> createAppointment(AppointmentCreateRequest request) => throw UnimplementedError();

  @override
  Future<Appointment> rescheduleAppointment(String appointmentId, AppointmentUpdateRequest request) =>
      throw UnimplementedError();

  @override
  Future<void> cancelAppointment(String appointmentId) => throw UnimplementedError();
}

class _EmptyChargeAdapter implements ChargeAdapter {
  @override
  Future<List<Charge>> listCharges() async => [];
}

class _EmptyTaskAdapter implements TaskAdapter {
  @override
  Future<List<Task>> listTasks() async => [];
}

Widget _wrap(Widget child) => MaterialApp(home: child);

void main() {
  // O dashboard usa uma `ListView` rolável; um viewport de teste grande o
  // suficiente evita que a seção "Tarefas de hoje" (mais abaixo) fique fora
  // do cache extent padrão e não seja montada, sem precisar rolar em cada
  // asserção.
  setUp(() async {
    final binding = TestWidgetsFlutterBinding.ensureInitialized();
    binding.platformDispatcher.views.first.physicalSize = const Size(400, 2400);
    binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    addTearDown(binding.platformDispatcher.views.first.resetPhysicalSize);
    addTearDown(binding.platformDispatcher.views.first.resetDevicePixelRatio);
  });

  testWidgets('mostra indicador de carregamento antes de resolver os dados', (tester) async {
    await tester.pumpWidget(
      _wrap(
        DashboardScreen(
          appointmentAdapter: InMemoryAppointmentAdapter(now: fixedNow),
          chargeAdapter: InMemoryChargeAdapter(now: fixedNow),
          taskAdapter: InMemoryTaskAdapter(now: fixedNow),
          patientsAdapter: InMemoryPatientsAdapter(now: fixedNow),
          now: fixedNow,
        ),
      ),
    );
    expect(find.byKey(const Key('dashboard-loading')), findsOneWidget);
    await tester.pumpAndSettle();
  });

  testWidgets(
    'renderiza consultas de hoje, pendências financeiras e tarefas do dia com dados mock',
    (tester) async {
      await tester.pumpWidget(
        _wrap(
          DashboardScreen(
            appointmentAdapter: InMemoryAppointmentAdapter(now: fixedNow),
            chargeAdapter: InMemoryChargeAdapter(now: fixedNow),
            taskAdapter: InMemoryTaskAdapter(now: fixedNow),
            patientsAdapter: InMemoryPatientsAdapter(now: fixedNow),
            now: fixedNow,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Consultas de hoje (seed do InMemoryAppointmentAdapter): patient-1 e
      // patient-2, resolvidos para nome via InMemoryPatientsAdapter.
      // "Carlos Eduardo Lima" aparece duas vezes: na consulta de hoje e na
      // pendência financeira (também dele) — daí findsWidgets.
      expect(find.text('Beatriz Andrade'), findsOneWidget);
      expect(find.text('Carlos Eduardo Lima'), findsWidgets);

      // Pendência financeira em BRL formatada em pt-BR (charge-mock-2:
      // 20000 centavos = R$ 200,00).
      expect(find.text('R\$ 200,00'), findsOneWidget);
      // Cobrança atrasada (charge-mock-3, patient-3): R$ 220,00.
      expect(find.text('R\$ 220,00'), findsOneWidget);
      // Cobrança em dia (charge-mock-1) não deve aparecer nas pendências.
      expect(find.text('R\$ 250,00'), findsNothing);

      // Tarefa de hoje pendente.
      expect(find.text('Confirmar consultas de amanhã por WhatsApp'), findsOneWidget);
    },
  );

  testWidgets('mostra estados vazios com textos em pt-BR quando não há dados', (tester) async {
    await tester.pumpWidget(
      _wrap(
        DashboardScreen(
          appointmentAdapter: _EmptyAppointmentAdapter(),
          chargeAdapter: _EmptyChargeAdapter(),
          taskAdapter: _EmptyTaskAdapter(),
          patientsAdapter: InMemoryPatientsAdapter(now: fixedNow),
          now: fixedNow,
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('dashboard-appointments-empty')), findsOneWidget);
    expect(find.text('Nenhuma consulta agendada para hoje.'), findsOneWidget);
    expect(find.byKey(const Key('dashboard-charges-empty')), findsOneWidget);
    expect(find.text('Nenhuma pendência financeira.'), findsOneWidget);
    expect(find.byKey(const Key('dashboard-tasks-empty')), findsOneWidget);
    expect(find.text('Nenhuma tarefa para hoje.'), findsOneWidget);
  });
}
