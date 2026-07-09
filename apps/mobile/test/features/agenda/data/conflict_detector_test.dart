import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/agenda/data/conflict_detector.dart';

Appointment _appointment({
  required String id,
  required DateTime startsAt,
  int durationMinutes = 50,
  AppointmentStatus status = AppointmentStatus.agendada,
}) {
  return Appointment(
    id: id,
    patientId: 'patient-x',
    startsAt: startsAt,
    durationMinutes: durationMinutes,
    status: status,
    createdAt: startsAt,
  );
}

void main() {
  const detector = AppointmentConflictDetector();
  final noon = DateTime(2026, 7, 6, 12);

  group('AppointmentConflictDetector', () {
    test('não conflita quando não há sobreposição', () {
      final existing = [
        _appointment(id: 'a1', startsAt: noon, durationMinutes: 50),
      ];
      final result = detector.conflicts(
        startsAt: noon.add(const Duration(hours: 2)),
        durationMinutes: 50,
        existing: existing,
      );
      expect(result, isFalse);
    });

    test('conflita quando os intervalos se sobrepõem parcialmente', () {
      final existing = [
        _appointment(id: 'a1', startsAt: noon, durationMinutes: 50),
      ];
      final result = detector.conflicts(
        // Começa 30min depois do início da consulta existente (que dura 50
        // min) — sobreposição parcial de 20 minutos.
        startsAt: noon.add(const Duration(minutes: 30)),
        durationMinutes: 50,
        existing: existing,
      );
      expect(result, isTrue);
    });

    test('conflita quando um intervalo contém o outro por completo', () {
      final existing = [
        _appointment(id: 'a1', startsAt: noon, durationMinutes: 120),
      ];
      final result = detector.conflicts(
        startsAt: noon.add(const Duration(minutes: 30)),
        durationMinutes: 20,
        existing: existing,
      );
      expect(result, isTrue);
    });

    test('toque de bordas (fim de uma = início da outra) NÃO é conflito', () {
      final existing = [
        _appointment(id: 'a1', startsAt: noon, durationMinutes: 50),
      ];
      final result = detector.conflicts(
        // Começa exatamente quando a existente termina (12:50).
        startsAt: noon.add(const Duration(minutes: 50)),
        durationMinutes: 50,
        existing: existing,
      );
      expect(result, isFalse);
    });

    test('ignora a própria consulta ao remarcar (excludeAppointmentId)', () {
      final existing = [
        _appointment(id: 'a1', startsAt: noon, durationMinutes: 50),
      ];
      final result = detector.conflicts(
        startsAt: noon,
        durationMinutes: 50,
        existing: existing,
        excludeAppointmentId: 'a1',
      );
      expect(result, isFalse);
    });

    test('consultas canceladas liberam o horário', () {
      final existing = [
        _appointment(
          id: 'a1',
          startsAt: noon,
          durationMinutes: 50,
          status: AppointmentStatus.cancelada,
        ),
      ];
      final result = detector.conflicts(
        startsAt: noon,
        durationMinutes: 50,
        existing: existing,
      );
      expect(result, isFalse);
    });

    test('consultas realizadas/remarcadas continuam ocupando a agenda', () {
      final existingRealizada = [
        _appointment(
          id: 'a1',
          startsAt: noon,
          durationMinutes: 50,
          status: AppointmentStatus.realizada,
        ),
      ];
      final existingRemarcada = [
        _appointment(
          id: 'a2',
          startsAt: noon,
          durationMinutes: 50,
          status: AppointmentStatus.remarcada,
        ),
      ];
      expect(
        detector.conflicts(startsAt: noon, durationMinutes: 50, existing: existingRealizada),
        isTrue,
      );
      expect(
        detector.conflicts(startsAt: noon, durationMinutes: 50, existing: existingRemarcada),
        isTrue,
      );
    });
  });
}
