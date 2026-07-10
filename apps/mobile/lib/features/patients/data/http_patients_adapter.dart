import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import 'patients_adapter.dart';

/// Client HTTP real do [PatientsAdapter], tipado pelos modelos Dart gerados
/// de `packages/contracts/gen/dart` (`Patient`, `PatientPage`,
/// `PatientCreateRequest`, `PatientUpdateRequest`, `Problem`) — nunca
/// redefine DTOs de API localmente (ADR 0008, regra 8 do CLAUDE.md).
///
/// Implementado e compilável, mas **não exercitado contra a API real** nesta
/// tarefa (PSI-042) — a integração real acontece na PSI-045.
final class HttpPatientsAdapter implements PatientsAdapter {
  HttpPatientsAdapter({ApiClient? apiClient})
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
      final page = PatientPage.fromJson(_decode(response.body));
      return page?.items ?? const [];
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar os pacientes (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<List<Patient>> listPatientsByStatus(PatientStatus status) async {
    final response = await _client.invokeAPI(
      '/patients',
      'GET',
      [QueryParam('status', status.value), QueryParam('size', '$_pageSize')],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 200) {
      final page = PatientPage.fromJson(_decode(response.body));
      return page?.items ?? const [];
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar os pacientes (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Patient> getPatient(String id) async {
    final response = await _client.invokeAPI(
      '/patients/$id',
      'GET',
      const [],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 200) {
      return Patient.fromJson(_decode(response.body))!;
    }
    if (response.statusCode == 404) {
      throw PatientNotFoundException(
        _problemMessage(response.body) ?? 'Paciente não encontrado.',
      );
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar o paciente (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Patient> createPatient(PatientCreateRequest request) async {
    final response = await _client.invokeAPI(
      '/patients',
      'POST',
      const [],
      request,
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 201) {
      return Patient.fromJson(_decode(response.body))!;
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível cadastrar o paciente (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Patient> updatePatient(String id, PatientUpdateRequest request) async {
    final response = await _client.invokeAPI(
      '/patients/$id',
      'PUT',
      const [],
      request,
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 200) {
      return Patient.fromJson(_decode(response.body))!;
    }
    if (response.statusCode == 404) {
      throw PatientNotFoundException(
        _problemMessage(response.body) ?? 'Paciente não encontrado.',
      );
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível atualizar o paciente (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<void> archivePatient(String id) async {
    final response = await _client.invokeAPI(
      '/patients/$id',
      'DELETE',
      const [],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 204) return;
    if (response.statusCode == 404) {
      throw PatientNotFoundException(
        _problemMessage(response.body) ?? 'Paciente não encontrado.',
      );
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível arquivar o paciente (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<List<AttendanceRecord>> listAdministrativeRecords(String patientId) async {
    // Gap de contrato conhecido (ver documentação de
    // `PatientsAdapter.listAdministrativeRecords` e open_questions do
    // manifesto PSI-042): a spec OpenAPI atual não expõe um endpoint de
    // leitura em lote do histórico de `AttendanceRecord` por paciente.
    // Retorna vazio até o contrato modelar essa leitura — este client não é
    // exercitado contra a API real nesta tarefa de qualquer forma
    // (integração real é PSI-045).
    return const [];
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
