import 'package:psiops_contracts/api.dart';

/// Preferências de lembrete de cobrança do MVP (PSI-043): ligar/desligar e
/// antecedência em dias.
///
/// **Gap de contrato conhecido** (documentado no manifesto PSI-043,
/// assumptions): a spec OpenAPI atual (`Settings`/`Reminder` em
/// `packages/contracts/openapi/components/`) não modela uma preferência de
/// lembrete — só o schema `Settings` (valor/dia padrão de mensalidade, juros
/// padrão, fuso) e o domínio `Reminder` (lembretes individuais já
/// disparados/agendados pelo backend). Por isso esta classe **não** é um DTO
/// gerado de `packages/contracts/gen/dart` — é um valor local, persistido
/// apenas pelo adapter (mock em dev/test), até que um contrato futuro modele
/// esta preferência de conta. O disparo real do lembrete continua sendo
/// responsabilidade do backend (fora de escopo desta tarefa e desta classe).
class ReminderPreferences {
  const ReminderPreferences({required this.enabled, required this.daysBefore});

  /// Se lembretes de cobrança devem ser enviados.
  final bool enabled;

  /// Antecedência (em dias) do lembrete em relação ao vencimento.
  final int daysBefore;

  ReminderPreferences copyWith({bool? enabled, int? daysBefore}) => ReminderPreferences(
    enabled: enabled ?? this.enabled,
    daysBefore: daysBefore ?? this.daysBefore,
  );
}

/// Porta de acesso às configurações da conta da psicóloga (PSI-043).
///
/// [Settings]/[SettingsUpdateRequest] vêm de `packages/contracts/gen/dart`
/// (codegen do `openapi.yaml` — ADR 0008); este adapter nunca redefine DTOs
/// de API localmente. `Settings.defaultMonthlyFee` é o "valor padrão de
/// sessão" do acceptance criteria — sempre centavos BRL inteiros.
///
/// Duas implementações, seguindo o padrão de PSI-040/041/042/043:
/// - `InMemorySettingsAdapter`: mock em memória, padrão em dev/test.
/// - `HttpSettingsAdapter`: client HTTP real tipado pelos mesmos modelos
///   para `getSettings`/`updateSettings` (endpoints reais existem —
///   `GET`/`PUT /settings`); as preferências de lembrete não têm endpoint
///   real (ver [ReminderPreferences]) e permanecem apenas no mock nesta
///   tarefa. Implementado e compilável, mas não exercitado contra a API real
///   (integração real é PSI-045).
abstract interface class SettingsAdapter {
  Future<Settings> getSettings();

  Future<Settings> updateSettings(SettingsUpdateRequest request);

  Future<ReminderPreferences> getReminderPreferences();

  Future<ReminderPreferences> updateReminderPreferences(ReminderPreferences preferences);
}

/// Erro genérico de acesso às configurações (rede, servidor, resposta
/// inesperada). [message] é um texto pt-BR adequado para exibição direta na
/// UI.
class SettingsAdapterException implements Exception {
  const SettingsAdapterException(this.message);

  final String message;

  @override
  String toString() => 'SettingsAdapterException: $message';
}

/// Adapter em memória usado no ambiente `AppEnvironment.dev` (e em testes).
final class InMemorySettingsAdapter implements SettingsAdapter {
  InMemorySettingsAdapter({DateTime Function()? now}) : _now = now ?? DateTime.now;

  final DateTime Function() _now;

  Settings _settings = Settings(
    defaultMonthlyFee: 20000,
    defaultBillingDay: 10,
    timezone: 'America/Sao_Paulo',
    updatedAt: DateTime.utc(2026, 1, 1),
  );

  ReminderPreferences _reminderPreferences = const ReminderPreferences(
    enabled: true,
    daysBefore: 3,
  );

  Future<void> _delay() => Future<void>.delayed(const Duration(milliseconds: 10));

  @override
  Future<Settings> getSettings() async {
    await _delay();
    return _settings;
  }

  @override
  Future<Settings> updateSettings(SettingsUpdateRequest request) async {
    await _delay();
    _settings = Settings(
      defaultMonthlyFee: request.defaultMonthlyFee ?? _settings.defaultMonthlyFee,
      defaultBillingDay: request.defaultBillingDay ?? _settings.defaultBillingDay,
      defaultInterest: request.defaultInterest ?? _settings.defaultInterest,
      timezone: request.timezone ?? _settings.timezone,
      onboardingCompletedAt: _settings.onboardingCompletedAt,
      updatedAt: _now().toUtc(),
    );
    return _settings;
  }

  @override
  Future<ReminderPreferences> getReminderPreferences() async {
    await _delay();
    return _reminderPreferences;
  }

  @override
  Future<ReminderPreferences> updateReminderPreferences(ReminderPreferences preferences) async {
    await _delay();
    _reminderPreferences = preferences;
    return _reminderPreferences;
  }
}
