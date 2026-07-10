package com.psiops.api.sessionrecord.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.Appointment;
import com.psiops.contracts.model.AppointmentCreateRequest;
import com.psiops.contracts.model.AttendanceRecord;
import com.psiops.contracts.model.AttendanceStatus;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.RegisterRequest;
import java.time.DayOfWeek;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;
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
 * módulo de registros administrativos de consulta (PSI-025): criação
 * vinculada a uma consulta do próprio tenant, upsert (um registro por
 * consulta), rejeição de vínculo com consulta inexistente/de outra usuária
 * (404), histórico paginado por paciente na ordem correta (consulta mais
 * recente primeiro), ausência de efeito colateral na agenda e isolamento
 * multi-tenant estrito (404/lista vazia, nunca 403).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class SessionRecordFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

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

  private OffsetDateTime nextMonday10am() {
    return OffsetDateTime.now(ZoneOffset.UTC)
        .plusDays(1)
        .with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY))
        .withHour(10)
        .withMinute(0)
        .withSecond(0)
        .withNano(0);
  }

  private Appointment createAppointment(
      String token, UUID patientId, OffsetDateTime startsAt, int durationMinutes) throws Exception {
    AppointmentCreateRequest request = new AppointmentCreateRequest(patientId, startsAt, durationMinutes);
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

  private org.springframework.test.web.servlet.ResultActions putAttendance(
      String token, UUID appointmentId, AttendanceRecord request) throws Exception {
    return mockMvc.perform(
        put("/appointments/" + appointmentId + "/attendance")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));
  }

  private SessionRecordPage getHistory(String token, UUID patientId, Integer page, Integer size)
      throws Exception {
    var requestBuilder =
        get("/patients/" + patientId + "/session-records")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    if (page != null) {
      requestBuilder = requestBuilder.param("page", page.toString());
    }
    if (size != null) {
      requestBuilder = requestBuilder.param("size", size.toString());
    }
    MvcResult result = mockMvc.perform(requestBuilder).andExpect(status().isOk()).andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), SessionRecordPage.class);
  }

  @Test
  void recordAttendance_createsRecord_andHistoryReflectsIt_withoutChangingAppointmentStatus() throws Exception {
    AuthedUser psychologist = registerUser("Ana Registro", "ana.registro@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Marina Alves");
    Appointment appointment =
        createAppointment(psychologist.accessToken(), patient.getId(), nextMonday10am(), 50);

    AttendanceRecord request =
        new AttendanceRecord(AttendanceStatus.COMPARECEU).administrativeNotes("pediu recibo");

    MvcResult result =
        putAttendance(psychologist.accessToken(), appointment.getId(), request)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(appointment.getId().toString()))
            // Out of scope (manifesto PSI-025): registrar presença não muda o
            // status da consulta na agenda.
            .andExpect(jsonPath("$.status").value("agendada"))
            .andReturn();
    Appointment returned =
        objectMapper.readValue(result.getResponse().getContentAsString(), Appointment.class);
    assertThat(returned.getPatientId()).isEqualTo(patient.getId());

    SessionRecordPage history = getHistory(psychologist.accessToken(), patient.getId(), null, null);
    assertThat(history.items()).hasSize(1);
    SessionRecordHistoryItem item = history.items().get(0);
    assertThat(item.appointmentId()).isEqualTo(appointment.getId());
    assertThat(item.record().getAttendance()).isEqualTo(AttendanceStatus.COMPARECEU);
    assertThat(item.record().getAdministrativeNotes()).isEqualTo("pediu recibo");
    assertThat(history.meta().getTotalElements()).isEqualTo(1L);
  }

  @Test
  void recordAttendance_calledTwiceForSameAppointment_upsertsInsteadOfDuplicating() throws Exception {
    AuthedUser psychologist = registerUser("Ana Upsert", "ana.upsert@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Upsert");
    Appointment appointment =
        createAppointment(psychologist.accessToken(), patient.getId(), nextMonday10am(), 50);

    putAttendance(
            psychologist.accessToken(),
            appointment.getId(),
            new AttendanceRecord(AttendanceStatus.COMPARECEU).administrativeNotes("primeira nota"))
        .andExpect(status().isOk());

    putAttendance(
            psychologist.accessToken(),
            appointment.getId(),
            new AttendanceRecord(AttendanceStatus.FALTOU).administrativeNotes("faltou sem aviso"))
        .andExpect(status().isOk());

    SessionRecordPage history = getHistory(psychologist.accessToken(), patient.getId(), null, null);
    assertThat(history.items()).hasSize(1);
    assertThat(history.items().get(0).record().getAttendance()).isEqualTo(AttendanceStatus.FALTOU);
    assertThat(history.items().get(0).record().getAdministrativeNotes()).isEqualTo("faltou sem aviso");
  }

  @Test
  void recordAttendance_withNonexistentAppointment_returns404() throws Exception {
    AuthedUser psychologist = registerUser("Ana Inexistente", "ana.inexistente@exemplo.com.br");
    AttendanceRecord request = new AttendanceRecord(AttendanceStatus.COMPARECEU);

    putAttendance(psychologist.accessToken(), UUID.randomUUID(), request)
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void recordAttendance_withAppointmentOfAnotherTenant_returns404() throws Exception {
    AuthedUser userA = registerUser("Ana Cross Registro", "ana.cross.registro@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Cross Registro", "beatriz.cross.registro@exemplo.com.br");
    Patient patientOfA = createPatient(userA.accessToken(), "Paciente da Ana");
    Appointment appointmentOfA =
        createAppointment(userA.accessToken(), patientOfA.getId(), nextMonday10am(), 50);

    AttendanceRecord request = new AttendanceRecord(AttendanceStatus.COMPARECEU);
    putAttendance(userB.accessToken(), appointmentOfA.getId(), request)
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // Confirma que o registro de A não foi afetado pela tentativa de B.
    SessionRecordPage historyOfA = getHistory(userA.accessToken(), patientOfA.getId(), null, null);
    assertThat(historyOfA.items()).isEmpty();
  }

  @Test
  void recordAttendance_withMissingAttendance_returns400() throws Exception {
    AuthedUser psychologist = registerUser("Ana Validacao Registro", "ana.validacao.registro@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Validacao");
    Appointment appointment =
        createAppointment(psychologist.accessToken(), patient.getId(), nextMonday10am(), 50);

    mockMvc
        .perform(
            put("/appointments/" + appointment.getId() + "/attendance")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.violations").isArray());
  }

  @Test
  void history_isPaginatedAndOrderedFromMostRecentConsultationToOldest() throws Exception {
    AuthedUser psychologist = registerUser("Ana Historico", "ana.historico@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Historico");

    OffsetDateTime base = nextMonday10am();
    Appointment oldest = createAppointment(psychologist.accessToken(), patient.getId(), base, 50);
    Appointment middle =
        createAppointment(psychologist.accessToken(), patient.getId(), base.plusDays(1), 50);
    Appointment newest =
        createAppointment(psychologist.accessToken(), patient.getId(), base.plusDays(2), 50);

    for (Appointment appointment : new Appointment[] {oldest, middle, newest}) {
      putAttendance(
              psychologist.accessToken(),
              appointment.getId(),
              new AttendanceRecord(AttendanceStatus.COMPARECEU))
          .andExpect(status().isOk());
    }

    SessionRecordPage firstPage = getHistory(psychologist.accessToken(), patient.getId(), 0, 2);
    assertThat(firstPage.items()).extracting(SessionRecordHistoryItem::appointmentId)
        .containsExactly(newest.getId(), middle.getId());
    assertThat(firstPage.meta().getTotalElements()).isEqualTo(3L);
    assertThat(firstPage.meta().getTotalPages()).isEqualTo(2);

    SessionRecordPage secondPage = getHistory(psychologist.accessToken(), patient.getId(), 1, 2);
    assertThat(secondPage.items()).extracting(SessionRecordHistoryItem::appointmentId)
        .containsExactly(oldest.getId());
  }

  @Test
  void history_forPatientWithNoRecords_returnsEmptyPage() throws Exception {
    AuthedUser psychologist = registerUser("Ana Sem Registro", "ana.semregistro@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Sem Registro");

    SessionRecordPage history = getHistory(psychologist.accessToken(), patient.getId(), null, null);
    assertThat(history.items()).isEmpty();
    assertThat(history.meta().getTotalElements()).isEqualTo(0L);
  }

  @Test
  void history_withNonexistentPatient_returns404() throws Exception {
    AuthedUser psychologist = registerUser("Ana Paciente Inexistente", "ana.pacienteinexistente@exemplo.com.br");

    mockMvc
        .perform(
            get("/patients/" + UUID.randomUUID() + "/session-records")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void history_withPatientOfAnotherTenant_returns404_neverLeaksData() throws Exception {
    AuthedUser userA = registerUser("Ana Cross Historico", "ana.cross.historico@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Cross Historico", "beatriz.cross.historico@exemplo.com.br");
    Patient patientOfA = createPatient(userA.accessToken(), "Paciente da Ana Historico");
    Appointment appointmentOfA =
        createAppointment(userA.accessToken(), patientOfA.getId(), nextMonday10am(), 50);
    putAttendance(
            userA.accessToken(), appointmentOfA.getId(), new AttendanceRecord(AttendanceStatus.COMPARECEU))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            get("/patients/" + patientOfA.getId() + "/session-records")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void sessionRecordEndpoints_withoutToken_return401() throws Exception {
    mockMvc.perform(get("/patients/" + UUID.randomUUID() + "/session-records")).andExpect(status().isUnauthorized());
    mockMvc
        .perform(
            put("/appointments/" + UUID.randomUUID() + "/attendance")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"attendance\":\"compareceu\"}"))
        .andExpect(status().isUnauthorized());
  }
}
