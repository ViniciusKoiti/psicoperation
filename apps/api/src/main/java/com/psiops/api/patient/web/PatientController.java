package com.psiops.api.patient.web;

import com.psiops.api.auth.web.CurrentUserId;
import com.psiops.api.patient.application.PatientService;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.PatientPage;
import com.psiops.contracts.model.PatientUpdateRequest;
import jakarta.validation.Valid;
import java.util.UUID;
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
 * Endpoints de pacientes conforme os contratos em
 * {@code packages/contracts/openapi/paths/patient/*.yaml} (CRUD, PSI-023).
 *
 * <p>Todos os DTOs de request/response vêm de {@code com.psiops.contracts.model}
 * (gerados de {@code openapi.yaml}); nenhum é redefinido aqui.
 *
 * <p><strong>Isolamento multi-tenant</strong>: todo método resolve {@code
 * userId} exclusivamente via {@code @CurrentUserId} (nunca lê o {@code
 * SecurityContextHolder} diretamente) e repassa ao {@link PatientService},
 * que garante que toda consulta/gravação seja escopada a essa usuária.
 *
 * <p>O endpoint {@code DELETE /patients/{patientId}} arquiva o paciente (não
 * há exclusão física) — ver javadoc de {@link PatientService#archive}.
 */
@RestController
@RequestMapping("/patients")
public class PatientController {

  private final PatientService patientService;

  public PatientController(PatientService patientService) {
    this.patientService = patientService;
  }

  @GetMapping
  public PatientPage list(
      @CurrentUserId UUID userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String name) {
    return patientService.list(userId, page, size, status, name);
  }

  @PostMapping
  public ResponseEntity<Patient> create(
      @CurrentUserId UUID userId, @Valid @RequestBody PatientCreateRequest request) {
    Patient created = patientService.create(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/{patientId}")
  public Patient get(@CurrentUserId UUID userId, @PathVariable UUID patientId) {
    return patientService.get(userId, patientId);
  }

  @PutMapping("/{patientId}")
  public Patient update(
      @CurrentUserId UUID userId,
      @PathVariable UUID patientId,
      @Valid @RequestBody PatientUpdateRequest request) {
    return patientService.update(userId, patientId, request);
  }

  @DeleteMapping("/{patientId}")
  public ResponseEntity<Void> archive(@CurrentUserId UUID userId, @PathVariable UUID patientId) {
    patientService.archive(userId, patientId);
    return ResponseEntity.noContent().build();
  }
}
