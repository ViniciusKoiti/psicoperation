package com.psiops.api.appointment.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.appointment.application.AppointmentService;
import com.psiops.api.appointment.domain.event.AppointmentCancelledEvent;
import com.psiops.api.appointment.domain.event.AppointmentCreatedEvent;
import com.psiops.api.appointment.domain.event.AppointmentRescheduledEvent;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AppointmentCreateRequest;
import com.psiops.contracts.model.AppointmentPage;
import com.psiops.contracts.model.AppointmentUpdateRequest;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.WeeklyRecurrence;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
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

/**
 * Cobertura ponta a ponta (MockMvc + Testcontainers, PostgreSQL real) do
 * módulo de agenda (PSI-024): CRUD feliz, detecção de conflito de horário
 * (sobreposição total, parcial e de borda), consultas canceladas/remarcadas
 * liberando o horário, recorrência semanal materializada (com e sem {@code
 * until}), listagem por intervalo de datas, remarcação, isolamento estrito
 * por tenant e publicação dos eventos de domínio via Axon (verificada
 * diretamente no event store, no espírito de {@code SampleTaskFlowIntegrationTest}).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class AppointmentFlowIntegrationTest {

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
                    .content(
                        objectMapper.writeValueAsString(
                            new RegisterRequest(name, email, "SenhaForte123!"))))
            .andExpect(status().isCreated())
            .andReturn();
    AuthResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
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

  /** Próxima segunda-feira às 10h UTC a partir de agora — âncora determinística para os testes de recorrência. */
  private OffsetDateTime nextMonday10am() {
    return OffsetDateTime.now(ZoneOffset.UTC)
        .plusDays(1)
        .with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY))
        .withHour(10)
        .withMinute(0)
        .withSecond(0)
        .withNano(0);
  }

  private org.springframework.test.web.servlet.ResultActions createAppointment(
      String token, AppointmentCreateRequest request) throws Exception {
    return mockMvc.perform(
        post("/appointments")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));
  }

  private Appointment createAppointmentExpectingCreated(
      String token, UUID patientId, OffsetDateTime startsAt, int durationMinutes) throws Exception {
    AppointmentCreateRequest request = new AppointmentCreateRequest(patientId, startsAt, durationMinutes);
    MvcResult result = createAppointment(token, request).andExpect(status().isCreated()).andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), Appointment.class);
  }

  @Test
  void crudHappyFlow_createGetUpdateAndCancel() throws Exception {
    AuthedUser psychologist = registerUser("Ana Agenda", "ana.agenda@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Marina Alves");

    OffsetDateTime startsAt = nextMonday10am();
    AppointmentCreateRequest createRequest = new AppointmentCreateRequest(patient.getId(), startsAt, 50);

    MvcResult createResult =
        createAppointment(psychologist.accessToken(), createRequest)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.patientId").value(patient.getId().toString()))
            .andExpect(jsonPath("$.durationMinutes").value(50))
            .andExpect(jsonPath("$.status").value("agendada"))
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.createdAt").exists())
            .andReturn();
    Appointment created =
        objectMapper.readValue(createResult.getResponse().getContentAsString(), Appointment.class);

    mockMvc
        .perform(
            get("/appointments/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.durationMinutes").value(50));

    AppointmentUpdateRequest updateRequest = new AppointmentUpdateRequest().durationMinutes(80);
    mockMvc
        .perform(
            put("/appointments/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.durationMinutes").value(80))
        .andExpect(jsonPath("$.status").value("agendada"));

    mockMvc
        .perform(
            delete("/appointments/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(
            get("/appointments/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("cancelada"));
  }

  @Test
  void create_withInvalidPayload_returns400WithFieldViolations() throws Exception {
    AuthedUser psychologist = registerUser("Ana Validação", "ana.validacao.agenda@exemplo.com.br");

    // durationMinutes fora do intervalo permitido (1-480) e patientId ausente.
    String invalidPayload = "{\"durationMinutes\":0}";

    mockMvc
        .perform(
            post("/appointments")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.violations").isArray());
  }

  @Test
  void create_withPatientOfAnotherTenant_returns400() throws Exception {
    AuthedUser userA = registerUser("Ana Cross", "ana.cross.agenda@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Cross", "beatriz.cross.agenda@exemplo.com.br");
    Patient patientOfA = createPatient(userA.accessToken(), "Paciente da Ana");

    AppointmentCreateRequest request =
        new AppointmentCreateRequest(patientOfA.getId(), nextMonday10am(), 50);

    mockMvc
        .perform(
            post("/appointments")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void conflictDetection_fullPartialOverlapReturn409_edgeTouchingDoesNot() throws Exception {
    AuthedUser psychologist = registerUser("Ana Conflito", "ana.conflito@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Conflito");

    OffsetDateTime start = nextMonday10am(); // 10:00 - 11:00 (60min)
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), start, 60);

    // Sobreposição total (mesmo horário exato).
    createAppointment(
            psychologist.accessToken(), new AppointmentCreateRequest(patient.getId(), start, 60))
        .andExpect(status().isConflict())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // Sobreposição parcial: começa no meio (10:30) e vai até 11:30.
    createAppointment(
            psychologist.accessToken(),
            new AppointmentCreateRequest(patient.getId(), start.plusMinutes(30), 60))
        .andExpect(status().isConflict())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // Borda: termina exatamente quando a primeira começa (09:00-10:00) — NÃO conflita.
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), start.minusHours(1), 60);

    // Borda: começa exatamente quando a primeira termina (11:00-12:00) — NÃO conflita.
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), start.plusHours(1), 60);
  }

  @Test
  void cancelledAppointment_freesSlotForNewBooking() throws Exception {
    AuthedUser psychologist = registerUser("Ana Libera", "ana.libera@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Libera");

    OffsetDateTime start = nextMonday10am();
    Appointment first = createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), start, 60);

    mockMvc
        .perform(
            delete("/appointments/" + first.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNoContent());

    // Mesmo horário, agora livre porque a primeira foi cancelada.
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), start, 60);
  }

  @Test
  void rescheduleChecksConflictAndFreesOldSlot() throws Exception {
    AuthedUser psychologist = registerUser("Ana Remarca", "ana.remarca@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Remarca");

    OffsetDateTime slotA = nextMonday10am();
    OffsetDateTime slotB = slotA.plusHours(2);
    OffsetDateTime slotC = slotA.plusHours(4);

    Appointment appointmentA = createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), slotA, 60);
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), slotB, 60);

    // Remarcar A para o horário de B: conflito, 409, A permanece em slotA.
    AppointmentUpdateRequest conflictingReschedule = new AppointmentUpdateRequest().startsAt(slotB);
    mockMvc
        .perform(
            put("/appointments/" + appointmentA.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(conflictingReschedule)))
        .andExpect(status().isConflict())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    MvcResult unchangedResult =
        mockMvc
            .perform(
                get("/appointments/" + appointmentA.getId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    Appointment unchanged =
        objectMapper.readValue(unchangedResult.getResponse().getContentAsString(), Appointment.class);
    assertThat(unchanged.getStartsAt()).isEqualTo(slotA);

    // Remarcar A para um horário livre (slotC): sucesso.
    AppointmentUpdateRequest okReschedule = new AppointmentUpdateRequest().startsAt(slotC);
    MvcResult rescheduledResult =
        mockMvc
            .perform(
                put("/appointments/" + appointmentA.getId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(okReschedule)))
            .andExpect(status().isOk())
            .andReturn();
    Appointment rescheduled =
        objectMapper.readValue(rescheduledResult.getResponse().getContentAsString(), Appointment.class);
    assertThat(rescheduled.getStartsAt()).isEqualTo(slotC);

    // slotA agora está livre (A se mudou) — nova consulta ali deve funcionar.
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), slotA, 60);
  }

  @Test
  void recurrence_materializesOccurrencesUntilExplicitDate() throws Exception {
    AuthedUser psychologist = registerUser("Ana Recorrencia", "ana.recorrencia@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Recorrente");

    OffsetDateTime firstMonday = nextMonday10am();
    WeeklyRecurrence recurrence =
        new WeeklyRecurrence(WeeklyRecurrence.WeekdayEnum.SEGUNDA)
            .interval(1)
            .until(firstMonday.toLocalDate().plusWeeks(3)); // 4 ocorrências: semanas 0,1,2,3

    AppointmentCreateRequest request =
        new AppointmentCreateRequest(patient.getId(), firstMonday, 50).recurrence(recurrence);
    MvcResult result = createAppointment(psychologist.accessToken(), request).andExpect(status().isCreated()).andReturn();
    Appointment firstOccurrence =
        objectMapper.readValue(result.getResponse().getContentAsString(), Appointment.class);
    assertThat(firstOccurrence.getStartsAt()).isEqualTo(firstMonday);
    assertThat(firstOccurrence.getRecurrence()).isNotNull();
    assertThat(firstOccurrence.getRecurrence().getWeekday()).isEqualTo(WeeklyRecurrence.WeekdayEnum.SEGUNDA);

    MvcResult listResult =
        mockMvc
            .perform(
                get("/appointments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("from", firstMonday.toLocalDate().minusDays(1).toString())
                    .param("to", firstMonday.toLocalDate().plusWeeks(10).toString())
                    .param("size", "50"))
            .andExpect(status().isOk())
            .andReturn();
    AppointmentPage page =
        objectMapper.readValue(listResult.getResponse().getContentAsString(), AppointmentPage.class);

    assertThat(page.getItems()).hasSize(4);
    assertThat(page.getItems())
        .extracting(Appointment::getStartsAt)
        .containsExactly(
            firstMonday, firstMonday.plusWeeks(1), firstMonday.plusWeeks(2), firstMonday.plusWeeks(3));
    assertThat(page.getItems()).allMatch(a -> a.getStatus().getValue().equals("agendada"));
    assertThat(page.getItems()).extracting(Appointment::getPatientId).containsOnly(patient.getId());
  }

  @Test
  void recurrence_withoutUntil_isCappedAtFixedHorizon() throws Exception {
    AuthedUser psychologist = registerUser("Ana Horizonte", "ana.horizonte@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Horizonte");

    OffsetDateTime firstMonday = nextMonday10am();
    WeeklyRecurrence recurrence = new WeeklyRecurrence(WeeklyRecurrence.WeekdayEnum.SEGUNDA).interval(1);

    AppointmentCreateRequest request =
        new AppointmentCreateRequest(patient.getId(), firstMonday, 50).recurrence(recurrence);
    createAppointment(psychologist.accessToken(), request).andExpect(status().isCreated());

    MvcResult listResult =
        mockMvc
            .perform(
                get("/appointments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("from", firstMonday.toLocalDate().minusDays(1).toString())
                    .param("to", firstMonday.toLocalDate().plusWeeks(30).toString())
                    .param("size", "100"))
            .andExpect(status().isOk())
            .andReturn();
    AppointmentPage page =
        objectMapper.readValue(listResult.getResponse().getContentAsString(), AppointmentPage.class);

    // Horizonte fixo documentado na assumption do manifesto PSI-024: 12
    // semanas a partir da primeira ocorrência (ver AppointmentService.RECURRENCE_HORIZON_WEEKS).
    assertThat(page.getItems()).hasSize(AppointmentService.RECURRENCE_HORIZON_WEEKS + 1);
  }

  @Test
  void create_withRecurrenceWeekdayMismatch_returns400() throws Exception {
    AuthedUser psychologist = registerUser("Ana Weekday", "ana.weekday@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Weekday");

    OffsetDateTime firstMonday = nextMonday10am();
    WeeklyRecurrence wrongWeekday = new WeeklyRecurrence(WeeklyRecurrence.WeekdayEnum.TERCA);
    AppointmentCreateRequest request =
        new AppointmentCreateRequest(patient.getId(), firstMonday, 50).recurrence(wrongWeekday);

    createAppointment(psychologist.accessToken(), request)
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void listingByDateRange_boundariesAreInclusive() throws Exception {
    AuthedUser psychologist = registerUser("Ana Listagem", "ana.listagem.agenda@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Listagem");

    OffsetDateTime day1 = nextMonday10am();
    OffsetDateTime day2 = day1.plusDays(1);
    OffsetDateTime day3 = day1.plusDays(2);

    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), day1, 30);
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), day2, 30);
    createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), day3, 30);

    // from == to == day1: só a consulta do dia 1 (borda inclusiva).
    MvcResult day1Result =
        mockMvc
            .perform(
                get("/appointments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("from", day1.toLocalDate().toString())
                    .param("to", day1.toLocalDate().toString()))
            .andExpect(status().isOk())
            .andReturn();
    AppointmentPage day1Page =
        objectMapper.readValue(day1Result.getResponse().getContentAsString(), AppointmentPage.class);
    assertThat(day1Page.getItems()).extracting(Appointment::getStartsAt).containsExactly(day1);

    // from=day2 to=day3: as duas últimas, ambas incluídas.
    MvcResult rangeResult =
        mockMvc
            .perform(
                get("/appointments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("from", day2.toLocalDate().toString())
                    .param("to", day3.toLocalDate().toString()))
            .andExpect(status().isOk())
            .andReturn();
    AppointmentPage rangePage =
        objectMapper.readValue(rangeResult.getResponse().getContentAsString(), AppointmentPage.class);
    assertThat(rangePage.getItems()).extracting(Appointment::getStartsAt).containsExactly(day2, day3);
  }

  @Test
  void tenantIsolation_userB_cannotReadUpdateOrCancelUserA_appointments() throws Exception {
    AuthedUser userA = registerUser("Ana Tenant A", "ana.tenant.a.agenda@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Tenant B", "beatriz.tenant.b.agenda@exemplo.com.br");
    Patient patientOfA = createPatient(userA.accessToken(), "Paciente da Ana");
    Patient patientOfB = createPatient(userB.accessToken(), "Paciente da Beatriz");

    Appointment appointmentOfA =
        createAppointmentExpectingCreated(userA.accessToken(), patientOfA.getId(), nextMonday10am(), 50);
    Appointment appointmentOfB =
        createAppointmentExpectingCreated(userB.accessToken(), patientOfB.getId(), nextMonday10am().plusHours(3), 50);

    // B tentando ler a consulta de A: 404, nunca 403.
    mockMvc
        .perform(
            get("/appointments/" + appointmentOfA.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // B tentando remarcar a consulta de A: 404, dado de A não muda.
    AppointmentUpdateRequest maliciousUpdate = new AppointmentUpdateRequest().durationMinutes(40);
    mockMvc
        .perform(
            put("/appointments/" + appointmentOfA.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(maliciousUpdate)))
        .andExpect(status().isNotFound());

    // B tentando cancelar a consulta de A: 404, status de A não muda.
    mockMvc
        .perform(
            delete("/appointments/" + appointmentOfA.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isNotFound());

    mockMvc
        .perform(
            get("/appointments/" + appointmentOfA.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userA.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("agendada"));

    // Listagem de B nunca vaza a consulta de A — só a própria, nunca 403.
    MvcResult listBResult =
        mockMvc
            .perform(
                get("/appointments")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    AppointmentPage listB =
        objectMapper.readValue(listBResult.getResponse().getContentAsString(), AppointmentPage.class);
    assertThat(listB.getItems()).extracting(Appointment::getId).containsExactly(appointmentOfB.getId());
  }

  @Test
  void appointmentEndpoints_withoutToken_return401() throws Exception {
    mockMvc.perform(get("/appointments")).andExpect(status().isUnauthorized());
  }

  @Test
  void axonDomainEvents_createdRescheduledAndCancelled_arePublishedToEventStore() throws Exception {
    AuthedUser psychologist = registerUser("Ana Eventos", "ana.eventos.agenda@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Eventos");

    OffsetDateTime start = nextMonday10am();
    Appointment created = createAppointmentExpectingCreated(psychologist.accessToken(), patient.getId(), start, 50);

    AppointmentUpdateRequest reschedule = new AppointmentUpdateRequest().startsAt(start.plusHours(5));
    mockMvc
        .perform(
            put("/appointments/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reschedule)))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            delete("/appointments/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNoContent());

    List<Object> payloads =
        eventStore
            .readEvents(created.getId().toString())
            .asStream()
            .<Object>map(DomainEventMessage::getPayload)
            .toList();

    assertThat(payloads).hasSize(3);
    assertThat(payloads.get(0)).isInstanceOf(AppointmentCreatedEvent.class);
    assertThat(payloads.get(1)).isInstanceOf(AppointmentRescheduledEvent.class);
    assertThat(payloads.get(2)).isInstanceOf(AppointmentCancelledEvent.class);

    AppointmentCreatedEvent createdEvent = (AppointmentCreatedEvent) payloads.get(0);
    assertThat(createdEvent.userId()).isEqualTo(psychologist.userId());
    assertThat(createdEvent.patientId()).isEqualTo(patient.getId());

    AppointmentRescheduledEvent rescheduledEvent = (AppointmentRescheduledEvent) payloads.get(1);
    assertThat(rescheduledEvent.newStartsAt()).isEqualTo(start.plusHours(5));

    AppointmentCancelledEvent cancelledEvent = (AppointmentCancelledEvent) payloads.get(2);
    assertThat(cancelledEvent.resultingStatus().name()).isEqualTo("CANCELADA");
  }
}
