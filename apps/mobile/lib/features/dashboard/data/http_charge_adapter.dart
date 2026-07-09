import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import 'charge_adapter.dart';

/// Client HTTP real do [ChargeAdapter] (`GET /charges`), tipado por
/// [ChargePage]/[Charge] gerados de `packages/contracts/gen/dart`.
///
/// Implementado e compilável, mas não exercitado contra a API real nesta
/// tarefa (PSI-041) — integração real é PSI-045.
final class HttpChargeAdapter implements ChargeAdapter {
  HttpChargeAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  static const int _pageSize = 100;

  @override
  Future<List<Charge>> listCharges() async {
    final response = await _client.invokeAPI(
      '/charges',
      'GET',
      [QueryParam('size', '$_pageSize')],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 200) {
      final page = ChargePage.fromJson(
        response.body.isEmpty ? null : jsonDecode(response.body),
      );
      return page?.items ?? const [];
    }
    throw ChargeAdapterException(
      'Não foi possível carregar as cobranças (HTTP ${response.statusCode}).',
    );
  }
}
