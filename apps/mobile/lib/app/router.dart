import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/agenda/data/appointment_adapter.dart';
import '../features/agenda/data/patient_lookup_adapter.dart';
import '../features/agenda/presentation/agenda_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/auth/presentation/splash_screen.dart';
import '../features/auth/state/session_controller.dart';
import '../features/dashboard/data/charge_adapter.dart';
import '../features/dashboard/data/task_adapter.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/home/data/profile_repository.dart';
import '../features/home/presentation/home_screen.dart';

/// Nomes e caminhos de rota do app (evita strings mágicas espalhadas na
/// navegação).
abstract final class Routes {
  static const String splash = 'splash';
  static const String splashPath = '/splash';

  static const String login = 'login';
  static const String loginPath = '/login';

  static const String register = 'register';
  static const String registerPath = '/registro';

  static const String home = 'home';
  static const String homePath = '/';

  /// Dashboard do dia (PSI-041) — próximas consultas, pendências financeiras
  /// e tarefas do dia.
  static const String dashboard = 'dashboard';
  static const String dashboardPath = '/hoje';

  /// Agenda (PSI-041) — visões diária/semanal e gestão de consultas.
  static const String agenda = 'agenda';
  static const String agendaPath = '/agenda';
}

/// Configuração de navegação com go_router: shell de autenticação (splash,
/// login, registro) + rota protegida (home).
///
/// O [redirect] observa [session] via `refreshListenable` e decide, a cada
/// mudança de [SessionStatus]:
/// - `unknown`: mantém a usuária na splash até o estado inicial ser
///   resolvido (evita flicker/loop — risco citado no manifesto PSI-040).
/// - `unauthenticated`: protege qualquer rota fora do login/registro,
///   redirecionando ao login e preservando a rota de destino original na
///   query `redirect` para restaurá-la após autenticar.
/// - `authenticated`: tira a usuária da splash/login/registro, indo para a
///   rota de destino preservada (ou para a home).
///
/// Os adapters ([ProfileRepository], [AppointmentAdapter],
/// [PatientLookupAdapter], [ChargeAdapter], [TaskAdapter]) são injetados (o
/// entrypoint escolhe mock ou real por ambiente — PSI-040/PSI-041),
/// mantendo o router agnóstico ao ambiente.
GoRouter buildRouter({
  required ProfileRepository profileRepository,
  required AppointmentAdapter appointmentAdapter,
  required PatientLookupAdapter patientLookupAdapter,
  required ChargeAdapter chargeAdapter,
  required TaskAdapter taskAdapter,
  required SessionController session,
}) {
  return GoRouter(
    initialLocation: Routes.splashPath,
    refreshListenable: session,
    redirect: (context, state) => _redirect(session, state),
    routes: [
      GoRoute(
        path: Routes.splashPath,
        name: Routes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: Routes.loginPath,
        name: Routes.login,
        builder: (context, state) => LoginScreen(session: session),
      ),
      GoRoute(
        path: Routes.registerPath,
        name: Routes.register,
        builder: (context, state) => RegisterScreen(session: session),
      ),
      GoRoute(
        path: Routes.homePath,
        name: Routes.home,
        builder: (context, state) => HomeScreen(
          repository: profileRepository,
          onLogout: session.logout,
          onOpenDashboard: () => context.goNamed(Routes.dashboard),
          onOpenAgenda: () => context.goNamed(Routes.agenda),
        ),
      ),
      GoRoute(
        path: Routes.dashboardPath,
        name: Routes.dashboard,
        builder: (context, state) => DashboardScreen(
          appointmentAdapter: appointmentAdapter,
          chargeAdapter: chargeAdapter,
          taskAdapter: taskAdapter,
          patientLookupAdapter: patientLookupAdapter,
          onOpenAgenda: () => context.goNamed(Routes.agenda),
        ),
      ),
      GoRoute(
        path: Routes.agendaPath,
        name: Routes.agenda,
        builder: (context, state) => AgendaScreen(
          appointmentAdapter: appointmentAdapter,
          patientLookupAdapter: patientLookupAdapter,
        ),
      ),
    ],
    errorBuilder: (context, state) => _UnknownRouteScreen(uri: state.uri),
  );
}

String? _redirect(SessionController session, GoRouterState state) {
  final location = state.matchedLocation;
  final atSplash = location == Routes.splashPath;
  final atAuthGate =
      location == Routes.loginPath || location == Routes.registerPath;

  switch (session.status) {
    case SessionStatus.unknown:
      return atSplash ? null : Routes.splashPath;

    case SessionStatus.unauthenticated:
      if (atAuthGate) return null;
      return Uri(
        path: Routes.loginPath,
        queryParameters: {'redirect': state.uri.toString()},
      ).toString();

    case SessionStatus.authenticated:
      if (atSplash || atAuthGate) {
        final target = state.uri.queryParameters['redirect'];
        if (target != null && _isSafeRedirectTarget(target)) return target;
        return Routes.homePath;
      }
      return null;
  }
}

/// Aceita apenas caminhos internos (evita open-redirect para uma URL
/// externa) e nunca redireciona de volta para o próprio portão de
/// autenticação/splash (evita loop).
bool _isSafeRedirectTarget(String target) {
  if (!target.startsWith('/') || target.startsWith('//')) return false;
  final path = Uri.parse(target).path;
  return path != Routes.loginPath &&
      path != Routes.registerPath &&
      path != Routes.splashPath;
}

class _UnknownRouteScreen extends StatelessWidget {
  const _UnknownRouteScreen({required this.uri});

  final Uri uri;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Rota não encontrada')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Página não encontrada', style: textTheme.headlineSmall),
              const SizedBox(height: 8),
              Text(uri.toString(), style: textTheme.bodyMedium),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.goNamed(Routes.home),
                child: const Text('Voltar ao início'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
