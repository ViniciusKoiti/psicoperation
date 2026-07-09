import 'package:psiops_contracts/api.dart';

/// Porta de acesso à agenda de consultas.
///
/// Os tipos [Appointment], [AppointmentCreateRequest],
/// [AppointmentUpdateRequest] e [WeeklyRecurrence] vêm de
/// `packages/contracts/gen/dart` (codegen do `openapi.yaml` — ADR 0008);
/// este adapter nunca redefine DTOs de API localmente.
///
/// Duas implementações, seguindo o padrão estabelecido em PSI-040
/// (`AuthAdapter`/`InMemoryAuthAdapter`/`HttpAuthAdapter`):
/// - `InMemoryAppointmentAdapter`: mock em memória, padrão em dev/test.
/// - `HttpAppointmentAdapter`: client HTTP real tipado pelos mesmos modelos,
///   implementado e compilável, mas não exercitado contra a API real nesta
///   tarefa (integração real é PSI-045).
///
/// A escolha entre as duas acontece em um único ponto de composição:
/// `app/app.dart`.
///
/// Detecção de conflito: ambas as implementações aplicam exatamente a mesma
/// regra (`AppointmentConflictDetector`) antes de persistir uma criação ou
/// remarcação — no mock, a checagem roda em memória; no HTTP, é o próprio
/// servidor que responde 409 (ver `paths/appointment/*.yaml`), traduzido
/// para [AppointmentConflictException] pelo adapter.
abstract interface class AppointmentAdapter {
  /// Lista consultas cujo início (`startsAt`) cai no intervalo
  /// `[from, to)`, ordenadas por horário.
  Future<List<Appointment>> listAppointments({
    required DateTime from,
    required DateTime to,
  });

  /// Agenda uma consulta (`POST /appointments`). Se [request.recurrence]
  /// estiver presente, materializa também as ocorrências futuras (mesmo
  /// dia/horário a cada `interval` semanas — recorrência semanal simples,
  /// sem regras avançadas).
  ///
  /// Retorna a primeira ocorrência criada. Lança
  /// [AppointmentConflictException] se qualquer ocorrência conflitar com uma
  /// consulta existente — a criação é atômica: nenhuma ocorrência é
  /// persistida se qualquer uma delas conflitar.
  Future<Appointment> createAppointment(AppointmentCreateRequest request);

  /// Remarca/edita uma consulta (`PUT /appointments/{id}`). Afeta somente a
  /// ocorrência identificada por [appointmentId] — mesmo quando ela faz
  /// parte de uma série recorrente (ver open_question do manifesto PSI-041,
  /// resolvida a favor do comportamento mais simples).
  ///
  /// Lança [AppointmentConflictException] se o novo horário conflitar com
  /// outra consulta, e [AppointmentNotFoundException] se [appointmentId] não
  /// existir.
  Future<Appointment> rescheduleAppointment(
    String appointmentId,
    AppointmentUpdateRequest request,
  );

  /// Cancela uma consulta (`DELETE /appointments/{id}`) — cancelamento
  /// lógico: a consulta permanece no histórico com `status = cancelada` e
  /// libera o horário para novos agendamentos. Afeta somente a ocorrência
  /// identificada por [appointmentId].
  ///
  /// Lança [AppointmentNotFoundException] se [appointmentId] não existir.
  Future<void> cancelAppointment(String appointmentId);
}

/// Erro genérico de acesso à agenda (rede, servidor, resposta inesperada).
///
/// [message] é um texto pt-BR adequado para exibição direta na UI.
class AppointmentAdapterException implements Exception {
  const AppointmentAdapterException(this.message);

  final String message;

  @override
  String toString() => 'AppointmentAdapterException: $message';
}

/// Conflito de horário: o intervalo solicitado se sobrepõe a uma consulta
/// existente que ainda ocupa a agenda (HTTP 409 no adapter real).
class AppointmentConflictException extends AppointmentAdapterException {
  const AppointmentConflictException([
    super.message =
        'Este horário conflita com outra consulta já agendada.',
  ]);
}

/// A consulta referenciada não existe (HTTP 404 no adapter real).
class AppointmentNotFoundException extends AppointmentAdapterException {
  const AppointmentNotFoundException([
    super.message = 'Consulta não encontrada.',
  ]);
}
