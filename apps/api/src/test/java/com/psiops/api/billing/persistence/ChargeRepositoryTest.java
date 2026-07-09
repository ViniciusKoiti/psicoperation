package com.psiops.api.billing.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.patient.persistence.PatientStatus;
import com.psiops.api.support.ContainersConfig;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Teste de repositório contra o PostgreSQL real (Testcontainers): a migration
 * V2 (PSI-021) cria a tabela {@code charges} com FK para {@code patients}, e a
 * entidade {@link ChargeEntity} mapeia exatamente esse schema — inclusive
 * {@code amountCents} como inteiro (BIGINT), nunca ponto flutuante, e a
 * competência no formato {@code AAAA-MM}.
 */
@SpringBootTest
@Import(ContainersConfig.class)
class ChargeRepositoryTest {

  @Autowired private UserRepository userRepository;
  @Autowired private PatientRepository patientRepository;
  @Autowired private ChargeRepository chargeRepository;

  @Test
  void savesAndReadsBackChargeWithIntegerMoneyAndCompetence() {
    var userId = UUID.randomUUID();
    var now = OffsetDateTime.of(2026, 7, 9, 10, 0, 0, 0, ZoneOffset.UTC);
    userRepository.save(new UserEntity(userId, "Marina Alves", "marina2@exemplo.com.br", "hash", now));

    var patientId = UUID.randomUUID();
    patientRepository.save(
        new PatientEntity(
            patientId, userId, "João da Silva", null, null, 15000L, 10, PatientStatus.ATIVO, null, now));

    var chargeId = UUID.randomUUID();
    var interest = new SimpleInterestParams(1.0, 2.0);
    var charge =
        new ChargeEntity(
            chargeId,
            userId,
            patientId,
            "2026-07",
            15000L,
            LocalDate.of(2026, 7, 10),
            ChargeStatus.PENDENTE,
            interest,
            null,
            now);

    chargeRepository.save(charge);

    var found = chargeRepository.findById(chargeId);
    assertThat(found).isPresent();
    assertThat(found.get().getAmountCents()).isEqualTo(15000L);
    assertThat(found.get().getCompetence()).isEqualTo("2026-07");
    assertThat(found.get().getStatus()).isEqualTo(ChargeStatus.PENDENTE);
    assertThat(found.get().getInterest().getMonthlyRatePercent()).isEqualTo(1.0);
    assertThat(found.get().getInterest().getFinePercent()).isEqualTo(2.0);

    var byCompetence = chargeRepository.findByUserIdAndCompetence(userId, "2026-07");
    assertThat(byCompetence).hasSize(1);
    assertThat(byCompetence.get(0).getId()).isEqualTo(chargeId);
  }
}
