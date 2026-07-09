import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';

import 'patient_lookup_adapter.dart';

/// Client HTTP real do [PatientLookupAdapter] (`GET /patients`), tipado por
/// [PatientPage]/[Patient] gerados de `packages/contracts/gen/dart`.
///
/// Implementado e compilável, mas não exercitado contra a API real nesta
/// tarefa (PSI-041) — integração real é PSI-045.
final class HttpPatientLookupAdapter implements PatientLookupAdapter {
  HttpPatientLookupAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  static const int _pageSize = 100;

  @override
  Future<List<Patient>> listPatients() async {
    final response = await _client.invokeAPI(
      '/patients',
      'GET',
      [QueryParam('size', '$_pageSize')],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 200) {
      final page = PatientPage.fromJson(
        response.body.isEmpty ? null : jsonDecode(response.body),
      );
      return page?.items ?? const [];
    }
    throw PatientLookupException(
      'Não foi possível carregar os pacientes (HTTP ${response.statusCode}).',
    );
  }
}
