package com.psiops.api.notification.billing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.billing.domain.event.ChargeOverdueDetectedEvent;
import com.psiops.api.notification.email.DomainEventPublisher;
import com.psiops.api.notification.email.EmailDeliveryFailedException;
import com.psiops.api.notification.email.RetryingEmailSender;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.patient.persistence.PatientStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Testes de {@link ChargeOverdueEmailHandler} (PSI-029): conteúdo pt-BR do
 * e-mail (valor e data em formato brasileiro), idempotência via guard em
 * memória por {@code eventId} (mesmo evento processado duas vezes → um único
 * e-mail) e não propagação de falha definitiva de SMTP.
 */
class ChargeOverdueEmailHandlerTest {

  private final UserRepository userRepository = mock(UserRepository.class);
  private final PatientRepository patientRepository = mock(PatientRepository.class);
  private final RetryingEmailSender emailSender = mock(RetryingEmailSender.class);
  private final DomainEventPublisher eventPublisher =
      new DomainEventPublisher(new ObjectMapper().findAndRegisterModules().disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS));

  private ChargeOverdueEmailHandler handler;

  @BeforeEach
  void setUp() {
    handler = new ChargeOverdueEmailHandler(userRepository, patientRepository, emailSender, eventPublisher);
  }

  private ChargeOverdueDetectedEvent overdueEvent(UUID eventId, UUID userId, UUID patientId) {
    return new ChargeOverdueDetectedEvent(
        eventId, UUID.randomUUID(), userId, patientId, "2026-07", 15000L, LocalDate.of(2026, 7, 5), OffsetDateTime.now(ZoneOffset.UTC));
  }

  @Test
  void chargeOverdue_sendsEmailToOwningPsychologist_withBrazilianFormattedContent() {
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    UserEntity psychologist = new UserEntity(userId, "Ana Psicóloga", "ana@exemplo.com", "hash", OffsetDateTime.now());
    PatientEntity patient =
        new PatientEntity(patientId, userId, "Paciente Atrasado", null, null, 15000L, 10, PatientStatus.ATIVO, null, OffsetDateTime.now());
    when(userRepository.findById(userId)).thenReturn(Optional.of(psychologist));
    when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

    handler.on(overdueEvent(UUID.randomUUID(), userId, patientId));

    ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
    ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
    verify(emailSender).send(eq("ana@exemplo.com"), subjectCaptor.capture(), bodyCaptor.capture());
    assertThat(subjectCaptor.getValue()).contains("Paciente Atrasado").contains("2026-07");
    assertThat(bodyCaptor.getValue()).contains("R$ 150,00").contains("05/07/2026");
  }

  @Test
  void sameEventProcessedTwice_sendsEmailOnlyOnce() {
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    UUID eventId = UUID.randomUUID();
    UserEntity psychologist = new UserEntity(userId, "Ana Psicóloga", "ana@exemplo.com", "hash", OffsetDateTime.now());
    when(userRepository.findById(userId)).thenReturn(Optional.of(psychologist));
    when(patientRepository.findById(patientId)).thenReturn(Optional.empty());

    ChargeOverdueDetectedEvent event = overdueEvent(eventId, userId, patientId);
    handler.on(event);
    handler.on(event);

    verify(emailSender, times(1)).send(any(), any(), any());
  }

  @Test
  void differentEvents_eachSendsItsOwnEmail() {
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    UserEntity psychologist = new UserEntity(userId, "Ana Psicóloga", "ana@exemplo.com", "hash", OffsetDateTime.now());
    when(userRepository.findById(userId)).thenReturn(Optional.of(psychologist));
    when(patientRepository.findById(patientId)).thenReturn(Optional.empty());

    handler.on(overdueEvent(UUID.randomUUID(), userId, patientId));
    handler.on(overdueEvent(UUID.randomUUID(), userId, patientId));

    verify(emailSender, times(2)).send(any(), any(), any());
  }

  @Test
  void definitiveEmailFailure_doesNotPropagateException() {
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    UserEntity psychologist = new UserEntity(userId, "Ana Psicóloga", "ana@exemplo.com", "hash", OffsetDateTime.now());
    when(userRepository.findById(userId)).thenReturn(Optional.of(psychologist));
    when(patientRepository.findById(patientId)).thenReturn(Optional.empty());
    org.mockito.Mockito.doThrow(new EmailDeliveryFailedException("falha definitiva", new RuntimeException("smtp indisponível")))
        .when(emailSender)
        .send(any(), any(), any());

    ChargeOverdueDetectedEvent event = overdueEvent(UUID.randomUUID(), userId, patientId);
    assertThatCode(() -> handler.on(event)).doesNotThrowAnyException();
  }

  @Test
  void psychologistNotFound_neverAttemptsToSendEmail() {
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    handler.on(overdueEvent(UUID.randomUUID(), userId, patientId));

    verify(emailSender, never()).send(any(), any(), any());
  }
}
