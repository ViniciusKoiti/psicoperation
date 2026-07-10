package com.psiops.api.appointment.web;

import com.psiops.api.appointment.domain.AppointmentConflictException;
import com.psiops.api.appointment.domain.AppointmentNotFoundException;
import com.psiops.api.appointment.domain.InvalidAppointmentStateException;
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
 * Traduz as exceções do módulo de agenda para respostas Problem Details (RFC
 * 9457, {@code application/problem+json}), conforme os {@code responses}
 * declarados em {@code packages/contracts/openapi/paths/appointment/*.yaml}.
 * Escopo restrito ao controller de agenda — mesmo padrão de {@code
 * com.psiops.api.patient.web.PatientExceptionHandler}.
 */
@RestControllerAdvice(basePackageClasses = AppointmentController.class)
public class AppointmentExceptionHandler {

  @ExceptionHandler(AppointmentNotFoundException.class)
  public ResponseEntity<Problem> handleNotFound(
      AppointmentNotFoundException ex, HttpServletRequest request) {
    return problem(HttpStatus.NOT_FOUND, "Consulta não encontrada", ex.getMessage(), request);
  }

  @ExceptionHandler(AppointmentConflictException.class)
  public ResponseEntity<Problem> handleConflict(
      AppointmentConflictException ex, HttpServletRequest request) {
    return problem(HttpStatus.CONFLICT, "Conflito de horário", ex.getMessage(), request);
  }

  @ExceptionHandler(InvalidAppointmentStateException.class)
  public ResponseEntity<Problem> handleInvalidState(
      InvalidAppointmentStateException ex, HttpServletRequest request) {
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
