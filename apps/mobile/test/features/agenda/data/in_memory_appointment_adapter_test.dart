import 'package:flutter_test/flutter_test.dart';
import 'package:psiops_contracts/api.dart';
import 'package:psiops_mobile/features/agenda/data/appointment_adapter.dart';
import 'package:psiops_mobile/features/agenda/data/in_memory_appointment_adapter.dart';
import 'package:psiops_mobile/features/agenda/data/recurrence_utils.dart';

DateTime fixedNow() => DateTime(2026, 7, 6, 8); // segunda-feira fixa.

void main() {
  group('InMemoryAppointmentAdapter', () {
    test('semeia consultas de hoje visíveis via listAppointments', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow);
      final today = DateTime(2026, 7, 6);
      final results = await adapter.listAppointments(
        from: today,
        to: today.add(const Duration(days: 1)),
      );
      expect(results, isNotEmpty);
      expect(results.every((a) => a.startsAt.day == 6), isTrue);
    });

    test('cria uma consulta avulsa sem conflito', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow, seedSampleData: false);
      final startsAt = DateTime(2026, 7, 6, 10);
      final created = await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-9',
          startsAt: startsAt,
          durationMinutes: 50,
        ),
      );
      expect(created.status, AppointmentStatus.agendada);
      expect(created.patientId, 'patient-9');

      final listed = await adapter.listAppointments(
        from: startsAt,
        to: startsAt.add(const Duration(days: 1)),
      );
      expect(listed, hasLength(1));
    });

    test('lança AppointmentConflictException ao criar com sobreposição', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow, seedSampleData: false);
      final startsAt = DateTime(2026, 7, 6, 10);
      await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-9',
          startsAt: startsAt,
          durationMinutes: 50,
        ),
      );

      expect(
        () => adapter.createAppointment(
          AppointmentCreateRequest(
            patientId: 'patient-10',
            // Começa 20 minutos depois — sobrepõe a consulta de 50 min.
            startsAt: startsAt.add(const Duration(minutes: 20)),
            durationMinutes: 30,
          ),
        ),
        throwsA(isA<AppointmentConflictException>()),
      );
    });

    test('materializa ocorrências de recorrência semanal simples', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow, seedSampleData: false);
      final startsAt = DateTime(2026, 7, 6, 10);
      final until = DateTime(2026, 7, 27); // 4 semanas de horizonte.
      final recurrence = WeeklyRecurrence(
        weekday: weekdayEnumFor(startsAt),
        until: until,
      );

      await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-9',
          startsAt: startsAt,
          durationMinutes: 50,
          recurrence: recurrence,
        ),
      );

      final results = await adapter.listAppointments(
        from: startsAt,
        to: until.add(const Duration(days: 1)),
      );
      // 06/07, 13/07, 20/07, 27/07 — quatro ocorrências semanais.
      expect(results, hasLength(4));
      expect(results.every((a) => a.recurrence != null), isTrue);
    });

    test('criação com recorrência é atômica: conflito em qualquer ocorrência aborta tudo', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow, seedSampleData: false);
      final startsAt = DateTime(2026, 7, 6, 10);

      // Consulta avulsa que vai conflitar com a 2ª ocorrência (13/07) da
      // série que será criada a seguir.
      await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-conflitante',
          startsAt: startsAt.add(const Duration(days: 7)),
          durationMinutes: 50,
        ),
      );

      final recurrence = WeeklyRecurrence(
        weekday: weekdayEnumFor(startsAt),
        until: DateTime(2026, 7, 27),
      );

      await expectLater(
        adapter.createAppointment(
          AppointmentCreateRequest(
            patientId: 'patient-9',
            startsAt: startsAt,
            durationMinutes: 50,
            recurrence: recurrence,
          ),
        ),
        throwsA(isA<AppointmentConflictException>()),
      );

      // Nenhuma ocorrência da série deve ter sido persistida.
      final results = await adapter.listAppointments(
        from: startsAt,
        to: DateTime(2026, 7, 28),
      );
      expect(results.where((a) => a.patientId == 'patient-9'), isEmpty);
    });

    test('remarcação move a consulta e detecta conflito no novo horário', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow, seedSampleData: false);
      final first = await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-1',
          startsAt: DateTime(2026, 7, 6, 9),
          durationMinutes: 50,
        ),
      );
      await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-2',
          startsAt: DateTime(2026, 7, 6, 14),
          durationMinutes: 50,
        ),
      );

      // Remarcar sem conflito funciona.
      final updated = await adapter.rescheduleAppointment(
        first.id,
        AppointmentUpdateRequest(startsAt: DateTime(2026, 7, 6, 11)),
      );
      expect(updated.startsAt, DateTime(2026, 7, 6, 11));

      // Remarcar para cima da segunda consulta (14h) conflita.
      expect(
        () => adapter.rescheduleAppointment(
          first.id,
          AppointmentUpdateRequest(startsAt: DateTime(2026, 7, 6, 14, 10)),
        ),
        throwsA(isA<AppointmentConflictException>()),
      );
    });

    test('cancelamento libera o horário para uma nova consulta', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow, seedSampleData: false);
      final startsAt = DateTime(2026, 7, 6, 10);
      final created = await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-1',
          startsAt: startsAt,
          durationMinutes: 50,
        ),
      );

      await adapter.cancelAppointment(created.id);

      final results = await adapter.listAppointments(
        from: startsAt,
        to: startsAt.add(const Duration(days: 1)),
      );
      expect(results.single.status, AppointmentStatus.cancelada);

      // Agora o mesmo horário pode ser reutilizado sem lançar conflito.
      final recreated = await adapter.createAppointment(
        AppointmentCreateRequest(
          patientId: 'patient-2',
          startsAt: startsAt,
          durationMinutes: 50,
        ),
      );
      expect(recreated.status, AppointmentStatus.agendada);
    });

    test('cancelar consulta inexistente lança AppointmentNotFoundException', () async {
      final adapter = InMemoryAppointmentAdapter(now: fixedNow, seedSampleData: false);
      expect(
        () => adapter.cancelAppointment('id-inexistente'),
        throwsA(isA<AppointmentNotFoundException>()),
      );
    });
  });
}
