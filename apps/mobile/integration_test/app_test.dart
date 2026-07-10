import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:integration_test/integration_test.dart';
import 'package:psiops_mobile/app/app.dart';
import 'package:psiops_mobile/app/env.dart';
import 'package:psiops_mobile/app/router.dart';

/// Prova de integração da PSI-045: o app companion, montado com os
/// adapters HTTP reais ([AppEnvironment.prod]), exercitado de ponta a ponta
/// contra a API local (docker compose — PostgreSQL 16 + Mailpit — com a API
/// Spring rodando via `./mvnw spring-boot:run`, ver `apps/mobile/README.md`).
///
/// Cobre o caminho crítico da psicóloga: **login → criar paciente → agendar
/// consulta**, com asserções sobre o estado final na UI (não apenas "não
/// lançou exceção") — cadastro traz para a home, paciente aparece na lista
/// recém-criada e a consulta aparece na agenda do dia.
///
/// **Dados isolados por execução**: registra uma conta nova a cada rodada
/// (e-mail com um sufixo derivado do relógio + `hashCode`, ver [_uniqueSuffix])
/// em vez de reaproveitar uma conta semente — a suíte pode ser executada
/// repetidamente sem intervenção manual (limpar banco, trocar e-mail à mão),
/// mesmo que a API rejeite e-mail duplicado (`409` em `/auth/register`).
///
/// **Navegação**: a maior parte do fluxo usa interação real de UI (toques,
/// preenchimento de formulário). Um único trecho (comentado no local) navega
/// diretamente via `GoRouter.of(context).goNamed(...)` para ir da tela de
/// Pacientes para a Agenda — o MVP não tem navegação lateral/inferior entre
/// essas duas telas (ambas só são alcançadas a partir da Home via
/// `context.goNamed`, que substitui a pilha em vez de empilhar — não haveria
/// "voltar" da tela de Pacientes para a Home por `Navigator.pop`). Isso é
/// deliberado e documentado aqui, não um atalho para evitar testar a UI.
///
/// **Como rodar** (precisa de um dispositivo/emulador Android conectado ou
/// do target desktop Linux habilitado — ver `apps/mobile/README.md`):
/// ```bash
/// cd apps/mobile
/// flutter test integration_test/app_test.dart \
///   --dart-define=PSIOPS_API_BASE_URL=http://10.0.2.2:8080/api/v1
/// ```
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'login (registro) → criar paciente → agendar consulta contra a API real',
    (tester) async {
      final suffix = _uniqueSuffix();
      final email = 'integracao.$suffix@psiops-teste.dev';
      const password = 'Psiops123!';
      final accountName = 'Psicóloga Integração $suffix';
      final patientName = 'Paciente Integração $suffix';

      // Composição forçada para o ambiente `prod`: os adapters `Http*`
      // (PSI-045) são exercitados de verdade, independentemente do
      // `--dart-define=PSIOPS_ENV` usado para rodar este arquivo — só a
      // base URL da API (`PSIOPS_API_BASE_URL`) precisa vir de fora, porque
      // `ApiConfig.baseUrl` é lido em tempo de compilação
      // (`String.fromEnvironment`).
      await tester.pumpWidget(const PsiOpsApp(environment: AppEnvironment.prod));
      await tester.pumpAndSettle();

      // --- LOGIN (via registro de conta nova) -----------------------------
      expect(find.byKey(const Key('login-email-field')), findsOneWidget);

      await tester.tap(find.byKey(const Key('login-go-register-button')));
      await tester.pumpAndSettle();

      await tester.enterText(find.byKey(const Key('register-name-field')), accountName);
      await tester.enterText(find.byKey(const Key('register-email-field')), email);
      await tester.enterText(find.byKey(const Key('register-password-field')), password);
      await tester.tap(find.byKey(const Key('register-submit-button')));
      await tester.pumpAndSettle();

      expect(
        find.byKey(const Key('register-error-message')),
        findsNothing,
        reason: 'Registro deveria suceder contra a API real com um e-mail novo por rodada.',
      );
      expect(find.byKey(const Key('home-profile-name')), findsOneWidget);

      // --- CRIAR PACIENTE --------------------------------------------------
      await tester.tap(find.byKey(const Key('home-nav-patients-button')));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('patients-empty')), findsOneWidget);

      await tester.tap(find.byKey(const Key('patients-add-button')));
      await tester.pumpAndSettle();

      await tester.enterText(find.byKey(const Key('patient-form-name-field')), patientName);
      await tester.enterText(
        find.byKey(const Key('patient-form-monthly-fee-field')),
        '150,00',
      );
      // Dia de vencimento e demais campos ficam no default do formulário
      // (dia 5, sem WhatsApp/e-mail/anotações) — irrelevantes para o
      // caminho crítico coberto aqui.
      await tester.tap(find.byKey(const Key('patient-form-submit-button')));
      await tester.pumpAndSettle();

      expect(
        find.byKey(const Key('patient-form-error')),
        findsNothing,
        reason: 'Cadastro de paciente deveria suceder contra a API real.',
      );
      expect(find.text(patientName), findsOneWidget);

      // --- AGENDAR CONSULTA --------------------------------------------------
      // Navegação direta via go_router (ver docstring desta suíte): a tela
      // de Pacientes não tem um caminho de UI para a Agenda, só a Home tem.
      final context = tester.element(find.byKey(const Key('patients-add-button')));
      GoRouter.of(context).goNamed(Routes.agenda);
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('agenda-appointments-empty')), findsOneWidget);

      await tester.tap(find.byKey(const Key('agenda-fab')));
      await tester.pumpAndSettle();

      // O paciente recém-criado é o único da carteira, então já vem
      // pré-selecionado no formulário (`AppointmentFormSheet` seleciona
      // `patients.first` quando há só um). Data/horário/duração ficam no
      // default do sheet (hoje às 09:00, 50 minutos) — não há consulta
      // prévia na conta nova, então não há conflito de horário a evitar.
      expect(find.byKey(const Key('agenda-form-conflict-message')), findsNothing);
      await tester.tap(find.byKey(const Key('agenda-form-submit-button')));
      await tester.pumpAndSettle();

      // --- ASSERÇÃO DO ESTADO FINAL ------------------------------------------
      expect(
        find.byKey(const Key('agenda-form-submit-error')),
        findsNothing,
        reason: 'Agendamento deveria suceder contra a API real.',
      );
      expect(
        find.byKey(const Key('agenda-appointments-empty')),
        findsNothing,
        reason: 'A consulta recém-criada deveria aparecer na agenda do dia.',
      );
      expect(
        find.text(patientName),
        findsOneWidget,
        reason: 'O card da consulta deveria exibir o nome do paciente agendado.',
      );
    },
  );
}

/// Sufixo curto e praticamente único por execução — combina o instante
/// corrente (microssegundos) com o hash do objeto `Object()` recém-criado
/// (evita colisão mesmo se duas rodadas iniciarem no mesmo microssegundo em
/// isolates diferentes). Usado para gerar e-mail de conta e nome de paciente
/// exclusivos da rodada, permitindo reexecutar a suíte sem intervenção
/// manual (sem "e-mail já cadastrado" nem dado de rodada anterior
/// contaminando as asserções).
String _uniqueSuffix() {
  final millis = DateTime.now().millisecondsSinceEpoch;
  final salt = Object().hashCode.toRadixString(36);
  return '$millis$salt';
}
