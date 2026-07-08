package com.psiops.api.lead.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.lead.application.LeadMapper;
import com.psiops.api.support.ContainersConfig;
import com.psiops.api.support.EphemeralAxonSchema;
import com.psiops.contracts.model.Lead;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Testes de repositório contra o PostgreSQL real: persistência e leitura de um
 * {@link LeadEntity} exercitam a tabela {@code leads} criada pela V1, e o
 * mapeamento para o DTO de contrato {@link Lead} prova o consumo do gen/java.
 */
@SpringBootTest
@Import(ContainersConfig.class)
@EphemeralAxonSchema
class LeadRepositoryTest {

  @Autowired private LeadRepository leadRepository;

  @Test
  void savesAndReadsBackLead() {
    var id = UUID.randomUUID();
    var createdAt = OffsetDateTime.of(2026, 1, 15, 12, 0, 0, 0, ZoneOffset.UTC);
    var entity = new LeadEntity(id, "Ana Beatriz Souza", "+5511990000000", "ana@exemplo.com.br", createdAt);

    leadRepository.save(entity);

    var found = leadRepository.findByEmail("ana@exemplo.com.br");
    assertThat(found).isPresent();
    assertThat(found.get().getId()).isEqualTo(id);
    assertThat(found.get().getWhatsapp()).isEqualTo("+5511990000000");

    // O mapper produz o DTO de contrato com os mesmos valores.
    Lead dto = LeadMapper.toContract(found.get());
    assertThat(dto.getId()).isEqualTo(id);
    assertThat(dto.getName()).isEqualTo("Ana Beatriz Souza");
    assertThat(dto.getEmail()).isEqualTo("ana@exemplo.com.br");
    assertThat(dto.getCreatedAt()).isEqualTo(createdAt);
  }
}
