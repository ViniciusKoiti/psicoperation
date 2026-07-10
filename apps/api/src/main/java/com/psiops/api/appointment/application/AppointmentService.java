package com.psiops.api.appointment.application;

import com.psiops.api.appointment.domain.AppointmentConflictException;
import com.psiops.api.appointment.domain.AppointmentNotFoundException;
import com.psiops.api.appointment.domain.InvalidAppointmentStateException;
import com.psiops.api.appointment.domain.command.CancelAppointmentCommand;
import com.psiops.api.appointment.domain.command.CreateAppointmentCommand;
import com.psiops.api.appointment.domain.command.RescheduleAppointmentCommand;
import com.psiops.api.appointment.persistence.AppointmentEntity;
import com.psiops.api.appointment.persistence.AppointmentRepository;
import com.psiops.api.appointment.persistence.AppointmentStatus;
import com.psiops.api.appointment.persistence.Weekday;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AppointmentCreateRequest;
import com.psiops.contracts.model.AppointmentPage;
import com.psiops.contracts.model.AppointmentUpdateRequest;
import com.psiops.contracts.model.PageMeta;
import com.psiops.contracts.model.WeeklyRecurrence;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso do módulo de agenda (PSI-024): CRUD de consultas, detecção de
 * conflito de horário, recorrência semanal simples materializada em
 * ocorrências individuais, listagem por intervalo de datas, remarcação e
 * cancelamento.
 *
 * <p><strong>Isolamento multi-tenant estrito</strong>: todo método recebe
 * {@code userId} (resolvido pelo controller via {@code @CurrentUserId}) e
 * toda consulta/gravação passa por um método de {@link AppointmentRepository}
 * que filtra por {@code userId} — nunca um {@code findById} puro. Uma
 * consulta de outra usuária é tratada como inexistente: {@link
 * AppointmentNotFoundException} (404) para operações por id, lista/página
 * vazia para listagens — nunca 403.
 *
 * <p><strong>Decisão de recorrência (assumption do manifesto PSI-024)</strong>:
 * ocorrências semanais são materializadas como consultas individuais em um
 * horizonte fixo de {@value #RECURRENCE_HORIZON_WEEKS} semanas a partir da
 * primeira ocorrência (ou até {@code recurrence.until}, o que vier primeiro),
 * vinculadas por um identificador de série gerado uma única vez e propagado
 * a cada evento de domínio {@code AppointmentCreatedEvent} — não há coluna
 * {@code series_id} na tabela {@code appointments} (migration V2, imutável
 * nesta tarefa); o vínculo existe para auditoria/rastreabilidade no event
 * store, não para consultas de agrupamento. Extensão automática do horizonte
 * fica para tarefa futura.
 *
 * <p><strong>Detecção de conflito</strong>: considera apenas consultas ATIVAS
 * ({@code agendada}/{@code realizada}) do mesmo usuário — {@code
 * cancelada}/{@code remarcada} liberam o horário. A checagem roda dentro da
 * mesma transação da criação/remarcação, com lock pessimista nas linhas
 * candidatas ({@link AppointmentRepository#findByUserIdAndStatusInAndStartsAtBetween}),
 * mitigando condição de corrida entre requisições concorrentes.
 */
@Service
public class AppointmentService {

  /** Horizonte fixo de materialização da recorrência semanal (semanas). */
  public static final int RECURRENCE_HORIZON_WEEKS = 12;

  /** Duração máxima de uma consulta (contrato: {@code durationMinutes} máximo 480). */
  private static final int MAX_DURATION_MINUTES = 480;

  private static final int MAX_PAGE_SIZE = 100;

  /** Status que ocupam o horário (contam como conflito para novos agendamentos). */
  private static final List<AppointmentStatus> ACTIVE_STATUSES =
      List.of(AppointmentStatus.AGENDADA, AppointmentStatus.REALIZADA);

  private final AppointmentRepository appointmentRepository;
  private final PatientRepository patientRepository;
  private final CommandGateway commandGateway;

  public AppointmentService(
      AppointmentRepository appointmentRepository,
      PatientRepository patientRepository,
      CommandGateway commandGateway) {
    this.appointmentRepository = appointmentRepository;
    this.patientRepository = patientRepository;
    this.commandGateway = commandGateway;
  }

  @Transactional
  public Appointment create(UUID userId, AppointmentCreateRequest request) {
    assertPatientOwnedByUser(userId, request.getPatientId());
    assertRecurrenceConsistent(request.getStartsAt(), request.getRecurrence());

    List<OffsetDateTime> occurrenceStarts =
        materializeOccurrences(request.getStartsAt(), request.getRecurrence());

    // Todas as ocorrências são checadas ANTES de qualquer criação: conflito
    // em qualquer uma delas rejeita a série inteira (tudo ou nada), nunca
    // cria parcialmente.
    for (OffsetDateTime occurrenceStart : occurrenceStarts) {
      assertNoConflict(userId, null, occurrenceStart, request.getDurationMinutes());
    }

    UUID seriesId = request.getRecurrence() == null ? null : UUID.randomUUID();
    Weekday weekday = null;
    Integer interval = null;
    LocalDate until = null;
    if (request.getRecurrence() != null) {
      weekday = AppointmentMapper.toPersistenceWeekday(request.getRecurrence().getWeekday());
      interval = request.getRecurrence().getInterval();
      until = request.getRecurrence().getUntil();
    }

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    UUID firstOccurrenceId = null;
    for (OffsetDateTime occurrenceStart : occurrenceStarts) {
      UUID occurrenceId = UUID.randomUUID();
      if (firstOccurrenceId == null) {
        firstOccurrenceId = occurrenceId;
      }
      commandGateway.sendAndWait(
          new CreateAppointmentCommand(
              occurrenceId,
              userId,
              request.getPatientId(),
              occurrenceStart,
              request.getDurationMinutes(),
              seriesId,
              weekday,
              interval,
              until,
              now));
    }

    return AppointmentMapper.toContract(findOwned(userId, firstOccurrenceId));
  }

  @Transactional(readOnly = true)
  public Appointment get(UUID userId, UUID appointmentId) {
    return AppointmentMapper.toContract(findOwned(userId, appointmentId));
  }

  /**
   * Listagem paginada, escopada a {@code userId}, com filtro opcional por
   * paciente e por intervalo de datas ({@code from}/{@code to}, ambos
   * inclusive, interpretados como datas de calendário em UTC — ver javadoc
   * de {@code Appointment.startsAt} no contrato: o backend sempre emite/
   * armazena em UTC, a conversão de fuso é responsabilidade da apresentação).
   * Consultas de borda do intervalo (que começam exatamente em {@code from}
   * às 00:00 UTC, ou em algum instante do dia {@code to}) são incluídas.
   */
  @Transactional(readOnly = true)
  public AppointmentPage list(
      UUID userId, int page, int size, UUID patientId, LocalDate from, LocalDate to) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "startsAt"));

    Page<AppointmentEntity> result;
    if (from != null || to != null) {
      OffsetDateTime rangeStart =
          (from == null ? LocalDate.of(1970, 1, 1) : from).atStartOfDay(ZoneOffset.UTC).toOffsetDateTime();
      OffsetDateTime rangeEnd =
          (to == null ? LocalDate.of(9999, 12, 31) : to)
              .plusDays(1)
              .atStartOfDay(ZoneOffset.UTC)
              .toOffsetDateTime();
      result =
          patientId == null
              ? appointmentRepository.findByUserIdAndStartsAtBetween(userId, rangeStart, rangeEnd, pageable)
              : appointmentRepository.findByUserIdAndPatientIdAndStartsAtBetween(
                  userId, patientId, rangeStart, rangeEnd, pageable);
    } else {
      result =
          patientId == null
              ? appointmentRepository.findByUserId(userId, pageable)
              : appointmentRepository.findByUserIdAndPatientId(userId, patientId, pageable);
    }

    List<Appointment> items = result.getContent().stream().map(AppointmentMapper::toContract).toList();
    PageMeta meta =
        new PageMeta(result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    return new AppointmentPage(items, meta);
  }

  @Transactional
  public Appointment update(UUID userId, UUID appointmentId, AppointmentUpdateRequest request) {
    AppointmentEntity existing = findOwned(userId, appointmentId);

    boolean hasTimeChange =
        request.getStartsAt() != null
            || request.getDurationMinutes() != null
            || request.getRecurrence() != null;

    if (hasTimeChange) {
      OffsetDateTime newStartsAt =
          request.getStartsAt() != null ? request.getStartsAt() : existing.getStartsAt();
      int newDuration =
          request.getDurationMinutes() != null ? request.getDurationMinutes() : existing.getDurationMinutes();

      Weekday weekday;
      Integer interval;
      LocalDate until;
      if (request.getRecurrence() != null) {
        assertRecurrenceConsistent(newStartsAt, request.getRecurrence());
        weekday = AppointmentMapper.toPersistenceWeekday(request.getRecurrence().getWeekday());
        interval = request.getRecurrence().getInterval();
        until = request.getRecurrence().getUntil();
      } else if (request.getStartsAt() != null && existing.getRecurrence() != null) {
        // startsAt mudou mas recurrence não foi reenviado: reafirma que o
        // novo horário ainda respeita o dia da semana da recorrência
        // existente (senão o descritor ficaria inconsistente).
        assertWeekdayMatches(newStartsAt, existing.getRecurrence().getWeekday());
        weekday = existing.getRecurrence().getWeekday();
        interval = existing.getRecurrence().getInterval();
        until = existing.getRecurrence().getUntil();
      } else {
        weekday = existing.getRecurrence() == null ? null : existing.getRecurrence().getWeekday();
        interval = existing.getRecurrence() == null ? null : existing.getRecurrence().getInterval();
        until = existing.getRecurrence() == null ? null : existing.getRecurrence().getUntil();
      }

      assertNoConflict(userId, appointmentId, newStartsAt, newDuration);

      commandGateway.sendAndWait(
          new RescheduleAppointmentCommand(
              appointmentId,
              newStartsAt,
              newDuration,
              weekday,
              interval,
              until,
              OffsetDateTime.now(ZoneOffset.UTC)));
    }

    if (request.getStatus() != null) {
      AppointmentStatus targetStatus = AppointmentMapper.toPersistenceStatus(request.getStatus());
      if (targetStatus != AppointmentStatus.CANCELADA && targetStatus != AppointmentStatus.REMARCADA) {
        throw new InvalidAppointmentStateException(
            "transição de status para '"
                + request.getStatus()
                + "' não é suportada por este endpoint (fora do escopo da PSI-024)");
      }
      commandGateway.sendAndWait(
          new CancelAppointmentCommand(appointmentId, targetStatus, OffsetDateTime.now(ZoneOffset.UTC)));
    }

    return AppointmentMapper.toContract(findOwned(userId, appointmentId));
  }

  @Transactional
  public void cancel(UUID userId, UUID appointmentId) {
    findOwned(userId, appointmentId);
    commandGateway.sendAndWait(
        new CancelAppointmentCommand(
            appointmentId, AppointmentStatus.CANCELADA, OffsetDateTime.now(ZoneOffset.UTC)));
  }

  private AppointmentEntity findOwned(UUID userId, UUID appointmentId) {
    return appointmentRepository
        .findByIdAndUserId(appointmentId, userId)
        .orElseThrow(() -> new AppointmentNotFoundException(appointmentId));
  }

  private void assertPatientOwnedByUser(UUID userId, UUID patientId) {
    if (patientRepository.findByIdAndUserId(patientId, userId).isEmpty()) {
      throw new InvalidAppointmentStateException("paciente não encontrado para esta psicóloga: " + patientId);
    }
  }

  private void assertRecurrenceConsistent(OffsetDateTime startsAt, WeeklyRecurrence recurrence) {
    if (recurrence == null) {
      return;
    }
    assertWeekdayMatches(startsAt, AppointmentMapper.toPersistenceWeekday(recurrence.getWeekday()));
    if (recurrence.getUntil() != null && recurrence.getUntil().isBefore(startsAt.toLocalDate())) {
      throw new InvalidAppointmentStateException(
          "recurrence.until não pode ser anterior à data de startsAt");
    }
  }

  private void assertWeekdayMatches(OffsetDateTime startsAt, Weekday expected) {
    Weekday actual = toWeekday(startsAt.getDayOfWeek());
    if (actual != expected) {
      throw new InvalidAppointmentStateException(
          "recurrence.weekday (" + expected + ") não corresponde ao dia da semana de startsAt (" + actual + ")");
    }
  }

  private Weekday toWeekday(DayOfWeek dayOfWeek) {
    return switch (dayOfWeek) {
      case MONDAY -> Weekday.SEGUNDA;
      case TUESDAY -> Weekday.TERCA;
      case WEDNESDAY -> Weekday.QUARTA;
      case THURSDAY -> Weekday.QUINTA;
      case FRIDAY -> Weekday.SEXTA;
      case SATURDAY -> Weekday.SABADO;
      case SUNDAY -> Weekday.DOMINGO;
    };
  }

  /**
   * Expande a recorrência semanal simples em instantes de início
   * individuais: a própria primeira ocorrência ({@code firstStart}) mais uma
   * a cada {@code interval} semanas até {@code min(recurrence.until,
   * firstStart + RECURRENCE_HORIZON_WEEKS semanas)}. Sem recorrência,
   * retorna só {@code firstStart} (consulta avulsa).
   */
  private List<OffsetDateTime> materializeOccurrences(
      OffsetDateTime firstStart, WeeklyRecurrence recurrence) {
    if (recurrence == null) {
      return List.of(firstStart);
    }
    int interval = recurrence.getInterval() == null ? 1 : recurrence.getInterval();
    LocalDate horizonEnd = firstStart.toLocalDate().plusWeeks(RECURRENCE_HORIZON_WEEKS);
    LocalDate effectiveUntil =
        (recurrence.getUntil() == null || recurrence.getUntil().isAfter(horizonEnd))
            ? horizonEnd
            : recurrence.getUntil();

    List<OffsetDateTime> occurrences = new ArrayList<>();
    OffsetDateTime current = firstStart;
    while (!current.toLocalDate().isAfter(effectiveUntil)) {
      occurrences.add(current);
      current = current.plusWeeks(interval);
    }
    return occurrences;
  }

  /**
   * Rejeita (409, via {@link AppointmentConflictException}) se {@code
   * [candidateStart, candidateStart + candidateDurationMinutes)} sobrepõe
   * alguma consulta ATIVA (não {@code excludeAppointmentId}) do usuário —
   * sobreposição total, parcial ou de borda (bordas que apenas se tocam,
   * ex.: uma termina exatamente quando a outra começa, NÃO conflitam:
   * intervalos são semiabertos, {@code [start, end)}).
   */
  private void assertNoConflict(
      UUID userId, UUID excludeAppointmentId, OffsetDateTime candidateStart, int candidateDurationMinutes) {
    OffsetDateTime candidateEnd = candidateStart.plusMinutes(candidateDurationMinutes);
    OffsetDateTime windowStart = candidateStart.minusMinutes(MAX_DURATION_MINUTES);

    List<AppointmentEntity> candidates =
        appointmentRepository.findByUserIdAndStatusInAndStartsAtBetween(
            userId, ACTIVE_STATUSES, windowStart, candidateEnd);

    for (AppointmentEntity existingAppointment : candidates) {
      if (excludeAppointmentId != null && existingAppointment.getId().equals(excludeAppointmentId)) {
        continue;
      }
      OffsetDateTime existingEnd =
          existingAppointment.getStartsAt().plusMinutes(existingAppointment.getDurationMinutes());
      boolean overlaps =
          existingAppointment.getStartsAt().isBefore(candidateEnd) && candidateStart.isBefore(existingEnd);
      if (overlaps) {
        throw new AppointmentConflictException(existingAppointment.getId());
      }
    }
  }
}
