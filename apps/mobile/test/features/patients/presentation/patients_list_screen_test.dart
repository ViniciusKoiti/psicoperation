import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:psiops_mobile/app/router.dart';
import 'package:psiops_mobile/features/agenda/data/in_memory_appointment_adapter.dart';
import 'package:psiops_mobile/features/dashboard/data/charge_adapter.dart';
import 'package:psiops_mobile/features/patients/data/patients_adapter.dart';
import 'package:psiops_mobile/features/patients/presentation/patient_detail_screen.dart';
import 'package:psiops_mobile/features/patients/presentation/patient_form_screen.dart';
import 'package:psiops_mobile/features/patients/presentation/patients_list_screen.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8);

/// Router mínimo com apenas as rotas de pacientes (mesmos nomes/caminhos de
/// `app/router.dart`) — `PatientsListScreen` navega via `context.pushNamed`
/// (mesmo padrão de `LoginScreen`/`RegisterScreen`, PSI-040), então precisa
/// de um `GoRouter` real na árvore de widgets para os testes de navegação.
Widget _wrap(PatientsAdapter adapter) {
  final appointmentAdapter = InMemoryAppointmentAdapter(now: fixedNow);
  final chargeAdapter = InMemoryChargeAdapter(now: fixedNow);

  final router = GoRouter(
    initialLocation: Routes.patientsPath,
    routes: [
      GoRoute(
        path: Routes.patientsPath,
        name: Routes.patients,
        builder: (context, state) => PatientsListScreen(adapter: adapter),
      ),
      GoRoute(
        path: Routes.patientCreatePath,
        name: Routes.patientCreate,
        builder: (context, state) => PatientFormScreen.create(adapter: adapter),
      ),
      GoRoute(
        path: Routes.patientDetailPath,
        name: Routes.patientDetail,
        builder: (context, state) => PatientDetailScreen(
          adapter: adapter,
          appointmentAdapter: appointmentAdapter,
          chargeAdapter: chargeAdapter,
          patientId: state.pathParameters['patientId']!,
          now: fixedNow,
        ),
      ),
    ],
  );
  return MaterialApp.router(routerConfig: router);
}

void main() {
  setUp(() async {
    final binding = TestWidgetsFlutterBinding.ensureInitialized();
    binding.platformDispatcher.views.first.physicalSize = const Size(400, 2600);
    binding.platformDispatcher.views.first.devicePixelRatio = 1.0;
    addTearDown(binding.platformDispatcher.views.first.resetPhysicalSize);
    addTearDown(binding.platformDispatcher.views.first.resetDevicePixelRatio);
  });

  testWidgets('mostra os pacientes ativos semeados', (tester) async {
    await tester.pumpWidget(_wrap(InMemoryPatientsAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    expect(find.text('Beatriz Andrade'), findsOneWidget);
    expect(find.text('Carlos Eduardo Lima'), findsOneWidget);
    expect(find.text('Daniela Souza'), findsOneWidget);
  });

  testWidgets('busca por nome filtra a lista reativamente conforme digitação', (tester) async {
    await tester.pumpWidget(_wrap(InMemoryPatientsAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('patients-search-field')), 'daniela');
    await tester.pumpAndSettle();

    expect(find.text('Daniela Souza'), findsOneWidget);
    expect(find.text('Beatriz Andrade'), findsNothing);
    expect(find.text('Carlos Eduardo Lima'), findsNothing);
  });

  testWidgets('filtro de arquivados mostra estado vazio quando não há pacientes arquivados', (tester) async {
    await tester.pumpWidget(_wrap(InMemoryPatientsAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Arquivados'));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('patients-empty')), findsOneWidget);
    expect(find.text('Nenhum paciente arquivado encontrado.'), findsOneWidget);
  });

  testWidgets('toque num paciente abre o detalhe', (tester) async {
    await tester.pumpWidget(_wrap(InMemoryPatientsAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Beatriz Andrade'));
    await tester.pumpAndSettle();

    expect(find.text('Dados cadastrais'), findsOneWidget);
    expect(find.text('Situação financeira'), findsOneWidget);
  });

  testWidgets('arquivar um paciente no detalhe o remove da lista ativa e ele aparece no filtro de arquivados', (
    tester,
  ) async {
    await tester.pumpWidget(_wrap(InMemoryPatientsAdapter(now: fixedNow)));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Carlos Eduardo Lima'));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('patient-detail-archive-button')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('patient-archive-confirm-button')));
    await tester.pumpAndSettle();

    // Volta para a lista.
    await tester.pageBack();
    await tester.pumpAndSettle();

    expect(find.text('Carlos Eduardo Lima'), findsNothing);
    expect(find.text('Beatriz Andrade'), findsOneWidget);

    await tester.tap(find.text('Arquivados'));
    await tester.pumpAndSettle();

    expect(find.text('Carlos Eduardo Lima'), findsOneWidget);
  });
}
