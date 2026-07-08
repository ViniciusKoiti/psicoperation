package com.psiops.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.lead.persistence.LeadRepository;
import com.psiops.api.settings.persistence.SettingsRepository;
import com.psiops.api.support.ContainersConfig;
import com.psiops.api.support.EphemeralAxonSchema;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Teste de contexto: o Spring sobe apontando para um PostgreSQL real, o Flyway
 * aplica a V1 e o Hibernate valida o mapeamento das entidades contra o schema
 * criado. Se a migration e as entidades divergirem, o contexto falha ao subir.
 */
@SpringBootTest
@Import(ContainersConfig.class)
@EphemeralAxonSchema
class PsiopsApiApplicationTests {

  @Autowired private UserRepository userRepository;
  @Autowired private LeadRepository leadRepository;
  @Autowired private SettingsRepository settingsRepository;

  @Test
  void contextLoadsAndSchemaIsQueryable() {
    // As três tabelas da V1 existem e são consultáveis (validação implícita do
    // Flyway + JPA validate ao subir o contexto).
    assertThat(userRepository.count()).isZero();
    assertThat(leadRepository.count()).isZero();
    assertThat(settingsRepository.count()).isZero();
  }
}
