package com.psiops.api.auth.application;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

/**
 * Emissão e validação do access token JWT (HS256), assinado com o segredo
 * simétrico de {@link JwtProperties}.
 *
 * <p>O claim {@code sub} carrega o {@code userId} (UUID); o claim customizado
 * {@code email} existe só para exibição/telemetria — nenhuma decisão de
 * autorização deve depender dele (é o {@code userId} que define o tenant).
 * Nunca inclui senha, hash ou o refresh token.
 */
@Service
public class JwtService {

  private final SecretKey signingKey;
  private final java.time.Duration accessTokenTtl;

  public JwtService(JwtProperties properties) {
    byte[] secretBytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
    // Keys.hmacShaKeyFor falha rápido (WeakKeyException) se o segredo tiver
    // menos de 256 bits — preferível a aceitar um segredo fraco em silêncio.
    this.signingKey = Keys.hmacShaKeyFor(secretBytes);
    this.accessTokenTtl = properties.getAccessTokenTtl();
  }

  /** Access token recém-emitido, com os dados necessários para montar o {@code TokenPair} do contrato. */
  public record IssuedAccessToken(String token, Instant expiresAt, int expiresInSeconds) {
  }

  /** Claims extraídos e validados de um access token apresentado pelo cliente. */
  public record AccessTokenClaims(UUID userId, String email, Instant expiresAt) {
  }

  public IssuedAccessToken issueAccessToken(UUID userId, String email) {
    Instant now = Instant.now();
    Instant expiresAt = now.plus(accessTokenTtl);
    String token = Jwts.builder()
        .subject(userId.toString())
        .claim("email", email)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(signingKey)
        .compact();
    return new IssuedAccessToken(token, expiresAt, (int) accessTokenTtl.toSeconds());
  }

  /**
   * Valida assinatura e expiração e extrai os claims.
   *
   * @throws JwtException se o token for inválido, malformado, expirado ou tiver assinatura incorreta
   */
  public AccessTokenClaims parseAccessToken(String token) {
    Claims claims = Jwts.parser()
        .verifyWith(signingKey)
        .build()
        .parseSignedClaims(token)
        .getPayload();
    UUID userId = UUID.fromString(claims.getSubject());
    String email = claims.get("email", String.class);
    Instant expiresAt = claims.getExpiration().toInstant();
    return new AccessTokenClaims(userId, email, expiresAt);
  }
}
