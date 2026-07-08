package com.psiops.api.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Fornece um PostgreSQL real (Testcontainers) para os testes de integração,
 * ligado ao contexto Spring via {@link ServiceConnection} — o datasource,
 * Flyway e JPA passam a apontar para o container automaticamente.
 *
 * <p>A imagem casa com a do docker compose (PSI-003), {@code postgres:16.9},
 * garantindo que a V1 seja validada no mesmo motor usado em desenvolvimento.
 */
@TestConfiguration(proxyBeanMethods = false)
public class ContainersConfig {

  @Bean
  @ServiceConnection
  public PostgreSQLContainer<?> postgresContainer() {
    return new PostgreSQLContainer<>(DockerImageName.parse("postgres:16.9-alpine"));
  }
}
