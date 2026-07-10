import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import 'settings_adapter.dart';

/// Client HTTP real de [SettingsAdapter.getSettings]/
/// [SettingsAdapter.updateSettings] (`GET`/`PUT /settings`), tipado por
/// [Settings]/[SettingsUpdateRequest] gerados de
/// `packages/contracts/gen/dart`.
///
/// Implementado e compilável, mas não exercitado contra a API real nesta
/// tarefa (PSI-043) — integração real é PSI-045.
///
/// [getReminderPreferences]/[updateReminderPreferences] lançam
/// [UnimplementedError]: a spec OpenAPI atual não modela uma preferência de
/// lembrete de conta (ver documentação de [ReminderPreferences]) — não há
/// endpoint real para implementar. Mesmo padrão de gap documentado de
/// `HttpPatientsAdapter.listAdministrativeRecords`.
final class HttpSettingsAdapter implements SettingsAdapter {
  HttpSettingsAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  @override
  Future<Settings> getSettings() async {
    final response = await _client.invokeAPI(
      '/settings',
      'GET',
      const [],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 200) {
      return Settings.fromJson(_decode(response.body))!;
    }
    throw SettingsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar as configurações (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Settings> updateSettings(SettingsUpdateRequest request) async {
    final response = await _client.invokeAPI(
      '/settings',
      'PUT',
      const [],
      request,
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 200) {
      return Settings.fromJson(_decode(response.body))!;
    }
    throw SettingsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível salvar as configurações (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<ReminderPreferences> getReminderPreferences() {
    throw UnimplementedError(
      'A spec OpenAPI não modela preferência de lembrete de conta (ver PSI-045).',
    );
  }

  @override
  Future<ReminderPreferences> updateReminderPreferences(ReminderPreferences preferences) {
    throw UnimplementedError(
      'A spec OpenAPI não modela preferência de lembrete de conta (ver PSI-045).',
    );
  }

  dynamic _decode(String body) => body.isEmpty ? null : jsonDecode(body);

  String? _problemMessage(String body) {
    if (body.isEmpty) return null;
    try {
      final problem = Problem.fromJson(_decode(body));
      return problem?.detail ?? problem?.title;
    } catch (_) {
      return null;
    }
  }
}
