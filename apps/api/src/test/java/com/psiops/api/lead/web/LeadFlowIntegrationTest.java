package com.psiops.api.lead.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.lead.persistence.LeadRepository;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.Lead;
import com.psiops.contracts.model.LeadCreateRequest;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

/**
 * Cobertura ponta a ponta (MockMvc + Testcontainers, PostgreSQL real) da
 * captura pública de leads (PSI-028): sucesso, dedupe idempotente por
 * e-mail (sem revelar cadastro prévio), payload inválido, acesso sem token
 * (rota pública, ao lado de uma rota protegida que continua exigindo
 * token) e rate-limit.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class LeadFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;
  @Autowired private LeadRepository leadRepository;

  @Test
  void create_withValidPayload_returns201AndPersists() throws Exception {
    String email = "ana.lista@exemplo.com.br";
    LeadCreateRequest request = new LeadCreateRequest("Ana Beatriz Souza", "+5511990000000", email);

    mockMvc.perform(post("/leads")
            .with(remoteAddr("10.10.1.1"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.id").exists())
        .andExpect(jsonPath("$.name").value("Ana Beatriz Souza"))
        .andExpect(jsonPath("$.whatsapp").value("+5511990000000"))
        .andExpect(jsonPath("$.email").value(email))
        .andExpect(jsonPath("$.createdAt").exists());

    assertThat(leadRepository.findByEmail(email)).isPresent();
  }

  @Test
  void create_withDuplicateEmail_isIdempotentAndDoesNotRevealPriorRegistration() throws Exception {
    String email = "ana.duplicada.lista@exemplo.com.br";
    LeadCreateRequest request = new LeadCreateRequest("Ana Duplicada", "+5511990000001", email);
    String body = objectMapper.writeValueAsString(request);

    MvcResult first = mockMvc.perform(post("/leads")
            .with(remoteAddr("10.10.2.1"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andReturn();
    Lead firstLead = objectMapper.readValue(first.getResponse().getContentAsString(), Lead.class);

    // Reenvio do mesmo e-mail: mesmo status, mesmo shape de sucesso, mesmo
    // registro devolvido — nunca um 409 ou mensagem que sinalize que o
    // e-mail já estava cadastrado.
    MvcResult second = mockMvc.perform(post("/leads")
            .with(remoteAddr("10.10.2.1"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.email").value(email))
        .andReturn();
    Lead secondLead = objectMapper.readValue(second.getResponse().getContentAsString(), Lead.class);

    assertThat(secondLead.getId()).isEqualTo(firstLead.getId());
    // TIMESTAMPTZ no Postgres tem precisão de microssegundos; o primeiro
    // response reflete o OffsetDateTime.now() em memória (nanossegundos),
    // enquanto o segundo reflete o valor já lido de volta do banco (dedupe).
    // Trunca para milissegundos para comparar o mesmo instante sem
    // depender dessa diferença de precisão de armazenamento.
    assertThat(secondLead.getCreatedAt().truncatedTo(ChronoUnit.MILLIS))
        .isEqualTo(firstLead.getCreatedAt().truncatedTo(ChronoUnit.MILLIS));
    assertThat(leadRepository.findAll().stream().filter(lead -> lead.getEmail().equals(email)).count())
        .isEqualTo(1);
  }

  @Test
  void create_withMissingRequiredFields_returns400() throws Exception {
    mockMvc.perform(post("/leads")
            .with(remoteAddr("10.10.3.1"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(400));
  }

  @Test
  void create_withMalformedEmail_returns400() throws Exception {
    LeadCreateRequest request =
        new LeadCreateRequest("Ana Email Inválido", "+5511990000002", "nao-e-um-email");

    mockMvc.perform(post("/leads")
            .with(remoteAddr("10.10.4.1"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void create_withMalformedWhatsapp_returns400() throws Exception {
    LeadCreateRequest request =
        new LeadCreateRequest("Ana WhatsApp Inválido", "11990000003", "ana.whats.invalido@exemplo.com.br");

    mockMvc.perform(post("/leads")
            .with(remoteAddr("10.10.4.2"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void publicRoute_withoutAuthorizationHeader_succeeds_whileProtectedRouteStillRequiresToken() throws Exception {
    String email = "ana.publica.lista@exemplo.com.br";
    LeadCreateRequest request = new LeadCreateRequest("Ana Pública", "+5511990000004", email);

    // /leads é público: nenhum header Authorization é necessário.
    mockMvc.perform(post("/leads")
            .with(remoteAddr("10.10.5.1"))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    // Uma rota protegida de verdade (/auth/session) continua exigindo
    // token — prova que liberar /leads não abriu a cadeia de segurança
    // inteira.
    mockMvc.perform(get("/auth/session"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void create_isRateLimitedAfterExceedingAttempts() throws Exception {
    // Chave de rate-limit é só o IP remoto (ver LeadRateLimiter) — um IP
    // fictício exclusivo deste teste isola o bucket dos demais métodos desta
    // classe (o contexto Spring, e portanto o LeadRateLimiter em memória, é
    // compartilhado entre eles).
    String ip = "10.10.6.1";

    // Capacidade default é 5 por minuto (application.yml,
    // psiops.security.rate-limit.leads.capacity) — as primeiras 5
    // submissões (e-mails distintos) são aceitas normalmente.
    for (int attempt = 0; attempt < 5; attempt++) {
      LeadCreateRequest request = new LeadCreateRequest(
          "Ana Rate Limit " + attempt,
          "+55119" + String.format("%08d", attempt),
          "ana.rate.limit." + attempt + "@exemplo.com.br");
      mockMvc.perform(post("/leads")
              .with(remoteAddr(ip))
              .contentType(MediaType.APPLICATION_JSON)
              .content(objectMapper.writeValueAsString(request)))
          .andExpect(status().isCreated());
    }

    // A 6ª submissão esgota a janela: 429, não 201.
    LeadCreateRequest sixth = new LeadCreateRequest(
        "Ana Rate Limit 5", "+55119" + String.format("%08d", 5), "ana.rate.limit.5@exemplo.com.br");
    mockMvc.perform(post("/leads")
            .with(remoteAddr(ip))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(sixth)))
        .andExpect(status().isTooManyRequests())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(429));
  }

  private static RequestPostProcessor remoteAddr(String ip) {
    return request -> {
      request.setRemoteAddr(ip);
      return request;
    };
  }
}
