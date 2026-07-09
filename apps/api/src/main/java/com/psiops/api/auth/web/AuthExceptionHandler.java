package com.psiops.api.auth.web;

import com.psiops.api.auth.domain.AuthenticatedAccountNotFoundException;
import com.psiops.api.auth.domain.EmailAlreadyRegisteredException;
import com.psiops.api.auth.domain.InvalidCredentialsException;
import com.psiops.api.auth.domain.InvalidRefreshTokenException;
import com.psiops.api.auth.domain.LoginRateLimitExceededException;
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
 * Traduz as exceções de domínio de {@code auth} para respostas Problem
 * Details (RFC 9457, {@code application/problem+json}), conforme os
 * {@code responses} declarados em {@code packages/contracts/openapi/paths/auth/*.yaml}.
 * Escopo restrito ao controller de auth — outros módulos definem seu próprio
 * tratamento quando ganharem endpoints.
 */
@RestControllerAdvice(basePackageClasses = AuthController.class)
public class AuthExceptionHandler {

  @ExceptionHandler(EmailAlreadyRegisteredException.class)
  public ResponseEntity<Problem> handleEmailAlreadyRegistered(
      EmailAlreadyRegisteredException ex, HttpServletRequest request) {
    return problem(HttpStatus.CONFLICT, "E-mail já cadastrado", ex.getMessage(), request);
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  public ResponseEntity<Problem> handleInvalidCredentials(
      InvalidCredentialsException ex, HttpServletRequest request) {
    return problem(HttpStatus.UNAUTHORIZED, "Credenciais inválidas", ex.getMessage(), request);
  }

  @ExceptionHandler(InvalidRefreshTokenException.class)
  public ResponseEntity<Problem> handleInvalidRefreshToken(
      InvalidRefreshTokenException ex, HttpServletRequest request) {
    return problem(HttpStatus.UNAUTHORIZED, "Refresh token inválido", ex.getMessage(), request);
  }

  @ExceptionHandler(AuthenticatedAccountNotFoundException.class)
  public ResponseEntity<Problem> handleAuthenticatedAccountNotFound(
      AuthenticatedAccountNotFoundException ex, HttpServletRequest request) {
    return problem(HttpStatus.UNAUTHORIZED, "Não autenticado", ex.getMessage(), request);
  }

  @ExceptionHandler(LoginRateLimitExceededException.class)
  public ResponseEntity<Problem> handleRateLimitExceeded(
      LoginRateLimitExceededException ex, HttpServletRequest request) {
    return problem(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas de login", ex.getMessage(), request);
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
