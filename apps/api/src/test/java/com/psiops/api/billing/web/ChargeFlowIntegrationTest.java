package com.psiops.api.billing.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.billing.domain.event.ChargeCreatedEvent;
import com.psiops.api.billing.domain.event.ChargeOverdueDetectedEvent;
import com.psiops.api.billing.domain.event.ChargePaymentRegisteredEvent;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.Charge;
import com.psiops.contracts.model.ChargePage;
import com.psiops.contracts.model.CreateChargeRequest;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.PaymentMethod;
import com.psiops.contracts.model.RegisterPaymentRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.SimpleInterestParams;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
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
 * módulo financeiro de mensalidades (PSI-026): geração idempotente das
 * mensalidades do mês (pulando pacientes arquivados), marcação de pagamento
 * e transição de status (inclusive de cobrança já atrasada), visão de
 * inadimplência com totais, publicação do evento {@code cobranca.atrasada}
 * via Axon (sem duplicar) e isolamento estrito por tenant.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class ChargeFlowIntegrationTest {

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

  private Patient createPatient(String token, String name, long monthlyFeeCents, int billingDay) throws Exception {
    PatientCreateRequest request = new PatientCreateRequest(name, monthlyFeeCents, billingDay);
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

  private void archivePatient(String token, UUID patientId) throws Exception {
    mockMvc
        .perform(delete("/patients/" + patientId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
        .andExpect(status().isNoContent());
  }

  private ResultActions createCharge(String token, CreateChargeRequest request) throws Exception {
    return mockMvc.perform(
        post("/charges")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));
  }

  private Charge createChargeExpectingCreated(String token, CreateChargeRequest request) throws Exception {
    MvcResult result = createCharge(token, request).andExpect(status().isCreated()).andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), Charge.class);
  }

  private GenerateChargesResponse generate(String token, String competence) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/charges/generate")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new GenerateChargesRequest(competence))))
            .andExpect(status().isOk())
            .andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), GenerateChargesResponse.class);
  }

  @Test
  void generate_isIdempotent_andSkipsArchivedPatients() throws Exception {
    AuthedUser psychologist = registerUser("Ana Geração", "ana.geracao@exemplo.com.br");
    Patient active = createPatient(psychologist.accessToken(), "Paciente Ativo", 15000L, 10);
    Patient toArchive = createPatient(psychologist.accessToken(), "Paciente Arquivado", 20000L, 5);
    archivePatient(psychologist.accessToken(), toArchive.getId());

    String competence = YearMonth.now(ZoneOffset.UTC).toString();

    GenerateChargesResponse first = generate(psychologist.accessToken(), competence);
    assertThat(first.created()).hasSize(1);
    assertThat(first.created().get(0).getPatientId()).isEqualTo(active.getId());
    assertThat(first.archivedSkipped()).isEqualTo(1);
    assertThat(first.alreadyExisted()).isZero();

    // Repetir a geração para a MESMA competência: idempotente, sem duplicar.
    GenerateChargesResponse second = generate(psychologist.accessToken(), competence);
    assertThat(second.created()).isEmpty();
    assertThat(second.alreadyExisted()).isEqualTo(1);
    assertThat(second.archivedSkipped()).isEqualTo(1);

    MvcResult listResult =
        mockMvc
            .perform(
                get("/charges")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("competence", competence))
            .andExpect(status().isOk())
            .andReturn();
    ChargePage page = objectMapper.readValue(listResult.getResponse().getContentAsString(), ChargePage.class);
    assertThat(page.getItems()).hasSize(1);
    assertThat(page.getItems().get(0).getPatientId()).isEqualTo(active.getId());
    assertThat(page.getMeta().getTotalElements()).isEqualTo(1L);
  }

  @Test
  void payment_transitionsStatusCorrectly_includingAlreadyOverdueCharge() throws Exception {
    AuthedUser psychologist = registerUser("Ana Pagamento", "ana.pagamento@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Pagamento", 15000L, 10);

    LocalDate overdueDueDate = LocalDate.now(ZoneOffset.UTC).minusDays(10);
    CreateChargeRequest createRequest =
        new CreateChargeRequest(patient.getId(), "2026-01", 15000L, overdueDueDate);
    Charge created = createChargeExpectingCreated(psychologist.accessToken(), createRequest);

    // A cobrança já nasce com vencimento no passado: a detecção de atraso
    // roda dentro da própria criação (ver ChargeService#create) e o GET
    // subsequente confirma o status já transicionado.
    mockMvc
        .perform(
            get("/charges/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("atrasada"));

    RegisterPaymentRequest paymentRequest =
        new RegisterPaymentRequest(15000L, OffsetDateTime.now(ZoneOffset.UTC), PaymentMethod.PIX);
    mockMvc
        .perform(
            post("/charges/" + created.getId() + "/payment")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(paymentRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("em_dia"))
        .andExpect(jsonPath("$.payment.paidAmount").value(15000))
        .andExpect(jsonPath("$.payment.method").value("pix"));

    // Pagar de novo: 409, cobrança já paga.
    mockMvc
        .perform(
            post("/charges/" + created.getId() + "/payment")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(paymentRequest)))
        .andExpect(status().isConflict())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void delinquency_listsOverdueChargesWithCorrectedTotals() throws Exception {
    AuthedUser psychologist = registerUser("Ana Inadimplência", "ana.inadimplencia@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Inadimplente", 15000L, 10);

    LocalDate dueDate = LocalDate.now(ZoneOffset.UTC).minusDays(30);
    CreateChargeRequest request =
        new CreateChargeRequest(patient.getId(), "2026-02", 15000L, dueDate)
            .interest(new SimpleInterestParams(2.0, 0.0));
    createChargeExpectingCreated(psychologist.accessToken(), request);

    MvcResult result =
        mockMvc
            .perform(
                get("/charges/delinquency")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    DelinquencySummary summary =
        objectMapper.readValue(result.getResponse().getContentAsString(), DelinquencySummary.class);

    assertThat(summary.count()).isEqualTo(1);
    assertThat(summary.totalAmountCents()).isEqualTo(15000L);
    // 15000 * 2% * (30/30 mês) = 300 centavos de juros.
    assertThat(summary.totalInterestCents()).isEqualTo(300L);
    assertThat(summary.totalCorrectedAmountCents()).isEqualTo(15300L);
    assertThat(summary.items()).hasSize(1);
    assertThat(summary.items().get(0).daysLate()).isEqualTo(30L);
    assertThat(summary.items().get(0).interestCents()).isEqualTo(300L);
    assertThat(summary.items().get(0).correctedAmountCents()).isEqualTo(15300L);
  }

  @Test
  void axonEvent_chargeOverdueDetected_publishedOnceEvenAfterRepeatedReads() throws Exception {
    AuthedUser psychologist = registerUser("Ana Eventos", "ana.eventos.billing@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Eventos", 15000L, 10);

    LocalDate dueDate = LocalDate.now(ZoneOffset.UTC).minusDays(5);
    CreateChargeRequest request = new CreateChargeRequest(patient.getId(), "2026-03", 15000L, dueDate);
    Charge created = createChargeExpectingCreated(psychologist.accessToken(), request);

    // Repetidas leituras (GET e listagem) não devem publicar o evento de
    // atraso mais de uma vez para a mesma cobrança.
    for (int i = 0; i < 3; i++) {
      mockMvc
          .perform(
              get("/charges/" + created.getId())
                  .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
          .andExpect(status().isOk());
    }
    mockMvc
        .perform(get("/charges").header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk());

    List<Object> payloads =
        eventStore.readEvents(created.getId().toString()).asStream().<Object>map(DomainEventMessage::getPayload).toList();

    assertThat(payloads).hasSize(2);
    assertThat(payloads.get(0)).isInstanceOf(ChargeCreatedEvent.class);
    assertThat(payloads.get(1)).isInstanceOf(ChargeOverdueDetectedEvent.class);

    ChargeOverdueDetectedEvent overdueEvent = (ChargeOverdueDetectedEvent) payloads.get(1);
    assertThat(overdueEvent.chargeId()).isEqualTo(created.getId());
    assertThat(overdueEvent.userId()).isEqualTo(psychologist.userId());
    assertThat(overdueEvent.patientId()).isEqualTo(patient.getId());

    // Registrar o pagamento acrescenta um terceiro evento, mas nunca um
    // segundo ChargeOverdueDetectedEvent.
    RegisterPaymentRequest paymentRequest =
        new RegisterPaymentRequest(15000L, OffsetDateTime.now(ZoneOffset.UTC), PaymentMethod.PIX);
    mockMvc
        .perform(
            post("/charges/" + created.getId() + "/payment")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(paymentRequest)))
        .andExpect(status().isOk());

    List<Object> payloadsAfterPayment =
        eventStore.readEvents(created.getId().toString()).asStream().<Object>map(DomainEventMessage::getPayload).toList();
    assertThat(payloadsAfterPayment).hasSize(3);
    assertThat(payloadsAfterPayment.get(2)).isInstanceOf(ChargePaymentRegisteredEvent.class);
    assertThat(payloadsAfterPayment.stream().filter(p -> p instanceof ChargeOverdueDetectedEvent).count())
        .isEqualTo(1L);
  }

  @Test
  void create_duplicateForSamePatientAndCompetence_returns409() throws Exception {
    AuthedUser psychologist = registerUser("Ana Duplicidade", "ana.duplicidade@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente Duplicidade", 15000L, 10);

    CreateChargeRequest request =
        new CreateChargeRequest(patient.getId(), "2026-04", 15000L, LocalDate.now(ZoneOffset.UTC).plusDays(10));
    createChargeExpectingCreated(psychologist.accessToken(), request);

    createCharge(psychologist.accessToken(), request)
        .andExpect(status().isConflict())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void create_forArchivedPatient_returns400() throws Exception {
    AuthedUser psychologist = registerUser("Ana Arquivado", "ana.arquivado.billing@exemplo.com.br");
    Patient patient = createPatient(psychologist.accessToken(), "Paciente a Arquivar", 15000L, 10);
    archivePatient(psychologist.accessToken(), patient.getId());

    CreateChargeRequest request =
        new CreateChargeRequest(patient.getId(), "2026-05", 15000L, LocalDate.now(ZoneOffset.UTC).plusDays(10));
    createCharge(psychologist.accessToken(), request)
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void tenantIsolation_userB_cannotReadOrPayUserA_charges() throws Exception {
    AuthedUser userA = registerUser("Ana Tenant A", "ana.tenant.a.billing@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Tenant B", "beatriz.tenant.b.billing@exemplo.com.br");
    Patient patientOfA = createPatient(userA.accessToken(), "Paciente da Ana", 15000L, 10);
    Patient patientOfB = createPatient(userB.accessToken(), "Paciente da Beatriz", 18000L, 12);

    CreateChargeRequest requestA =
        new CreateChargeRequest(patientOfA.getId(), "2026-06", 15000L, LocalDate.now(ZoneOffset.UTC).plusDays(10));
    Charge chargeOfA = createChargeExpectingCreated(userA.accessToken(), requestA);

    CreateChargeRequest requestB =
        new CreateChargeRequest(patientOfB.getId(), "2026-06", 18000L, LocalDate.now(ZoneOffset.UTC).plusDays(10));
    Charge chargeOfB = createChargeExpectingCreated(userB.accessToken(), requestB);

    // B tentando ler a cobrança de A: 404, nunca 403.
    mockMvc
        .perform(get("/charges/" + chargeOfA.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // B tentando pagar a cobrança de A: 404.
    RegisterPaymentRequest maliciousPayment =
        new RegisterPaymentRequest(15000L, OffsetDateTime.now(ZoneOffset.UTC), PaymentMethod.PIX);
    mockMvc
        .perform(
            post("/charges/" + chargeOfA.getId() + "/payment")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(maliciousPayment)))
        .andExpect(status().isNotFound());

    // Listagem de B nunca vaza a cobrança de A — só a própria, nunca 403.
    MvcResult listBResult =
        mockMvc
            .perform(get("/charges").header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    ChargePage listB = objectMapper.readValue(listBResult.getResponse().getContentAsString(), ChargePage.class);
    assertThat(listB.getItems()).extracting(Charge::getId).containsExactly(chargeOfB.getId());

    // Inadimplência de B nunca inclui cobrança de A.
    MvcResult delinquencyBResult =
        mockMvc
            .perform(get("/charges/delinquency").header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    DelinquencySummary delinquencyB =
        objectMapper.readValue(delinquencyBResult.getResponse().getContentAsString(), DelinquencySummary.class);
    assertThat(delinquencyB.items()).noneMatch(item -> item.charge().getId().equals(chargeOfA.getId()));

    // A ainda enxerga a própria cobrança normalmente.
    mockMvc
        .perform(get("/charges/" + chargeOfA.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + userA.accessToken()))
        .andExpect(status().isOk());
  }

  @Test
  void chargeEndpoints_withoutToken_return401() throws Exception {
    mockMvc.perform(get("/charges")).andExpect(status().isUnauthorized());
  }
}
