import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import '../../../app/http_adapter_support.dart';
import 'patients_adapter.dart';

/// Client HTTP real do [PatientsAdapter], tipado pelos modelos Dart gerados
/// de `packages/contracts/gen/dart` (`Patient`, `PatientPage`,
/// `PatientCreateRequest`, `PatientUpdateRequest`, `Problem`) — nunca
/// redefine DTOs de API localmente (ADR 0008, regra 8 do CLAUDE.md).
///
/// Exercitado contra a API real na integração mobile (PSI-045). Falhas de
/// conectividade e respostas em formato inesperado são mapeadas para
/// [PatientsAdapterException] (mensagem pt-BR), nunca propagadas cruas — ver
/// `http_adapter_support.dart`.
final class HttpPatientsAdapter implements PatientsAdapter {
  HttpPatientsAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  static const int _pageSize = 100;

  @override
  Future<List<Patient>> listPatients() async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/patients',
        'GET',
        [QueryParam('size', '$_pageSize')],
        null,
        const {},
        const {},
        null,
      ),
      (message) => PatientsAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => PatientPage.fromJson(_decode(response.body))?.items ?? const [],
        (message) => PatientsAdapterException(message),
      );
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar os pacientes (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<List<Patient>> listPatientsByStatus(PatientStatus status) async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/patients',
        'GET',
        [QueryParam('status', status.value), QueryParam('size', '$_pageSize')],
        null,
        const {},
        const {},
        null,
      ),
      (message) => PatientsAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => PatientPage.fromJson(_decode(response.body))?.items ?? const [],
        (message) => PatientsAdapterException(message),
      );
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar os pacientes (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Patient> getPatient(String id) async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/patients/$id',
        'GET',
        const [],
        null,
        const {},
        const {},
        null,
      ),
      (message) => PatientsAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => Patient.fromJson(_decode(response.body))!,
        (message) => PatientsAdapterException(message),
      );
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
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/patients',
        'POST',
        const [],
        request,
        const {},
        const {},
        'application/json',
      ),
      (message) => PatientsAdapterException(message),
    );
    if (response.statusCode == 201) {
      return parseOrThrow(
        () => Patient.fromJson(_decode(response.body))!,
        (message) => PatientsAdapterException(message),
      );
    }
    throw PatientsAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível cadastrar o paciente (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Patient> updatePatient(String id, PatientUpdateRequest request) async {
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/patients/$id',
        'PUT',
        const [],
        request,
        const {},
        const {},
        'application/json',
      ),
      (message) => PatientsAdapterException(message),
    );
    if (response.statusCode == 200) {
      return parseOrThrow(
        () => Patient.fromJson(_decode(response.body))!,
        (message) => PatientsAdapterException(message),
      );
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
    final response = await guardApiCall(
      () => _client.invokeAPI(
        '/patients/$id',
        'DELETE',
        const [],
        null,
        const {},
        const {},
        null,
      ),
      (message) => PatientsAdapterException(message),
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
    // Gap de contrato conhecido, registrado para o orquestrador (ver
    // documentação de `PatientsAdapter.listAdministrativeRecords` e
    // open_questions do manifesto PSI-042): a spec OpenAPI atual não expõe
    // um endpoint de leitura em lote do histórico de `AttendanceRecord` por
    // paciente. Retorna vazio até o contrato modelar essa leitura — divergência
    // confirmada ao ligar este adapter contra a API real na PSI-045 (o
    // endpoint segue inexistente); corrigir exigiria mudança em
    // `packages/contracts`, fora do escopo/allowed_paths desta tarefa.
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
