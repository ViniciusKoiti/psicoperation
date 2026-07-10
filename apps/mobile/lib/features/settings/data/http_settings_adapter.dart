import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import '../../../app/http_adapter_support.dart';
import 'settings_adapter.dart';

/// Client HTTP real de [SettingsAdapter.getSettings]/
/// [SettingsAdapter.updateSettings] (`GET`/`PUT /settings`), tipado por
/// [Settings]/[SettingsUpdateRequest] gerados de
/// `packages/contracts/gen/dart`.
///
/// Exercitado contra a API real na integração mobile (PSI-045). Falhas de
/// conectividade e respostas em formato inesperado são mapeadas para
/// [SettingsAdapterException] (mensagem pt-BR), nunca propagadas cruas — ver
/// `http_adapter_support.dart`.
///
/// **Divergência confirmada nesta tarefa, registrada para o orquestrador**:
/// a spec OpenAPI não modela uma preferência de lembrete de conta (ver
/// documentação de [ReminderPreferences]) — não há endpoint real para
/// [getReminderPreferences]/[updateReminderPreferences]. Antes desta tarefa,
/// os dois métodos lançavam [UnimplementedError] incondicionalmente; como
/// `SettingsController.load()` chama `getReminderPreferences` como parte do
/// carregamento único da tela de configurações, isso fazia a tela inteira
/// (incluindo perfil e valor padrão de sessão, que TÊM endpoint real) cair
/// permanentemente em estado de erro em qualquer ambiente que usasse este
/// adapter — nunca exercitado antes porque não havia API real para revelar o
/// problema. Corrigido aqui com o mesmo padrão não-destrutivo de
/// `HttpPatientsAdapter.listAdministrativeRecords`: mantém um valor local
/// (em memória, por instância do adapter) em vez de lançar, para que a tela
/// de configurações permaneça utilizável. Isso significa que a preferência
/// de lembrete **não persiste** entre reinícios do app nem sincroniza entre
/// dispositivos até que um contrato futuro modele essa leitura/escrita —
/// mudança em `packages/contracts` está fora do escopo/allowed_paths desta
/// tarefa.
final class HttpSettingsAdapter implements SettingsAdapter {
  HttpSettingsAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  /// Valor local (não persistido pela API — ver documentação da classe).
  /// Default idêntico ao seed de `InMemorySettingsAdapter`, para que o
  /// comportamento inicial da tela de configurações seja o mesmo
  /// independentemente do adapter selecionado.
  ReminderPreferences _reminderPreferences = const ReminderPreferences(
    enabled: true,
    daysBefore: 3,
  );

  @override
  Future<Settings> getSettings() async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/settings',
        'GET',
        const [],
        null,
        const {},
        const {},
        null,
      ),
      (message) => SettingsAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => Settings.fromJson(_decode(response.body))!,
        (message) => SettingsAdapterException(message),
      );
    }
    throw SettingsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar as configurações (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Settings> updateSettings(SettingsUpdateRequest request) async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/settings',
        'PUT',
        const [],
        request,
        const {},
        const {},
        'application/json',
      ),
      (message) => SettingsAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => Settings.fromJson(_decode(response.body))!,
        (message) => SettingsAdapterException(message),
      );
    }
    throw SettingsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível salvar as configurações (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<ReminderPreferences> getReminderPreferences() async => _reminderPreferences;

  @override
  Future<ReminderPreferences> updateReminderPreferences(
    ReminderPreferences preferences,
  ) async {
    _reminderPreferences = preferences;
    return _reminderPreferences;
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
