package com.psiops.api.auth.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.contracts.model.Problem;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

/**
 * Responde 401 em Problem Details (RFC 9457) quando uma rota protegida é
 * acessada sem um access token válido — ausente, malformado, expirado ou com
 * assinatura inválida (ver {@link JwtAuthenticationFilter}, que nunca seta
 * autenticação nesses casos, deixando a decisão de autorização — e portanto
 * este entry point — para o {@code SecurityFilterChain}).
 *
 * <p>Roda antes do {@code DispatcherServlet}, então não pode usar
 * {@code @RestControllerAdvice} (aquele só entra em ação depois que um
 * controller já foi despachado) — a resposta é escrita manualmente com um
 * {@link ObjectMapper} próprio.
 */
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

  @Override
  public void commence(
      HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
      throws IOException, ServletException {
    Problem problem = new Problem("Não autenticado", HttpStatus.UNAUTHORIZED.value())
        .detail("token de acesso ausente, expirado ou inválido")
        .instance(request.getRequestURI());
    response.setStatus(HttpStatus.UNAUTHORIZED.value());
    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    response.getWriter().write(objectMapper.writeValueAsString(problem));
  }
}
