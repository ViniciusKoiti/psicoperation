package com.psiops.api.sessionrecord.web;

import com.psiops.api.appointment.domain.AppointmentNotFoundException;
import com.psiops.api.patient.domain.PatientNotFoundException;
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
 * Traduz as exceções do módulo de registros administrativos para respostas
 * Problem Details (RFC 9457, {@code application/problem+json}). Escopo
 * restrito a {@link SessionRecordController} — mesmo padrão de {@code
 * com.psiops.api.appointment.web.AppointmentExceptionHandler}.
 *
 * <p>{@link AppointmentNotFoundException} e {@link PatientNotFoundException}
 * são reaproveitadas dos módulos de agenda (PSI-024) e pacientes (PSI-023):
 * vínculo com consulta ou paciente inexistente/de outra usuária é
 * indistinguível de "não existe" — 404, nunca 403.
 */
@RestControllerAdvice(basePackageClasses = SessionRecordController.class)
public class SessionRecordExceptionHandler {

  @ExceptionHandler(AppointmentNotFoundException.class)
  public ResponseEntity<Problem> handleAppointmentNotFound(
      AppointmentNotFoundException ex, HttpServletRequest request) {
    return problem(HttpStatus.NOT_FOUND, "Consulta não encontrada", ex.getMessage(), request);
  }

  @ExceptionHandler(PatientNotFoundException.class)
  public ResponseEntity<Problem> handlePatientNotFound(
      PatientNotFoundException ex, HttpServletRequest request) {
    return problem(HttpStatus.NOT_FOUND, "Paciente não encontrado", ex.getMessage(), request);
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
