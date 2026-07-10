package com.psiops.api.sessionrecord.web;

import com.psiops.api.auth.web.CurrentUserId;
import com.psiops.api.sessionrecord.application.SessionRecordService;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AttendanceRecord;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de registros administrativos de consulta (PSI-025).
 *
 * <p>{@code PUT /appointments/{appointmentId}/attendance} segue o contrato
 * declarado em {@code
 * packages/contracts/openapi/paths/appointment/appointment-attendance.yaml}
 * (operationId {@code recordAttendance}) — deixado fora de {@code
 * com.psiops.api.appointment.web.AppointmentController} de propósito (ver
 * javadoc daquela classe, PSI-024). O request/response ({@link
 * AttendanceRecord}/{@link Appointment}) vêm de {@code
 * com.psiops.contracts.model}; nenhum é redefinido aqui.
 *
 * <p>{@code GET /patients/{patientId}/session-records} é um endpoint
 * adicional desta implementação (histórico paginado por paciente exigido
 * pelo acceptance criteria do manifesto PSI-025), ainda não declarado na
 * especificação OpenAPI — mesmo raciocínio de {@code
 * com.psiops.api.billing.web.ChargeController#delinquency} (PSI-026): os
 * itens reaproveitam {@link AttendanceRecord}, só a página/correlação são
 * locais (ver javadoc de {@link SessionRecordPage}).
 *
 * <p><strong>Isolamento multi-tenant</strong>: todo método resolve {@code
 * userId} exclusivamente via {@code @CurrentUserId} (nunca lê o {@code
 * SecurityContextHolder} diretamente) e repassa ao {@link
 * SessionRecordService}, que garante que o vínculo (consulta/paciente) seja
 * sempre da própria usuária — vínculo com consulta/paciente inexistente ou
 * de outra usuária é 404, nunca 403 (não vaza a existência do recurso).
 *
 * <p><strong>Nenhum campo clínico</strong>: este controller só expõe status
 * de comparecimento e anotação administrativa livre — ver javadoc completo
 * de {@code com.psiops.api.appointment.persistence.SessionRecordEntity}.
 */
@RestController
public class SessionRecordController {

  private final SessionRecordService sessionRecordService;

  public SessionRecordController(SessionRecordService sessionRecordService) {
    this.sessionRecordService = sessionRecordService;
  }

  @PutMapping("/appointments/{appointmentId}/attendance")
  public Appointment recordAttendance(
      @CurrentUserId UUID userId,
      @PathVariable UUID appointmentId,
      @Valid @RequestBody AttendanceRecord request) {
    return sessionRecordService.recordAttendance(userId, appointmentId, request);
  }

  @GetMapping("/patients/{patientId}/session-records")
  public SessionRecordPage history(
      @CurrentUserId UUID userId,
      @PathVariable UUID patientId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return sessionRecordService.history(userId, patientId, page, size);
  }
}
