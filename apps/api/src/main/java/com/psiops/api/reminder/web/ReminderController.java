package com.psiops.api.reminder.web;

import com.psiops.api.auth.web.CurrentUserId;
import com.psiops.api.reminder.application.ReminderService;
import com.psiops.contracts.model.Reminder;
import com.psiops.contracts.model.ReminderCreateRequest;
import com.psiops.contracts.model.ReminderPage;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de lembretes conforme o contrato em {@code
 * packages/contracts/openapi/paths/reminder/reminders.yaml} (PSI-027):
 * {@code GET /reminders} e {@code POST /reminders} — os dois únicos
 * operationIds declarados para este recurso (não há path {@code
 * /reminders/{reminderId}}; ver javadoc de {@link ReminderService}).
 *
 * <p>Todos os DTOs de request/response vêm de {@code
 * com.psiops.contracts.model} (gerados de {@code openapi.yaml}); nenhum é
 * redefinido aqui.
 *
 * <p><strong>Isolamento multi-tenant</strong>: todo método resolve {@code
 * userId} exclusivamente via {@code @CurrentUserId} (nunca lê o {@code
 * SecurityContextHolder} diretamente) e repassa ao {@link ReminderService},
 * que garante que toda consulta/gravação seja escopada a essa usuária.
 */
@RestController
@RequestMapping("/reminders")
public class ReminderController {

  private final ReminderService reminderService;

  public ReminderController(ReminderService reminderService) {
    this.reminderService = reminderService;
  }

  @GetMapping
  public ReminderPage list(
      @CurrentUserId UUID userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) UUID patientId,
      @RequestParam(required = false) String status) {
    return reminderService.list(userId, page, size, patientId, status);
  }

  @PostMapping
  public ResponseEntity<Reminder> create(
      @CurrentUserId UUID userId, @Valid @RequestBody ReminderCreateRequest request) {
    Reminder created = reminderService.create(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }
}
