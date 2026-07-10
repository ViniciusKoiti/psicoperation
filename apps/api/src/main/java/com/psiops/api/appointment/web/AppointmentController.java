package com.psiops.api.appointment.web;

import com.psiops.api.appointment.application.AppointmentService;
import com.psiops.api.auth.web.CurrentUserId;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AppointmentCreateRequest;
import com.psiops.contracts.model.AppointmentPage;
import com.psiops.contracts.model.AppointmentUpdateRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de agenda/consultas conforme os contratos em
 * {@code packages/contracts/openapi/paths/appointment/*.yaml} (PSI-024).
 *
 * <p>Todos os DTOs de request/response vêm de {@code com.psiops.contracts.model}
 * (gerados de {@code openapi.yaml}); nenhum é redefinido aqui.
 *
 * <p><strong>Isolamento multi-tenant</strong>: todo método resolve {@code
 * userId} exclusivamente via {@code @CurrentUserId} (nunca lê o {@code
 * SecurityContextHolder} diretamente) e repassa ao {@link AppointmentService},
 * que garante que toda consulta/gravação seja escopada a essa usuária.
 *
 * <p>O endpoint {@code PUT .../attendance} (registro administrativo de
 * presença) é da PSI-025, fora de escopo aqui.
 */
@RestController
@RequestMapping("/appointments")
public class AppointmentController {

  private final AppointmentService appointmentService;

  public AppointmentController(AppointmentService appointmentService) {
    this.appointmentService = appointmentService;
  }

  @GetMapping
  public AppointmentPage list(
      @CurrentUserId UUID userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) UUID patientId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return appointmentService.list(userId, page, size, patientId, from, to);
  }

  @PostMapping
  public ResponseEntity<Appointment> create(
      @CurrentUserId UUID userId, @Valid @RequestBody AppointmentCreateRequest request) {
    Appointment created = appointmentService.create(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/{appointmentId}")
  public Appointment get(@CurrentUserId UUID userId, @PathVariable UUID appointmentId) {
    return appointmentService.get(userId, appointmentId);
  }

  @PutMapping("/{appointmentId}")
  public Appointment update(
      @CurrentUserId UUID userId,
      @PathVariable UUID appointmentId,
      @Valid @RequestBody AppointmentUpdateRequest request) {
    return appointmentService.update(userId, appointmentId, request);
  }

  @DeleteMapping("/{appointmentId}")
  public ResponseEntity<Void> cancel(@CurrentUserId UUID userId, @PathVariable UUID appointmentId) {
    appointmentService.cancel(userId, appointmentId);
    return ResponseEntity.noContent().build();
  }
}
