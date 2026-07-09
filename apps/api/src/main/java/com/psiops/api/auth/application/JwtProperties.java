package com.psiops.api.auth.application;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuração do access token JWT (PSI-022), vinculada ao prefixo
 * {@code psiops.security.jwt} em {@code application.yml}.
 *
 * <p><strong>Segredo</strong>: {@link #secret} é sempre lido de configuração
 * externa (env var {@code JWT_SECRET}, ver application.yml). O valor default
 * ali presente é intencionalmente inseguro e serve apenas para dev/test —
 * nunca é usado em um ambiente implantado real, onde {@code JWT_SECRET} é
 * obrigatoriamente definida. É responsabilidade do operador de cada ambiente
 * gerar um segredo aleatório de ao menos 256 bits (32 bytes); um segredo mais
 * curto faz {@link JwtService} falhar ao subir (fail-fast), nunca em runtime.
 *
 * <p><strong>TTLs</strong>: {@link #accessTokenTtl} é deliberadamente curto
 * (minutos) — é o token enviado em toda requisição autenticada, então uma
 * eventual captura tem janela de abuso pequena. {@link #refreshTokenTtl} é
 * mais longo (dias) — é opaco, de uso único e rotacionado a cada troca (ver
 * {@link RefreshTokenService}), então uma vida mais longa não amplia a janela
 * de um único vazamento (o reuso é detectado e rejeitado).
 */
@ConfigurationProperties(prefix = "psiops.security.jwt")
public class JwtProperties {

  private String secret;
  private Duration accessTokenTtl = Duration.ofMinutes(15);
  private Duration refreshTokenTtl = Duration.ofDays(7);

  public String getSecret() {
    return secret;
  }

  public void setSecret(String secret) {
    this.secret = secret;
  }

  public Duration getAccessTokenTtl() {
    return accessTokenTtl;
  }

  public void setAccessTokenTtl(Duration accessTokenTtl) {
    this.accessTokenTtl = accessTokenTtl;
  }

  public Duration getRefreshTokenTtl() {
    return refreshTokenTtl;
  }

  public void setRefreshTokenTtl(Duration refreshTokenTtl) {
    this.refreshTokenTtl = refreshTokenTtl;
  }
}
