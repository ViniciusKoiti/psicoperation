import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import '../../../app/http_adapter_support.dart';
import 'task_adapter.dart';

/// Client HTTP real do [TaskAdapter] (`GET /tasks`), tipado por
/// [TaskPage]/[Task] gerados de `packages/contracts/gen/dart`.
///
/// Exercitado contra a API real na integração mobile (PSI-045). Falhas de
/// conectividade e respostas em formato inesperado são mapeadas para
/// [TaskAdapterException] (mensagem pt-BR), nunca propagadas cruas — ver
/// `http_adapter_support.dart`.
final class HttpTaskAdapter implements TaskAdapter {
  HttpTaskAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  static const int _pageSize = 100;

  @override
  Future<List<Task>> listTasks() async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/tasks',
        'GET',
        [QueryParam('size', '$_pageSize')],
        null,
        const {},
        const {},
        null,
      ),
      (message) => TaskAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () =>
            TaskPage.fromJson(
              response.body.isEmpty ? null : jsonDecode(response.body),
            )?.items ??
            const [],
        (message) => TaskAdapterException(message),
      );
    }
    throw TaskAdapterException(
      'Não foi possível carregar as tarefas (HTTP ${response.statusCode}).',
    );
  }
}
