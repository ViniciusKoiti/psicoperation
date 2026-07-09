package com.psiops.api.patient.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.Patient;
import com.psiops.contracts.model.PatientCreateRequest;
import com.psiops.contracts.model.PatientPage;
import com.psiops.contracts.model.PatientUpdateRequest;
import com.psiops.contracts.model.RegisterRequest;
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
 * módulo de pacientes (PSI-023): CRUD feliz, paginação, busca por nome,
 * arquivamento (some da listagem padrão, mas continua acessível) e, acima de
 * tudo, o isolamento estrito por tenant — a usuária B nunca enxerga, altera
 * ou arquiva um paciente da usuária A, e a resposta é sempre 404 (por id) ou
 * lista vazia (em listagens), nunca 403, para não vazar a existência do
 * recurso de outro tenant.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class PatientFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  private record AuthedUser(UUID userId, String accessToken) {
  }

  private AuthedUser registerUser(String name, String email) throws Exception {
    MvcResult result = mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new RegisterRequest(name, email, "SenhaForte123!"))))
        .andExpect(status().isCreated())
        .andReturn();
    AuthResponse response =
        objectMapper.readValue(result.getResponse().getContentAsString(), AuthResponse.class);
    return new AuthedUser(response.getUser().getId(), response.getTokens().getAccessToken());
  }

  private MvcResult createPatient(String token, PatientCreateRequest request) throws Exception {
    return mockMvc.perform(post("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andReturn();
  }

  private Patient createPatientAndParse(String token, String name, long monthlyFeeCents, int billingDay)
      throws Exception {
    PatientCreateRequest request =
        new PatientCreateRequest(name, monthlyFeeCents, billingDay).notes(null);
    MvcResult result = createPatient(token, request);
    return objectMapper.readValue(result.getResponse().getContentAsString(), Patient.class);
  }

  @Test
  void crudHappyFlow_createGetUpdateAndArchive() throws Exception {
    AuthedUser psychologist = registerUser("Ana Psicóloga", "ana.pacientes@exemplo.com.br");

    PatientCreateRequest createRequest = new PatientCreateRequest("Marina Alves", 15000L, 10)
        .whatsapp("+5511990000000")
        .email("marina@exemplo.com.br")
        .notes("Prefere contato por WhatsApp");

    MvcResult createResult = mockMvc.perform(post("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(createRequest)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("Marina Alves"))
        .andExpect(jsonPath("$.monthlyFee").value(15000))
        .andExpect(jsonPath("$.billingDay").value(10))
        .andExpect(jsonPath("$.status").value("ativo"))
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.createdAt").exists())
        .andReturn();
    Patient created =
        objectMapper.readValue(createResult.getResponse().getContentAsString(), Patient.class);

    // GET por id devolve exatamente o que foi cadastrado.
    mockMvc.perform(get("/patients/" + created.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Marina Alves"))
        .andExpect(jsonPath("$.whatsapp").value("+5511990000000"));

    // PUT altera somente os campos presentes.
    PatientUpdateRequest updateRequest = new PatientUpdateRequest().monthlyFee(18000L);
    mockMvc.perform(put("/patients/" + created.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(updateRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.monthlyFee").value(18000))
        // Não alterados permanecem os mesmos.
        .andExpect(jsonPath("$.name").value("Marina Alves"))
        .andExpect(jsonPath("$.whatsapp").value("+5511990000000"));

    // DELETE arquiva (não exclui fisicamente): status muda, GET continua funcionando.
    mockMvc.perform(delete("/patients/" + created.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/patients/" + created.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("inativo"));
  }

  @Test
  void create_withInvalidPayload_returns400WithFieldViolations() throws Exception {
    AuthedUser psychologist = registerUser("Ana Validação", "ana.validacao@exemplo.com.br");

    // billingDay fora do intervalo permitido (1-28) e monthlyFee ausente.
    String invalidPayload = "{\"name\":\"\",\"billingDay\":40}";

    mockMvc.perform(post("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(invalidPayload))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.violations").isArray());
  }

  @Test
  void list_paginatesAndSearchesByNameCaseInsensitivePartial() throws Exception {
    AuthedUser psychologist = registerUser("Ana Listagem", "ana.listagem@exemplo.com.br");

    createPatientAndParse(psychologist.accessToken(), "Marina Alves", 15000L, 10);
    createPatientAndParse(psychologist.accessToken(), "Mariana Souza", 12000L, 5);
    createPatientAndParse(psychologist.accessToken(), "Carlos Pereira", 20000L, 15);

    // Busca parcial e case-insensitive por "mar" encontra Marina e Mariana, não Carlos.
    MvcResult searchResult = mockMvc.perform(get("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
            .param("name", "MAR"))
        .andExpect(status().isOk())
        .andReturn();
    PatientPage searchPage =
        objectMapper.readValue(searchResult.getResponse().getContentAsString(), PatientPage.class);
    assertThat(searchPage.getItems()).hasSize(2);
    assertThat(searchPage.getItems())
        .extracting(Patient::getName)
        .containsExactlyInAnyOrder("Marina Alves", "Mariana Souza");

    // Paginação: size=2 na primeira página traz 2 itens de um total de 3, com totalPages=2.
    MvcResult pageResult = mockMvc.perform(get("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
            .param("page", "0")
            .param("size", "2"))
        .andExpect(status().isOk())
        .andReturn();
    PatientPage firstPage =
        objectMapper.readValue(pageResult.getResponse().getContentAsString(), PatientPage.class);
    assertThat(firstPage.getItems()).hasSize(2);
    assertThat(firstPage.getMeta().getTotalElements()).isEqualTo(3);
    assertThat(firstPage.getMeta().getTotalPages()).isEqualTo(2);
    assertThat(firstPage.getMeta().getPage()).isEqualTo(0);
    assertThat(firstPage.getMeta().getSize()).isEqualTo(2);

    MvcResult secondPageResult = mockMvc.perform(get("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
            .param("page", "1")
            .param("size", "2"))
        .andExpect(status().isOk())
        .andReturn();
    PatientPage secondPage =
        objectMapper.readValue(secondPageResult.getResponse().getContentAsString(), PatientPage.class);
    assertThat(secondPage.getItems()).hasSize(1);
  }

  @Test
  void archivedPatient_disappearsFromDefaultListingButStillAccessibleAndFilterable() throws Exception {
    AuthedUser psychologist = registerUser("Ana Arquivamento", "ana.arquivamento@exemplo.com.br");

    Patient toKeep = createPatientAndParse(psychologist.accessToken(), "Paciente Ativo", 10000L, 5);
    Patient toArchive = createPatientAndParse(psychologist.accessToken(), "Paciente Arquivado", 10000L, 8);

    mockMvc.perform(delete("/patients/" + toArchive.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNoContent());

    // Listagem padrão (sem filtro de status) só traz o ativo.
    MvcResult defaultListResult = mockMvc.perform(get("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk())
        .andReturn();
    PatientPage defaultList =
        objectMapper.readValue(defaultListResult.getResponse().getContentAsString(), PatientPage.class);
    assertThat(defaultList.getItems())
        .extracting(Patient::getId)
        .containsExactly(toKeep.getId());

    // Filtro explícito status=inativo traz o arquivado.
    MvcResult archivedListResult = mockMvc.perform(get("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
            .param("status", "inativo"))
        .andExpect(status().isOk())
        .andReturn();
    PatientPage archivedList =
        objectMapper.readValue(archivedListResult.getResponse().getContentAsString(), PatientPage.class);
    assertThat(archivedList.getItems())
        .extracting(Patient::getId)
        .containsExactly(toArchive.getId());

    // Continua acessível diretamente por id (histórico preservado).
    mockMvc.perform(get("/patients/" + toArchive.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("inativo"));
  }

  @Test
  void tenantIsolation_userB_cannotReadUpdateArchiveOrListUserA_patients() throws Exception {
    AuthedUser userA = registerUser("Ana Tenant A", "ana.tenant.a@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Tenant B", "beatriz.tenant.b@exemplo.com.br");

    Patient patientOfA = createPatientAndParse(userA.accessToken(), "Paciente da Ana", 15000L, 10);
    // B também tem seu próprio paciente, para provar que a listagem de B não
    // simplesmente "some" por estar vazia, e sim que filtra corretamente.
    Patient patientOfB = createPatientAndParse(userB.accessToken(), "Paciente da Beatriz", 9000L, 20);

    // B tentando ler o paciente de A: 404, nunca 403 (não revela que o recurso existe).
    mockMvc.perform(get("/patients/" + patientOfA.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // B tentando atualizar o paciente de A: 404, e o dado de A não é alterado.
    PatientUpdateRequest maliciousUpdate = new PatientUpdateRequest().name("Sequestrado por B");
    mockMvc.perform(put("/patients/" + patientOfA.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(maliciousUpdate)))
        .andExpect(status().isNotFound());

    mockMvc.perform(get("/patients/" + patientOfA.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + userA.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Paciente da Ana"));

    // B tentando arquivar o paciente de A: 404, e o status de A permanece ativo.
    mockMvc.perform(delete("/patients/" + patientOfA.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isNotFound());

    mockMvc.perform(get("/patients/" + patientOfA.getId())
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + userA.accessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("ativo"));

    // Listagem de B: nunca vaza o paciente de A, e nunca retorna 403 — só os
    // próprios pacientes de B (lista não-vazia, mas escopada).
    MvcResult listBResult = mockMvc.perform(get("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isOk())
        .andReturn();
    PatientPage listB =
        objectMapper.readValue(listBResult.getResponse().getContentAsString(), PatientPage.class);
    assertThat(listB.getItems())
        .extracting(Patient::getId)
        .containsExactly(patientOfB.getId());

    // Busca por nome do paciente de A a partir da conta de B: lista vazia, nunca 403.
    MvcResult searchByANameFromBResult = mockMvc.perform(get("/patients")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken())
            .param("name", "Ana"))
        .andExpect(status().isOk())
        .andReturn();
    PatientPage searchByANameFromB =
        objectMapper.readValue(searchByANameFromBResult.getResponse().getContentAsString(), PatientPage.class);
    assertThat(searchByANameFromB.getItems()).isEmpty();
  }

  @Test
  void patientEndpoints_withoutToken_return401() throws Exception {
    mockMvc.perform(get("/patients"))
        .andExpect(status().isUnauthorized());
  }
}
