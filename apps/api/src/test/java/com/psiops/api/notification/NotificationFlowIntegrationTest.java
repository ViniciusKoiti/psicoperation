package com.psiops.api.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AppointmentCreateRequest;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.Reminder;
import com.psiops.contracts.model.ReminderChannel;
import com.psiops.contracts.model.ReminderCreateRequest;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Cobertura ponta a ponta (MockMvc + Testcontainers, PostgreSQL real, {@code
 * SimpleDeadlineManager} REAL - não {@code StubDeadlineManager}) da camada
 * assíncrona de lembretes e e-mail (PSI-029):
 *
 * <ul>
 *   <li>um lembrete criado via {@code POST /reminders} tem seu deadline
 *       disparado de verdade (mesmo espírito de {@code
 *       SampleTaskFlowIntegrationTest#deadlineManagerSchedulesAndFiresRealReminder}),
 *       resultando em e-mail "enviado" (via {@link JavaMailSender} mockado,
 *       nunca dependendo de Mailpit rodando) e {@code reminders.sent_at}/
 *       {@code status = ENVIADO} persistidos;</li>
 *   <li>criar uma consulta agenda automaticamente os dois lembretes de
 *       véspera/dia vinculados; cancelá-la cancela ambos.</li>
 * </ul>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class NotificationFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private ReminderRepository reminderRepository;

  @MockBean private JavaMailSender javaMailSender;

  private record AuthedUser(UUID userId, String accessToken) {}

  private AuthedUser registerUser(String name, String email) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new RegisterRequest(name, email, "SenhaForte123!"))))
            .andExpect(status().isCreated())
            .andReturn();
    AuthResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
    return new AuthedUser(response.getUser().getId(), response.getTokens().getAccessToken());
  }

  private Patient createPatient(String token, String name) throws Exception {
    PatientCreateRequest request = new PatientCreateRequest(name, 15000L, 10);
    MvcResult result =
        mockMvc
            .perform(
                post("/patients")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), Patient.class);
  }

  @Test
  void reminderDeadlineFires_emailSentAndReminderMarkedSent_withRealDeadlineManager() throws Exception {
    AuthedUser psychologist = registerUser("Ana Notificacoes", "ana.notificacoes@exemplo.com.br");
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusSeconds(1);

    ReminderCreateRequest request =
        new ReminderCreateRequest(ReminderChannel.EMAIL, "Lembrete de pagamento", "Olá, sua mensalidade vence em breve.", scheduledFor);
    MvcResult result =
        mockMvc
            .perform(
                post("/reminders")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();
    Reminder created = objectMapper.readValue(result.getResponse().getContentAsString(), Reminder.class);

    ReminderEntity reminder = null;
    long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
    while (System.nanoTime() < deadline) {
      reminder = reminderRepository.findById(created.getId()).orElse(null);
      if (reminder != null && reminder.getSentAt() != null) {
        break;
      }
      Thread.sleep(150);
    }

    assertThat(reminder).isNotNull();
    assertThat(reminder.getStatus()).isEqualTo(ReminderStatus.ENVIADO);
    assertThat(reminder.getSentAt()).isNotNull();
    verify(javaMailSender, atLeastOnce()).send(any(SimpleMailMessage.class));
  }

  @Test
  void appointmentCreated_schedulesTwoLinkedReminders_cancellingAppointmentCancelsBoth() throws Exception {
    AuthedUser psychologist = registerUser("Ana Consulta Notificacoes", "ana.consulta.notificacoes@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Notificacoes");

    AppointmentCreateRequest request =
        new AppointmentCreateRequest(patient.getId(), OffsetDateTime.now(ZoneOffset.UTC).plusDays(5), 50);
    MvcResult result =
        mockMvc
            .perform(
                post("/appointments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();
    Appointment appointment = objectMapper.readValue(result.getResponse().getContentAsString(), Appointment.class);

    List<ReminderEntity> scheduled = reminderRepository.findByAppointmentIdAndStatus(appointment.getId(), ReminderStatus.AGENDADO);
    assertThat(scheduled).hasSize(2);
    assertThat(scheduled).allMatch(r -> r.getPatientId().equals(patient.getId()));
    assertThat(scheduled).allMatch(r -> r.getUserId().equals(psychologist.userId()));

    mockMvc
        .perform(delete("/appointments/{id}", appointment.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNoContent());

    List<ReminderEntity> stillScheduled = reminderRepository.findByAppointmentIdAndStatus(appointment.getId(), ReminderStatus.AGENDADO);
    assertThat(stillScheduled).isEmpty();
    List<ReminderEntity> cancelled = reminderRepository.findByAppointmentIdAndStatus(appointment.getId(), ReminderStatus.CANCELADO);
    assertThat(cancelled).hasSize(2);
  }
}
