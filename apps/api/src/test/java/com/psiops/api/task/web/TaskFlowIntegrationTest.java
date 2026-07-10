package com.psiops.api.task.web;

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
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.Task;
import com.psiops.contracts.model.TaskCreateRequest;
import com.psiops.contracts.model.TaskPage;
import com.psiops.contracts.model.TaskUpdateRequest;
import java.time.LocalDate;
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
 * módulo de tarefas administrativas (PSI-027): CRUD (título, vencimento,
 * marcar/desmarcar conclusão), listagem paginada com filtro {@code pending} e
 * isolamento estrito por tenant.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class TaskFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

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

  private Task createTaskExpectingCreated(String token, TaskCreateRequest request) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/tasks")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andReturn();
    return objectMapper.readValue(result.getResponse().getContentAsString(), Task.class);
  }

  @Test
  void crudHappyFlow_createListUpdateCompleteReopenAndDelete() throws Exception {
    AuthedUser psychologist = registerUser("Ana Tarefas", "ana.tarefas@exemplo.com.br");

    TaskCreateRequest createRequest =
        new TaskCreateRequest("Enviar recibo para Marina").dueDate(LocalDate.now().plusDays(3));
    Task created = createTaskExpectingCreated(psychologist.accessToken(), createRequest);
    assertThat(created.getTitle()).isEqualTo("Enviar recibo para Marina");
    assertThat(created.getCompletedAt()).isNull();
    assertThat(created.getId()).isNotNull();
    assertThat(created.getCreatedAt()).isNotNull();

    // Edita título/vencimento (partial update, sem tocar em completedAt).
    TaskUpdateRequest editRequest =
        new TaskUpdateRequest().title("Enviar recibo para Marina Alves").dueDate(LocalDate.now().plusDays(5));
    MvcResult editResult =
        mockMvc
            .perform(
                put("/tasks/" + created.getId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(editRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Enviar recibo para Marina Alves"))
            .andExpect(jsonPath("$.completedAt").doesNotExist())
            .andReturn();
    Task edited = objectMapper.readValue(editResult.getResponse().getContentAsString(), Task.class);
    assertThat(edited.getDueDate()).isEqualTo(LocalDate.now().plusDays(5));

    // Marca conclusão: completedAt presente.
    TaskUpdateRequest completeRequest = new TaskUpdateRequest().completedAt(java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC));
    mockMvc
        .perform(
            put("/tasks/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(completeRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.completedAt").exists());

    // Desmarca conclusão: completedAt ausente/nulo reabre.
    TaskUpdateRequest reopenRequest = new TaskUpdateRequest();
    mockMvc
        .perform(
            put("/tasks/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reopenRequest)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.completedAt").doesNotExist())
        .andExpect(jsonPath("$.title").value("Enviar recibo para Marina Alves"));

    mockMvc
        .perform(
            delete("/tasks/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken()))
        .andExpect(status().isNoContent());

    // Editar tarefa já excluída: 404.
    mockMvc
        .perform(
            put("/tasks/" + created.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new TaskUpdateRequest().title("outro"))))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void create_withInvalidPayload_returns400WithFieldViolations() throws Exception {
    AuthedUser psychologist = registerUser("Ana Validação", "ana.validacao.tarefas@exemplo.com.br");

    // title vazio viola minLength=1.
    String invalidPayload = "{\"title\":\"\"}";

    mockMvc
        .perform(
            post("/tasks")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidPayload))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.violations").isArray());
  }

  @Test
  void list_paginatedWithPendingFilter() throws Exception {
    AuthedUser psychologist = registerUser("Ana Paginação", "ana.paginacao.tarefas@exemplo.com.br");

    Task pending1 = createTaskExpectingCreated(psychologist.accessToken(), new TaskCreateRequest("Tarefa pendente 1"));
    Task pending2 = createTaskExpectingCreated(psychologist.accessToken(), new TaskCreateRequest("Tarefa pendente 2"));
    Task toComplete = createTaskExpectingCreated(psychologist.accessToken(), new TaskCreateRequest("Tarefa concluída"));

    mockMvc
        .perform(
            put("/tasks/" + toComplete.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        new TaskUpdateRequest().completedAt(java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC)))))
        .andExpect(status().isOk());

    // Sem filtro: todas as 3.
    MvcResult allResult =
        mockMvc
            .perform(
                get("/tasks")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("size", "10"))
            .andExpect(status().isOk())
            .andReturn();
    TaskPage allPage = objectMapper.readValue(allResult.getResponse().getContentAsString(), TaskPage.class);
    assertThat(allPage.getItems()).hasSize(3);
    assertThat(allPage.getMeta().getTotalElements()).isEqualTo(3L);

    // pending=true: só as 2 não concluídas.
    MvcResult pendingResult =
        mockMvc
            .perform(
                get("/tasks")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("pending", "true")
                    .param("size", "10"))
            .andExpect(status().isOk())
            .andReturn();
    TaskPage pendingPage = objectMapper.readValue(pendingResult.getResponse().getContentAsString(), TaskPage.class);
    assertThat(pendingPage.getItems())
        .extracting(Task::getId)
        .containsExactlyInAnyOrder(pending1.getId(), pending2.getId());
    assertThat(pendingPage.getItems()).allMatch(t -> t.getCompletedAt() == null);

    // Paginação: size=1 retorna 1 item e totalPages compatível.
    MvcResult page0Result =
        mockMvc
            .perform(
                get("/tasks")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + psychologist.accessToken())
                    .param("page", "0")
                    .param("size", "1"))
            .andExpect(status().isOk())
            .andReturn();
    TaskPage page0 = objectMapper.readValue(page0Result.getResponse().getContentAsString(), TaskPage.class);
    assertThat(page0.getItems()).hasSize(1);
    assertThat(page0.getMeta().getTotalPages()).isEqualTo(3);
  }

  @Test
  void tenantIsolation_userB_cannotReadUpdateOrDeleteUserA_tasks() throws Exception {
    AuthedUser userA = registerUser("Ana Tenant A", "ana.tenant.a.tarefas@exemplo.com.br");
    AuthedUser userB = registerUser("Beatriz Tenant B", "beatriz.tenant.b.tarefas@exemplo.com.br");

    Task taskOfA = createTaskExpectingCreated(userA.accessToken(), new TaskCreateRequest("Tarefa da Ana"));

    // B tentando editar a tarefa de A: 404, nunca 403.
    mockMvc
        .perform(
            put("/tasks/" + taskOfA.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new TaskUpdateRequest().title("sequestrada"))))
        .andExpect(status().isNotFound())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // B tentando excluir a tarefa de A: 404.
    mockMvc
        .perform(
            delete("/tasks/" + taskOfA.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
        .andExpect(status().isNotFound());

    // Listagem de B nunca vaza a tarefa de A — lista vazia, nunca 403.
    MvcResult listBResult =
        mockMvc
            .perform(get("/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer " + userB.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    TaskPage listB = objectMapper.readValue(listBResult.getResponse().getContentAsString(), TaskPage.class);
    assertThat(listB.getItems()).isEmpty();

    // A continua com sua tarefa intacta.
    MvcResult listAResult =
        mockMvc
            .perform(get("/tasks").header(HttpHeaders.AUTHORIZATION, "Bearer " + userA.accessToken()))
            .andExpect(status().isOk())
            .andReturn();
    TaskPage listA = objectMapper.readValue(listAResult.getResponse().getContentAsString(), TaskPage.class);
    assertThat(listA.getItems()).extracting(Task::getTitle).containsExactly("Tarefa da Ana");
  }

  @Test
  void taskEndpoints_withoutToken_return401() throws Exception {
    mockMvc.perform(get("/tasks")).andExpect(status().isUnauthorized());
  }
}
