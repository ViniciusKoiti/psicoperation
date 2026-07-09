package com.psiops.api.patient.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.support.ContainersConfig;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Teste de repositório contra o PostgreSQL real (Testcontainers): a migration
 * V2 (PSI-021) cria a tabela {@code patients} e a entidade {@link
 * PatientEntity} mapeia exatamente esse schema — inclusive {@code
 * monthlyFeeCents} como inteiro (BIGINT), nunca ponto flutuante.
 */
@SpringBootTest
@Import(ContainersConfig.class)
class PatientRepositoryTest {

  @Autowired private UserRepository userRepository;
  @Autowired private PatientRepository patientRepository;

  @Test
  void savesAndReadsBackPatientWithIntegerMoneyAndUserScoping() {
    var userId = UUID.randomUUID();
    var now = OffsetDateTime.of(2026, 7, 9, 10, 0, 0, 0, ZoneOffset.UTC);
    userRepository.save(new UserEntity(userId, "Marina Alves", "marina@exemplo.com.br", "hash", now));

    var patientId = UUID.randomUUID();
    var patient =
        new PatientEntity(
            patientId,
            userId,
            "João da Silva",
            "+5511990000000",
            "joao@exemplo.com.br",
            15000L,
            10,
            PatientStatus.ATIVO,
            "Prefere contato por WhatsApp",
            now);

    patientRepository.save(patient);

    var found = patientRepository.findById(patientId);
    assertThat(found).isPresent();
    assertThat(found.get().getUserId()).isEqualTo(userId);
    assertThat(found.get().getMonthlyFeeCents()).isEqualTo(15000L);
    assertThat(found.get().getBillingDay()).isEqualTo(10);
    assertThat(found.get().getStatus()).isEqualTo(PatientStatus.ATIVO);

    var byUser = patientRepository.findByUserId(userId);
    assertThat(byUser).hasSize(1);
    assertThat(byUser.get(0).getId()).isEqualTo(patientId);
  }
}
