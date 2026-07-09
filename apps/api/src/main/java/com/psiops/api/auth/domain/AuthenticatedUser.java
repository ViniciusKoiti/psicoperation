package com.psiops.api.auth.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Identidade autenticada derivada de um access token JWT válido.
 *
 * <p>É o {@code principal} colocado no {@link org.springframework.security.core.Authentication}
 * pelo filtro JWT ({@code com.psiops.api.auth.web.JwtAuthenticationFilter}) a cada requisição.
 * Nenhuma senha ou hash trafega aqui — apenas os dados já públicos do claim do token.
 *
 * <p>Módulos além de {@code auth} não devem ler o {@link org.springframework.security.core.context.SecurityContextHolder}
 * diretamente; o mecanismo único e documentado para obter o usuário autenticado é o argumento
 * {@code @CurrentUserId UUID} (ver {@code com.psiops.api.auth.web.CurrentUserId}), que é o
 * alicerce do isolamento multi-tenant estrito por {@code userId} a partir de PSI-023.
 */
public record AuthenticatedUser(UUID userId, String email, Instant accessTokenExpiresAt) {
}
