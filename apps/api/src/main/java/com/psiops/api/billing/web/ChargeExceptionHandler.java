package com.psiops.api.billing.web;

import com.psiops.api.billing.domain.ChargeAlreadyExistsException;
import com.psiops.api.billing.domain.ChargeAlreadyPaidException;
import com.psiops.api.billing.domain.ChargeNotFoundException;
import com.psiops.api.billing.domain.InvalidChargeStateException;
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
 * Traduz as exceções do módulo financeiro para respostas Problem Details
 * (RFC 9457, {@code application/problem+json}), conforme os {@code
 * responses} declarados em {@code
 * packages/contracts/openapi/paths/billing/*.yaml}. Escopo restrito ao
 * controller de cobranças — mesmo padrão de {@code
 * com.psiops.api.appointment.web.AppointmentExceptionHandler}.
 */
@RestControllerAdvice(basePackageClasses = ChargeController.class)
public class ChargeExceptionHandler {

  @ExceptionHandler(ChargeNotFoundException.class)
  public ResponseEntity<Problem> handleNotFound(ChargeNotFoundException ex, HttpServletRequest request) {
    return problem(HttpStatus.NOT_FOUND, "Cobrança não encontrada", ex.getMessage(), request);
  }

  @ExceptionHandler(ChargeAlreadyPaidException.class)
  public ResponseEntity<Problem> handleAlreadyPaid(ChargeAlreadyPaidException ex, HttpServletRequest request) {
    return problem(HttpStatus.CONFLICT, "Cobrança já paga", ex.getMessage(), request);
  }

  @ExceptionHandler(ChargeAlreadyExistsException.class)
  public ResponseEntity<Problem> handleAlreadyExists(ChargeAlreadyExistsException ex, HttpServletRequest request) {
    return problem(HttpStatus.CONFLICT, "Cobrança já existe", ex.getMessage(), request);
  }

  @ExceptionHandler(InvalidChargeStateException.class)
  public ResponseEntity<Problem> handleInvalidState(InvalidChargeStateException ex, HttpServletRequest request) {
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
