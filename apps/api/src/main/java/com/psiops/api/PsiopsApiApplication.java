package com.psiops.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ponto de entrada do backend único do PsiOps.
 *
 * <p>Scaffold (PSI-010): sobe Spring Boot com JPA + Flyway + Actuator. Os
 * agregados state-stored do Axon Framework e os endpoints de negócio chegam
 * com as tarefas de domínio.
 */
@SpringBootApplication
public class PsiopsApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(PsiopsApiApplication.class, args);
  }
}
