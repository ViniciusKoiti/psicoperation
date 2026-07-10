package com.psiops.api.lead.web;

import com.psiops.api.lead.domain.LeadRateLimitExceededException;
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
 * Traduz as exceções do módulo de lead para respostas Problem Details (RFC
 * 9457, {@code application/problem+json}), conforme os {@code responses}
 * declarados em {@code packages/contracts/openapi/paths/lead/leads.yaml}.
 * Escopo restrito ao controller de lead — segue o mesmo padrão de
 * {@code com.psiops.api.auth.web.AuthExceptionHandler}.
 *
 * <p>Não há handler para "e-mail já cadastrado": esse caso nunca vira
 * exceção neste módulo — {@link com.psiops.api.lead.application.LeadService}
 * resolve o reenvio do mesmo e-mail devolvendo o registro existente como
 * sucesso, sem revelar a duplicidade (ver acceptance criteria da PSI-028).
 */
@RestControllerAdvice(basePackageClasses = LeadController.class)
public class LeadExceptionHandler {

  @ExceptionHandler(LeadRateLimitExceededException.class)
  public ResponseEntity<Problem> handleRateLimitExceeded(
      LeadRateLimitExceededException ex, HttpServletRequest request) {
    return problem(HttpStatus.TOO_MANY_REQUESTS, "Muitas submissões", ex.getMessage(), request);
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
