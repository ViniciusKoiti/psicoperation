package com.psiops.api.auth.web;

import com.psiops.api.auth.application.JwtService;
import com.psiops.api.auth.domain.AuthenticatedUser;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Valida o access token JWT (header {@code Authorization: Bearer <token>}) em
 * cada requisição e, se válido, popula o {@link org.springframework.security.core.context.SecurityContextHolder}
 * com um {@link AuthenticatedUser} como principal — é dali que
 * {@link CurrentUserIdArgumentResolver} extrai o {@code userId} tipado
 * consumido pelos controllers.
 *
 * <p>Ausência de header, token malformado, assinatura inválida ou expirada:
 * a requisição segue <em>sem</em> autenticação (não lança aqui). Quem decide
 * se isso é aceitável é a regra de autorização em {@link SecurityConfig}
 * (rotas públicas seguem; rotas protegidas caem no
 * {@link JwtAuthenticationEntryPoint}, respondendo 401). Nunca loga o
 * conteúdo do token.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith(BEARER_PREFIX)) {
      String token = header.substring(BEARER_PREFIX.length()).trim();
      try {
        JwtService.AccessTokenClaims claims = jwtService.parseAccessToken(token);
        AuthenticatedUser principal =
            new AuthenticatedUser(claims.userId(), claims.email(), claims.expiresAt());
        var authentication =
            new UsernamePasswordAuthenticationToken(principal, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
      } catch (JwtException | IllegalArgumentException ex) {
        SecurityContextHolder.clearContext();
        log.debug("Access token JWT rejeitado: {}", ex.getMessage());
      }
    }
    filterChain.doFilter(request, response);
  }
}
