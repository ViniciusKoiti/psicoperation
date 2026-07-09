import 'dart:convert';

import 'package:psiops_contracts/api.dart';

import '../../../app/api_config.dart';
import 'appointment_adapter.dart';

/// Client HTTP real do [AppointmentAdapter], tipado pelos modelos Dart
/// gerados de `packages/contracts/gen/dart` (`Appointment`, `AppointmentPage`,
/// `AppointmentCreateRequest`, `AppointmentUpdateRequest`, `Problem`) — nunca
/// redefine DTOs de API localmente (ADR 0008, regra 8 do CLAUDE.md).
///
/// Implementado e compilável, mas **não exercitado contra a API real** nesta
/// tarefa (PSI-041) — a integração real acontece na PSI-045. O 409 de
/// conflito de horário documentado no contrato é traduzido para
/// [AppointmentConflictException], a mesma exceção lançada pelo
/// `InMemoryAppointmentAdapter` — o restante do app não precisa saber qual
/// implementação está em uso.
final class HttpAppointmentAdapter implements AppointmentAdapter {
  HttpAppointmentAdapter({ApiClient? apiClient})
    : _client = apiClient ?? ApiClient(basePath: ApiConfig.baseUrl);

  final ApiClient _client;

  /// Tamanho de página grande o suficiente para a janela diária/semanal da
  /// agenda numa única chamada — a paginação de verdade (para históricos
  /// maiores) é assunto da integração real (PSI-045).
  static const int _pageSize = 100;

  @override
  Future<List<Appointment>> listAppointments({
    required DateTime from,
    required DateTime to,
  }) async {
    final response = await _client.invokeAPI(
      '/appointments',
      'GET',
      [
        QueryParam('from', _dateOnly(from)),
        QueryParam('to', _dateOnly(to)),
        QueryParam('size', '$_pageSize'),
      ],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 200) {
      final page = AppointmentPage.fromJson(_decode(response.body));
      return page?.items ?? const [];
    }
    throw AppointmentAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível carregar a agenda (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Appointment> createAppointment(AppointmentCreateRequest request) async {
    final response = await _client.invokeAPI(
      '/appointments',
      'POST',
      const [],
      request,
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 201) {
      return Appointment.fromJson(_decode(response.body))!;
    }
    if (response.statusCode == 409) {
      throw AppointmentConflictException(
        _problemMessage(response.body) ??
            'Este horário conflita com outra consulta já agendada.',
      );
    }
    throw AppointmentAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível agendar a consulta (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<Appointment> rescheduleAppointment(
    String appointmentId,
    AppointmentUpdateRequest request,
  ) async {
    final response = await _client.invokeAPI(
      '/appointments/$appointmentId',
      'PUT',
      const [],
      request,
      const {},
      const {},
      'application/json',
    );
    if (response.statusCode == 200) {
      return Appointment.fromJson(_decode(response.body))!;
    }
    if (response.statusCode == 404) {
      throw AppointmentNotFoundException(
        _problemMessage(response.body) ?? 'Consulta não encontrada.',
      );
    }
    if (response.statusCode == 409) {
      throw AppointmentConflictException(
        _problemMessage(response.body) ??
            'Este horário conflita com outra consulta já agendada.',
      );
    }
    throw AppointmentAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível remarcar a consulta (HTTP ${response.statusCode}).',
    );
  }

  @override
  Future<void> cancelAppointment(String appointmentId) async {
    final response = await _client.invokeAPI(
      '/appointments/$appointmentId',
      'DELETE',
      const [],
      null,
      const {},
      const {},
      null,
    );
    if (response.statusCode == 204) return;
    if (response.statusCode == 404) {
      throw AppointmentNotFoundException(
        _problemMessage(response.body) ?? 'Consulta não encontrada.',
      );
    }
    throw AppointmentAdapterException(
      _problemMessage(response.body) ??
          'Não foi possível cancelar a consulta (HTTP ${response.statusCode}).',
    );
  }

  String _dateOnly(DateTime date) {
    final utc = date.toUtc();
    final year = utc.year.toString().padLeft(4, '0');
    final month = utc.month.toString().padLeft(2, '0');
    final day = utc.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
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
