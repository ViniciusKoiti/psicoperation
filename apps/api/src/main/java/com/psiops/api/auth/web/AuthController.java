package com.psiops.api.auth.web;

import com.psiops.api.auth.application.AuthService;
import com.psiops.api.auth.application.LoginRateLimiter;
import com.psiops.api.auth.application.UserMapper;
import com.psiops.api.auth.domain.AuthenticatedAccountNotFoundException;
import com.psiops.api.auth.domain.AuthenticatedUser;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.LoginRequest;
import com.psiops.contracts.model.RefreshTokenRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.SessionResponse;
import com.psiops.contracts.model.TokenPair;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de autenticação conforme os contratos em
 * {@code packages/contracts/openapi/paths/auth/*.yaml}: registro, login,
 * refresh (públicos) e sessão corrente (protegida, prova a cadeia do filtro
 * JWT — ver {@link JwtAuthenticationFilter} e {@link SecurityConfig}).
 *
 * <p>Todos os DTOs de request/response vêm de {@code com.psiops.contracts.model}
 * (gerados de {@code openapi.yaml}); nenhum é redefinido aqui.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;
  private final LoginRateLimiter loginRateLimiter;
  private final UserRepository userRepository;

  public AuthController(
      AuthService authService, LoginRateLimiter loginRateLimiter, UserRepository userRepository) {
    this.authService = authService;
    this.loginRateLimiter = loginRateLimiter;
    this.userRepository = userRepository;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    AuthResponse response = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
    // Chave de rate-limit: IP remoto + e-mail tentado (ver javadoc de
    // LoginRateLimiter). request.getRemoteAddr() é o suficiente para o MVP
    // sem reverse proxy com IP forwarding configurado; revisitar se/quando
    // houver um proxy confiável na frente (X-Forwarded-For).
    String key = httpRequest.getRemoteAddr() + "|" + request.getEmail().trim().toLowerCase();
    loginRateLimiter.checkAndConsume(key);
    return ResponseEntity.ok(authService.login(request));
  }

  @PostMapping("/refresh")
  public ResponseEntity<TokenPair> refresh(@Valid @RequestBody RefreshTokenRequest request) {
    return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
  }

  @GetMapping("/session")
  public ResponseEntity<SessionResponse> session(
      @CurrentUserId UUID userId, @AuthenticationPrincipal AuthenticatedUser principal) {
    var user = userRepository.findById(userId)
        // Conta pode ter sido removida após o access token ter sido emitido;
        // trata como 401 em vez de vazar um 404/500 confuso.
        .orElseThrow(AuthenticatedAccountNotFoundException::new);
    OffsetDateTime expiresAt = principal.accessTokenExpiresAt().atOffset(ZoneOffset.UTC);
    return ResponseEntity.ok(new SessionResponse(UserMapper.toContract(user), expiresAt));
  }
}
