import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import 'task_adapter.dart';

/// Client HTTP real do [TaskAdapter] (`GET /tasks`), tipado por
/// [TaskPage]/[Task] gerados de `packages/contracts/gen/dart`.
///
/// Implementado e compilável, mas não exercitado contra a API real nesta
/// tarefa (PSI-041) — integração real é PSI-045.
final class HttpTaskAdapter implements TaskAdapter {
  HttpTaskAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  static const int _pageSize = 100;

  @override
  Future<List<Task>> listTasks() async {
    final response = await _client.invokeAPI(
      '/tasks',
      'GET',
      [QueryParam('size', '$_pageSize')],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 200) {
      final page = TaskPage.fromJson(
        response.body.isEmpty ? null : jsonDecode(response.body),
      );
      return page?.items ?? const [];
    }
    throw TaskAdapterException(
      'Não foi possível carregar as tarefas (HTTP ${response.statusCode}).',
    );
  }
}
