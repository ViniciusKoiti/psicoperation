package com.psiops.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.support.ContainersConfig;
import com.psiops.api.support.EphemeralAxonSchema;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;

/**
 * Verifica que {@code GET /actuator/health} responde 200 com status UP quando a
 * aplicação sobe apontando para um PostgreSQL real — o mesmo motor do docker
 * compose (PSI-003).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(ContainersConfig.class)
@EphemeralAxonSchema
class HealthEndpointTest {

  @Autowired private TestRestTemplate restTemplate;

  @Test
  void healthEndpointReportsUp() {
    var response = restTemplate.getForEntity("/actuator/health", String.class);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).contains("\"status\":\"UP\"");
  }
}
