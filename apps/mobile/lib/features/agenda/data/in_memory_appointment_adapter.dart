import 'package:psiops_contracts/api.dart';

import 'appointment_adapter.dart';
import 'conflict_detector.dart';
import 'recurrence_utils.dart';

/// Adapter em memória usado no ambiente [AppEnvironment.dev] (e em testes).
///
/// Semeia algumas consultas de exemplo relativas ao instante corrente ([now],
/// injetável para testes determinísticos — mesmo padrão de
/// `SessionController`), incluindo uma consulta com recorrência semanal já
/// materializada em algumas ocorrências futuras.
///
/// A criação/remarcação aplica [AppointmentConflictDetector] antes de
/// persistir, para que o comportamento deste mock coincida com o que a API
/// real faria (`HttpAppointmentAdapter` recebe o mesmo 409 do servidor).
final class InMemoryAppointmentAdapter implements AppointmentAdapter {
  InMemoryAppointmentAdapter({DateTime Function()? now, bool seedSampleData = true})
    : _now = now ?? DateTime.now {
    if (seedSampleData) _seedDefaults();
  }

  final DateTime Function() _now;
  final List<Appointment> _appointments = [];
  static const _detector = AppointmentConflictDetector();
  int _sequence = 0;

  String _nextId() {
    _sequence++;
    return 'appointment-mock-$_sequence';
  }

  void _seedDefaults() {
    final today = _now();
    final todayNoon = DateTime(today.year, today.month, today.day, 9);

    // Consulta avulsa hoje de manhã.
    _appointments.add(
      Appointment(
        id: _nextId(),
        patientId: 'patient-1',
        startsAt: todayNoon,
        durationMinutes: 50,
        status: AppointmentStatus.agendada,
        createdAt: today,
      ),
    );

    // Consulta avulsa hoje à tarde.
    _appointments.add(
      Appointment(
        id: _nextId(),
        patientId: 'patient-2',
        startsAt: DateTime(today.year, today.month, today.day, 15, 30),
        durationMinutes: 50,
        status: AppointmentStatus.agendada,
        createdAt: today,
      ),
    );

    // Consulta recorrente semanal (mesmo dia/horário de hoje, toda semana),
    // já materializada em ocorrências futuras — exemplifica a recorrência
    // simples visível na agenda (critério de aceite de PSI-041).
    final recurrence = WeeklyRecurrence(weekday: weekdayEnumFor(todayNoon));
    final recurringStart = DateTime(today.year, today.month, today.day, 11);
    for (final occurrence in materializeOccurrences(
      recurringStart,
      recurrence,
      maxOccurrences: 6,
    )) {
      _appointments.add(
        Appointment(
          id: _nextId(),
          patientId: 'patient-3',
          startsAt: occurrence,
          durationMinutes: 50,
          recurrence: recurrence,
          status: AppointmentStatus.agendada,
          createdAt: today,
        ),
      );
    }
  }

  Future<void> _delay() => Future<void>.delayed(const Duration(milliseconds: 20));

  @override
  Future<List<Appointment>> listAppointments({
    required DateTime from,
    required DateTime to,
  }) async {
    await _delay();
    final results =
        _appointments
            .where((a) => !a.startsAt.isBefore(from) && a.startsAt.isBefore(to))
            .toList()
          ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return results;
  }

  @override
  Future<Appointment> createAppointment(AppointmentCreateRequest request) async {
    await _delay();
    final occurrences = materializeOccurrences(request.startsAt, request.recurrence);

    for (final startsAt in occurrences) {
      if (_detector.conflicts(
        startsAt: startsAt,
        durationMinutes: request.durationMinutes,
        existing: _appointments,
      )) {
        throw const AppointmentConflictException();
      }
    }

    Appointment? first;
    for (final startsAt in occurrences) {
      final appointment = Appointment(
        id: _nextId(),
        patientId: request.patientId,
        startsAt: startsAt,
        durationMinutes: request.durationMinutes,
        recurrence: request.recurrence,
        status: AppointmentStatus.agendada,
        createdAt: _now(),
      );
      _appointments.add(appointment);
      first ??= appointment;
    }
    return first!;
  }

  @override
  Future<Appointment> rescheduleAppointment(
    String appointmentId,
    AppointmentUpdateRequest request,
  ) async {
    await _delay();
    final index = _appointments.indexWhere((a) => a.id == appointmentId);
    if (index == -1) throw const AppointmentNotFoundException();

    final current = _appointments[index];
    final newStartsAt = request.startsAt ?? current.startsAt;
    final newDuration = request.durationMinutes ?? current.durationMinutes;

    if (_detector.conflicts(
      startsAt: newStartsAt,
      durationMinutes: newDuration,
      existing: _appointments,
      excludeAppointmentId: appointmentId,
    )) {
      throw const AppointmentConflictException();
    }

    final updated = Appointment(
      id: current.id,
      patientId: current.patientId,
      startsAt: newStartsAt,
      durationMinutes: newDuration,
      recurrence: request.recurrence ?? current.recurrence,
      status: request.status ?? current.status,
      createdAt: current.createdAt,
    );
    _appointments[index] = updated;
    return updated;
  }

  @override
  Future<void> cancelAppointment(String appointmentId) async {
    await _delay();
    final index = _appointments.indexWhere((a) => a.id == appointmentId);
    if (index == -1) throw const AppointmentNotFoundException();

    final current = _appointments[index];
    _appointments[index] = Appointment(
      id: current.id,
      patientId: current.patientId,
      startsAt: current.startsAt,
      durationMinutes: current.durationMinutes,
      recurrence: current.recurrence,
      status: AppointmentStatus.cancelada,
      createdAt: current.createdAt,
    );
  }
}
