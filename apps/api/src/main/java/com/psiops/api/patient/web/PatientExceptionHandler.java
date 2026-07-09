package com.psiops.api.patient.web;

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
 * Traduz as exceções do módulo de pacientes para respostas Problem Details
 * (RFC 9457, {@code application/problem+json}), conforme os {@code
 * responses} declarados em {@code packages/contracts/openapi/paths/patient/*.yaml}.
 * Escopo restrito ao controller de pacientes — segue o mesmo padrão de
 * {@code com.psiops.api.auth.web.AuthExceptionHandler}.
 */
@RestControllerAdvice(basePackageClasses = PatientController.class)
public class PatientExceptionHandler {

  @ExceptionHandler(PatientNotFoundException.class)
  public ResponseEntity<Problem> handleNotFound(PatientNotFoundException ex, HttpServletRequest request) {
    return problem(HttpStatus.NOT_FOUND, "Paciente não encontrado", ex.getMessage(), request);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ValidationProblem> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    List<FieldViolation> violations = ex.getBindingResult().getFieldErrors().stream()
        .map(fieldError -> new FieldViolation(
            fieldError.getField(),
            fieldError.getDefaultMessage() == null ? "valor inválido" : fieldError.getDefaultMessage()))
        .toList();
    ValidationProblem body = new ValidationProblem("Requisição inválida", HttpStatus.BAD_REQUEST.value(), violations)
        .instance(request.getRequestURI());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .body(body);
  }

  private ResponseEntity<Problem> problem(
      HttpStatus status, String title, String detail, HttpServletRequest request) {
    Problem body = new Problem(title, status.value())
        .detail(detail)
        .instance(request.getRequestURI());
    return ResponseEntity.status(status)
        .contentType(MediaType.APPLICATION_PROBLEM_JSON)
        .body(body);
  }
}
