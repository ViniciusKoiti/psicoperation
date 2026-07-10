package com.psiops.api.reminder.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.reminder.domain.event.ReminderScheduledEvent;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AppointmentCreateRequest;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.Charge;
import com.psiops.contracts.model.CreateChargeRequest;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.Reminder;
import com.psiops.contracts.model.ReminderChannel;
import com.psiops.contracts.model.ReminderCreateRequest;
import com.psiops.contracts.model.ReminderPage;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.axonframework.eventhandling.DomainEventMessage;
import org.axonframework.eventsourcing.eventstore.EventStore;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

/**
 * Cobertura ponta a ponta (MockMvc + Testcontainers, PostgreSQL real) do
 * módulo de lembretes (PSI-027): agendamento (canal email), listagem
 * paginada com filtros, vínculo opcional válido/inválido (404 sem vazar
 * existência), validação de momento futuro, no máximo um vínculo
 * simultâneo, publicação de {@link ReminderScheduledEvent} via Axon
 * (verificada diretamente no event store, no espírito de {@code
 * AppointmentFlowIntegrationTest}) e isolamento estrito por tenant.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class ReminderFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private EventStore eventStore;

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

  private Appointment createAppointment(String token, UUID patientId) throws Exception {
    AppointmentCreateRequest request =
        new AppointmentCreateRequest(patientId, OffsetDateTime.now(ZoneOffset.UTC).plusDays(2), 50);
    MvcResult result =
        mockMvc
            .perform(
                post("/appointments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), Appointment.class);
  }

  private Charge createCharge(String token, UUID patientId) throws Exception {
    CreateChargeRequest request =
        new CreateChargeRequest(patientId, "2026-08", 15000L, java.time.LocalDate.now().plusDays(10));
    MvcResult result =
        mockMvc
            .perform(
                post("/charges")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), Charge.class);
  }

  private ResultActions createReminder(String token, ReminderCreateRequest request) throws Exception {
    return mockMvc.perform(
        post("/reminders")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));
  }

  private Reminder createReminderExpectingCreated(String token, ReminderCreateRequest request) throws Exception {
    MvcResult result = createReminder(token, request).andExpect(status().isCreated()).andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), Reminder.class);
  }

  private ReminderCreateRequest basicRequest(OffsetDateTime scheduledFor) {
    return new ReminderCreateRequest(
        ReminderChannel.EMAIL, "Lembrete de pagamento", "Olá, sua mensalidade vence em breve.", scheduledFor);
  }

  @Test
  void create_withoutLink_schedulesAndPublishesAxonEvent() throws Exception {
    AuthedUser psychologist = registerUser("Ana Lembretes", "ana.lembretes@exemplo.com.br");
    OffsetDateTime scheduledFor = OffsetDateTime.now(ZoneOffset.UTC).plusDays(1);

    MvcResult result =
        createReminder(psychologist.accessToken(), basicRequest(scheduledFor))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.channel").value("email"))
            .andExpect(jsonPath("$.status").value("agendado"))
            .andExpect(jsonPath("$.sentAt").doesNotExist())
            .andExpect(jsonPath("$.patientId").doesNotExist())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.createdAt").exists())
            .andReturn();
    Reminder created = objectMapper.readValue(result.getResponse().getContentAsString(), Reminder.class);
    assertThat(created.getScheduledFor()).isEqualTo(scheduledFor);

    List<Object> payloads =
        eventStore.readEvents(created.getId().toString()).asStream().<Object>map(DomainEventMessage::getPayload).toList();
    assertThat(payloads).hasSize(1);
    assertThat(payloads.get(0)).isInstanceOf(ReminderScheduledEvent.class);

    ReminderScheduledEvent event = (ReminderScheduledEvent) payloads.get(0);
    assertThat(event.reminderId()).isEqualTo(created.getId());
    assertThat(event.userId()).isEqualTo(psychologist.userId());
    assertThat(event.subject()).isEqualTo("Lembrete de pagamento");
    assertThat(event.scheduledFor()).isEqualTo(scheduledFor);
    assertThat(event.patientId()).isNull();
    assertThat(event.appointmentId()).isNull();
    assertThat(event.chargeId()).isNull();
  }

  @Test
  void create_withValidPatientLink_succeeds() throws Exception {
    AuthedUser psychologist = registerUser("Ana Vinculo", "ana.vinculo.lembretes@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Vinculado");

    ReminderCreateRequest request =
        basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(6)).patientId(patient.getId());

    MvcResult result =
        createReminder(psychologist.accessToken(), request)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.patientId").value(patient.getId().toString()))
            .andReturn();
    Reminder created = objectMapper.readValue(result.getResponse().getContentAsString(), Reminder.class);
    assertThat(created.getAppointmentId()).isNull();
    assertThat(created.getChargeId()).isNull();
  }

  @Test
  void create_withValidAppointmentAndChargeLinks_succeeds() throws Exception {
    AuthedUser psychologist = registerUser("Ana Vinculos", "ana.vinculos.lembretes@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Vinculos");
    Appointment appointment = createAppointment(psychologist.accessToken(), patient.getId());
    Charge charge = createCharge(psychologist.accessToken(), patient.getId());

    ReminderCreateRequest appointmentLinked =
        basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(3)).appointmentId(appointment.getId());
    createReminder(psychologist.accessToken(), appointmentLinked)
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.appointmentId").value(appointment.getId().toString()));

    ReminderCreateRequest chargeLinked =
        basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(4)).chargeId(charge.getId());
    createReminder(psychologist.accessToken(), chargeLinked)
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.chargeId").value(charge.getId().toString()));
  }

  @Test
  void create_withScheduledForInThePast_returns400() throws Exception {
    AuthedUser psychologist = registerUser("Ana Passado", "ana.passado.lembretes@exemplo.com.br");

    ReminderCreateRequest request = basicRequest(OffsetDateTime.now(ZoneOffset.UTC).minusHours(1));

    createReminder(psychologist.accessToken(), request)
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void create_withMultipleLinksSimultaneously_returns400() throws Exception {
    AuthedUser psychologist = registerUser("Ana Multiplos", "ana.multiplos.lembretes@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Multiplos");
    Appointment appointment = createAppointment(psychologist.accessToken(), patient.getId());

    ReminderCreateRequest request =
        basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2))
            .patientId(patient.getId())
            .appointmentId(appointment.getId());

    createReminder(psychologist.accessToken(), request)
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void create_withNonExistentPatientLink_returns404() throws Exception {
    AuthedUser psychologist = registerUser("Ana Inexistente", "ana.inexistente.lembretes@exemplo.com.br");

    ReminderCreateRequest request =
        basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2)).patientId(UUID.randomUUID());

    createReminder(psychologist.accessToken(), request)
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void create_withLinkOfAnotherTenant_returns404ForPatientAppointmentAndCharge() throws Exception {
    AuthedUser userA = registerUser("Ana Cross Lembretes", "ana.cross.lembretes@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Cross Lembretes", "beatriz.cross.lembretes@exemplo.com.br");
    Patient patientOfA = createPatient(userA.accessToken(), "Paciente da Ana Cross");
    Appointment appointmentOfA = createAppointment(userA.accessToken(), patientOfA.getId());
    Charge chargeOfA = createCharge(userA.accessToken(), patientOfA.getId());

    createReminder(
            userB.accessToken(),
            basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2)).patientId(patientOfA.getId()))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    createReminder(
            userB.accessToken(),
            basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2)).appointmentId(appointmentOfA.getId()))
        .andExpect(status().isNotFound());

    createReminder(
            userB.accessToken(),
            basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2)).chargeId(chargeOfA.getId()))
        .andExpect(status().isNotFound());
  }

  @Test
  void list_paginatedWithPatientAndStatusFilters() throws Exception {
    AuthedUser psychologist = registerUser("Ana Listagem Lembretes", "ana.listagem.lembretes@exemplo.com.br");
    Patient patientA = createPatient(psychologist.accessToken(), "Paciente Filtro A");
    Patient patientB = createPatient(psychologist.accessToken(), "Paciente Filtro B");

    Reminder reminderOfA =
        createReminderExpectingCreated(
            psychologist.accessToken(),
            basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(1)).patientId(patientA.getId()));
    createReminderExpectingCreated(
        psychologist.accessToken(),
        basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(2)).patientId(patientB.getId()));

    MvcResult filteredResult =
        mockMvc
            .perform(
                get("/reminders")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("patientId", patientA.getId().toString()))
            .andExpect(status().isOk())
            .andReturn();
    ReminderPage filtered = objectMapper.readValue(filteredResult.getResponse().getContentAsString(), ReminderPage.class);
    assertThat(filtered.getItems()).extracting(Reminder::getId).containsExactly(reminderOfA.getId());

    MvcResult statusResult =
        mockMvc
            .perform(
                get("/reminders")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("status", "agendado"))
            .andExpect(status().isOk())
            .andReturn();
    ReminderPage statusFiltered =
        objectMapper.readValue(statusResult.getResponse().getContentAsString(), ReminderPage.class);
    assertThat(statusFiltered.getItems()).hasSize(2);
    assertThat(statusFiltered.getItems()).allMatch(r -> r.getStatus().getValue().equals("agendado"));
  }

  @Test
  void tenantIsolation_userB_listingNeverLeaksUserA_reminders() throws Exception {
    AuthedUser userA = registerUser("Ana Tenant A Lembretes", "ana.tenant.a.lembretes@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Tenant B Lembretes", "beatriz.tenant.b.lembretes@exemplo.com.br");

    createReminderExpectingCreated(userA.accessToken(), basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(1)));
    Reminder reminderOfB =
        createReminderExpectingCreated(userB.accessToken(), basicRequest(OffsetDateTime.now(ZoneOffset.UTC).plusHours(1)));

    MvcResult listBResult =
        mockMvc
            .perform(get("/reminders").header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    ReminderPage listB = objectMapper.readValue(listBResult.getResponse().getContentAsString(), ReminderPage.class);
    assertThat(listB.getItems()).extracting(Reminder::getId).containsExactly(reminderOfB.getId());
  }

  @Test
  void reminderEndpoints_withoutToken_return401() throws Exception {
    mockMvc.perform(get("/reminders")).andExpect(status().isUnauthorized());
  }
}
