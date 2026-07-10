import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_mobile/features/agenda/data/in_memory_appointment_adapter.dart';
import 'package:psiops_mobile/features/agenda/presentation/agenda_screen.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';

// segunda-feira fixa: alinha com o seed do InMemoryAppointmentAdapter (uma
// consulta às 09:00 e outra às 15:30 no dia, mais uma recorrente às 11:00).
DateTime fixedNow() => DateTime(2026, 7, 6, 8);

Widget _wrap(Widget child) => MaterialApp(home: child);

void main() {
  // A agenda também usa listas roláveis; viewport grande evita que itens
  // fiquem fora do cache extent padrão durante os testes (mesma lição do
  // dashboard_screen_test.dart).
  setUp(() async {
    final binding = TestWidgetsFlutterBinding.ensureInitialized();
    binding.platformDispatcher.views.first.physicalSize = const Size(400, 2400);
    binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    addTearDown(binding.platformDispatcher.views.first.resetPhysicalSize);
    addTearDown(binding.platformDispatcher.views.first.resetDevicePixelRatio);
  });

  Widget buildAgenda() => _wrap(
    AgendaScreen(
      appointmentAdapter: InMemoryAppointmentAdapter(now: fixedNow),
      patientsAdapter: InMemoryPatientsAdapter(now: fixedNow),
      now: fixedNow,
    ),
  );

  testWidgets('visão diária mostra as consultas de hoje e destaca o dia atual', (tester) async {
    await tester.pumpWidget(buildAgenda());
    await tester.pumpAndSettle();

    expect(find.text('Segunda-feira • Hoje'), findsOneWidget);
    // Consultas seedadas para hoje: Beatriz (09:00), Daniela (11:00,
    // recorrente) e Carlos (15:30).
    expect(find.text('Beatriz Andrade'), findsOneWidget);
    expect(find.text('Daniela Souza'), findsOneWidget);
    expect(find.text('Carlos Eduardo Lima'), findsOneWidget);
  });

  testWidgets('alterna para a visão semanal e navega pelos dias da semana', (tester) async {
    await tester.pumpWidget(buildAgenda());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Semana'));
    await tester.pumpAndSettle();

    // Ainda no dia de hoje (segunda), a lista mostra as mesmas consultas.
    expect(find.text('Beatriz Andrade'), findsOneWidget);

    // Navegar para a próxima semana esvazia a lista (sem consultas
    // seedadas na semana seguinte, exceto ocorrências da recorrência).
    await tester.tap(find.byKey(const Key('agenda-next-week-button')));
    await tester.pumpAndSettle();
    expect(find.text('Carlos Eduardo Lima'), findsNothing);
    expect(find.text('Beatriz Andrade'), findsNothing);
    // A ocorrência recorrente de Daniela Souza (semanal) continua visível.
    expect(find.text('Daniela Souza'), findsOneWidget);
  });

  testWidgets('cria consulta e detecta conflito de horário antes da confirmação', (tester) async {
    await tester.pumpWidget(buildAgenda());
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('agenda-fab')));
    await tester.pumpAndSettle();

    // O formulário abre com o horário padrão (09:00 de hoje), que já
    // conflita com a consulta seedada de Beatriz Andrade no mesmo horário —
    // detectado no client antes de chamar o adapter.
    expect(find.byKey(const Key('agenda-form-conflict-message')), findsOneWidget);

    final submitButton = tester.widget<FilledButton>(
      find.byKey(const Key('agenda-form-submit-button')),
    );
    expect(submitButton.onPressed, isNull, reason: 'botão de confirmação deve ficar bloqueado');
  });

  testWidgets('cancela uma consulta após confirmação', (tester) async {
    await tester.pumpWidget(buildAgenda());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Beatriz Andrade'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('agenda-action-cancel-button')));
    await tester.pumpAndSettle();

    expect(find.text('Cancelar consulta?'), findsOneWidget);
    await tester.tap(find.byKey(const Key('agenda-cancel-confirm-button')));
    await tester.pumpAndSettle();

    expect(find.text('Beatriz Andrade'), findsNothing);
  });
}
