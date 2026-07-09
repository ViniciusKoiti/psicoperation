import 'package:psiops_contracts/api.dart';

/// Detecção de conflito de horário na agenda.
///
/// Espelha EXATAMENTE a regra descrita no contrato (`packages/contracts`,
/// `paths/appointment/appointments.yaml` e `appointment-by-id.yaml`): ao
/// criar (`POST /appointments`) ou remarcar (`PUT /appointments/{id}`) uma
/// consulta, "se o horário conflitar com outra consulta existente, responde
/// 409". Esta classe é a ÚNICA fonte da regra no app — usada tanto pelo
/// adapter mock (para que o comportamento offline coincida com o da API
/// real) quanto pela camada de apresentação (para bloquear a confirmação
/// antes mesmo de chamar o adapter, conforme o critério de aceite de
/// PSI-041).
///
/// Regras (documentadas aqui por não estarem explícitas no schema OpenAPI —
/// ver assumptions do manifesto PSI-041):
/// - Duas consultas conflitam quando seus intervalos `[startsAt,
///   startsAt + durationMinutes)` se sobrepõem em qualquer instante.
/// - Toque de bordas NÃO é conflito: uma consulta que termina exatamente
///   quando a outra começa (`a.end == b.start`) pode coexistir — é o caso de
///   agenda "encostada" comum na prática clínica.
/// - Apenas consultas que ainda ocupam a agenda entram na checagem:
///   `cancelada` libera o horário; `agendada`, `remarcada` e `realizada`
///   continuam contando como ocupação (uma consulta já realizada de fato
///   ocupou aquele horário).
class AppointmentConflictDetector {
  const AppointmentConflictDetector();

  /// Retorna `true` se um intervalo `[startsAt, startsAt + durationMinutes)`
  /// conflita com alguma consulta de [existing] que ainda ocupe a agenda.
  ///
  /// [excludeAppointmentId] permite ignorar a própria consulta ao remarcar
  /// (ela não pode conflitar consigo mesma).
  bool conflicts({
    required DateTime startsAt,
    required int durationMinutes,
    required Iterable<Appointment> existing,
    String? excludeAppointmentId,
  }) {
    final candidateEnd = startsAt.add(Duration(minutes: durationMinutes));
    for (final appointment in existing) {
      if (appointment.id == excludeAppointmentId) continue;
      if (!occupiesAgenda(appointment.status)) continue;
      final otherEnd = appointment.startsAt.add(
        Duration(minutes: appointment.durationMinutes),
      );
      final overlaps =
          startsAt.isBefore(otherEnd) && appointment.startsAt.isBefore(candidateEnd);
      if (overlaps) return true;
    }
    return false;
  }

  /// Consultas canceladas liberam o horário; qualquer outro status é
  /// considerado ocupação da agenda para efeito de conflito.
  bool occupiesAgenda(AppointmentStatus status) => status != AppointmentStatus.cancelada;
}
