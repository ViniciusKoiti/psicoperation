package com.psiops.api.notification.reminder;

import static org.assertj.core.api.Assertions.assertThat;
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
import com.psiops.api.notification.email.DomainEventPublisher;
import com.psiops.api.notification.email.EmailDeliveryFailedException;
import com.psiops.api.notification.email.RetryingEmailSender;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.patient.persistence.PatientStatus;
import com.psiops.api.reminder.domain.event.ReminderDueDetectedEvent;
import com.psiops.api.reminder.persistence.ReminderChannel;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Testes de {@link ReminderEmailHandler} (PSI-029) com {@link
 * RetryingEmailSender} mockado - cobre resolução de destinatário,
 * idempotência (reprocessamento do mesmo evento não duplica e-mail) e
 * registro de falha definitiva (retry esgotado). O retry/backoff em si é
 * testado isoladamente em {@code RetryingEmailSenderTest}.
 */
class ReminderEmailHandlerTest {

  private final ReminderRepository reminderRepository = mock(ReminderRepository.class);
  private final PatientRepository patientRepository = mock(PatientRepository.class);
  private final UserRepository userRepository = mock(UserRepository.class);
  private final RetryingEmailSender emailSender = mock(RetryingEmailSender.class);
  private final DomainEventPublisher eventPublisher =
      new DomainEventPublisher(new ObjectMapper().findAndRegisterModules().disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS));

  private ReminderEmailHandler handler;

  @BeforeEach
  void setUp() {
    handler = new ReminderEmailHandler(reminderRepository, patientRepository, userRepository, emailSender, eventPublisher);
  }

  private ReminderEntity agendado(UUID id, UUID userId, UUID patientId) {
    return new ReminderEntity(
        id,
        userId,
        ReminderChannel.EMAIL,
        "Lembrete de pagamento",
        "Olá, sua mensalidade vence em breve.",
        OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1),
        null,
        ReminderStatus.AGENDADO,
        patientId,
        null,
        null,
        OffsetDateTime.now(ZoneOffset.UTC).minusDays(1));
  }

  private ReminderDueDetectedEvent dueEvent(ReminderEntity reminder) {
    return new ReminderDueDetectedEvent(
        reminder.getId(),
        reminder.getUserId(),
        reminder.getChannel(),
        reminder.getSubject(),
        reminder.getBody(),
        reminder.getScheduledFor(),
        reminder.getPatientId(),
        reminder.getAppointmentId(),
        reminder.getChargeId(),
        OffsetDateTime.now(ZoneOffset.UTC));
  }

  @Test
  void withPatientLinkAndEmail_sendsToPatientAndMarksSent() {
    UUID reminderId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    ReminderEntity reminder = agendado(reminderId, userId, patientId);
    PatientEntity patient =
        new PatientEntity(patientId, userId, "Paciente Teste", null, "paciente@exemplo.com", 15000L, 10, PatientStatus.ATIVO, null, OffsetDateTime.now());

    when(reminderRepository.findById(reminderId)).thenReturn(Optional.of(reminder));
    when(patientRepository.findById(patientId)).thenReturn(Optional.of(patient));

    handler.on(dueEvent(reminder));

    verify(emailSender).send(eq("paciente@exemplo.com"), eq(reminder.getSubject()), eq(reminder.getBody()));
    ArgumentCaptor<ReminderEntity> saved = ArgumentCaptor.forClass(ReminderEntity.class);
    verify(reminderRepository).save(saved.capture());
    assertThat(saved.getValue().getStatus()).isEqualTo(ReminderStatus.ENVIADO);
    assertThat(saved.getValue().getSentAt()).isNotNull();
  }

  @Test
  void withoutPatientLink_sendsToOwningPsychologist() {
    UUID reminderId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    ReminderEntity reminder = agendado(reminderId, userId, null);
    UserEntity psychologist = new UserEntity(userId, "Ana Psicóloga", "ana@exemplo.com", "hash", OffsetDateTime.now());

    when(reminderRepository.findById(reminderId)).thenReturn(Optional.of(reminder));
    when(userRepository.findById(userId)).thenReturn(Optional.of(psychologist));

    handler.on(dueEvent(reminder));

    verify(emailSender).send(eq("ana@exemplo.com"), any(), any());
    verify(patientRepository, never()).findById(any());
  }

  @Test
  void patientWithoutEmail_marksFailed_neverCallsEmailSender() {
    UUID reminderId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID patientId = UUID.randomUUID();
    ReminderEntity reminder = agendado(reminderId, userId, patientId);
    PatientEntity patientWithoutEmail =
        new PatientEntity(patientId, userId, "Paciente Sem Email", null, null, 15000L, 10, PatientStatus.ATIVO, null, OffsetDateTime.now());

    when(reminderRepository.findById(reminderId)).thenReturn(Optional.of(reminder));
    when(patientRepository.findById(patientId)).thenReturn(Optional.of(patientWithoutEmail));

    handler.on(dueEvent(reminder));

    verify(emailSender, never()).send(any(), any(), any());
    ArgumentCaptor<ReminderEntity> saved = ArgumentCaptor.forClass(ReminderEntity.class);
    verify(reminderRepository).save(saved.capture());
    assertThat(saved.getValue().getStatus()).isEqualTo(ReminderStatus.FALHOU);
  }

  @Test
  void definitiveEmailFailure_marksFailed_doesNotPropagateException() {
    UUID reminderId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    ReminderEntity reminder = agendado(reminderId, userId, null);
    UserEntity psychologist = new UserEntity(userId, "Ana Psicóloga", "ana@exemplo.com", "hash", OffsetDateTime.now());

    when(reminderRepository.findById(reminderId)).thenReturn(Optional.of(reminder));
    when(userRepository.findById(userId)).thenReturn(Optional.of(psychologist));
    org.mockito.Mockito.doThrow(new EmailDeliveryFailedException("falha definitiva", new RuntimeException("smtp indisponível")))
        .when(emailSender)
        .send(any(), any(), any());

    handler.on(dueEvent(reminder));

    ArgumentCaptor<ReminderEntity> saved = ArgumentCaptor.forClass(ReminderEntity.class);
    verify(reminderRepository).save(saved.capture());
    assertThat(saved.getValue().getStatus()).isEqualTo(ReminderStatus.FALHOU);
  }

  @Test
  void reminderAlreadySent_isIdempotent_emailNeverSentAgain() {
    UUID reminderId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    ReminderEntity alreadySent =
        new ReminderEntity(
            reminderId,
            userId,
            ReminderChannel.EMAIL,
            "Lembrete de pagamento",
            "Olá, sua mensalidade vence em breve.",
            OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(5),
            OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1),
            ReminderStatus.ENVIADO,
            null,
            null,
            null,
            OffsetDateTime.now(ZoneOffset.UTC).minusDays(1));

    when(reminderRepository.findById(reminderId)).thenReturn(Optional.of(alreadySent));

    handler.on(dueEvent(alreadySent));
    handler.on(dueEvent(alreadySent));

    verify(emailSender, never()).send(any(), any(), any());
    verify(reminderRepository, never()).save(any());
  }
}
