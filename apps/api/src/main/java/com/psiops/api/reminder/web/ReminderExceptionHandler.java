package com.psiops.api.reminder.web;

import com.psiops.api.reminder.domain.InvalidReminderStateException;
import com.psiops.api.reminder.domain.ReminderLinkNotFoundException;
import com.psiops.contracts.model.FieldViolation;
import com.psiops.contracts.model.Problem;
import com.psiops.contracts.model.ValidationProblem;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Traduz as exceções do módulo de lembretes para respostas Problem Details
 * (RFC 9457, {@code application/problem+json}), conforme os {@code
 * responses} declarados em {@code
 * packages/contracts/openapi/paths/reminder/reminders.yaml}. Escopo restrito
 * ao controller de lembretes — mesmo padrão de {@code
 * com.psiops.api.billing.web.ChargeExceptionHandler}.
 *
 * <p>{@link ReminderLinkNotFoundException} responde 404 — o contrato atual
 * só declara 400/401/500 para {@code POST /reminders} (nenhum 404), mas o
 * acceptance criteria do manifesto PSI-027 exige explicitamente 404 para
 * vínculo inexistente/de outro tenant, sem vazar existência; registrado como
 * open_question no PR (gap do contrato, que esta tarefa não pode editar).
 */
@RestControllerAdvice(basePackageClasses = ReminderController.class)
public class ReminderExceptionHandler {

  @ExceptionHandler(ReminderLinkNotFoundException.class)
  public ResponseEntity<Problem> handleLinkNotFound(
      ReminderLinkNotFoundException ex, HttpServletRequest request) {
    return problem(HttpStatus.NOT_FOUND, "Vínculo não encontrado", ex.getMessage(), request);
  }

  @ExceptionHandler(InvalidReminderStateException.class)
  public ResponseEntity<Problem> handleInvalidState(
      InvalidReminderStateException ex, HttpServletRequest request) {
    return problem(HttpStatus.BAD_REQUEST, "Requisição inválida", ex.getMessage(), request);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ValidationProblem> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    List<FieldViolation> violations =
        ex.getBindingResult().getFieldErrors().stream()
            .map(
                fieldError ->
                    new FieldViolation(
                        fieldError.getField(),
                        fieldError.getDefaultMessage() == null
                            ? "valor inválido"
                            : fieldError.getDefaultMessage()))
            .toList();
    ValidationProblem body =
        new ValidationProblem("Requisição inválida", HttpStatus.BAD_REQUEST.value(), violations)
            .instance(request.getRequestURI());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .body(body);
  }

  private ResponseEntity<Problem> problem(
      HttpStatus status, String title, String detail, HttpServletRequest request) {
    Problem body = new Problem(title, status.value()).detail(detail).instance(request.getRequestURI());
    return ResponseEntity.status(status).contentType(MediaType.APPLICATION_PROBLEM_JSON).body(body);
  }
}
