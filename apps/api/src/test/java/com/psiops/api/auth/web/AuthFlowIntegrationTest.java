package com.psiops.api.auth.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.psiops.api.support.ContainersConfig;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.LoginRequest;
import com.psiops.contracts.model.RefreshTokenRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.TokenPair;
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
 * Cobertura ponta a ponta (MockMvc + Testcontainers, PostgreSQL real) da
 * autenticação JWT (PSI-022): fluxo feliz completo, credenciais inválidas,
 * 401 sem token em rota protegida, rate-limit de login e rotação de refresh
 * token (incluindo rejeição de reuso e invalidação da família).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Import(ContainersConfig.class)
class AuthFlowIntegrationTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @Test
  void happyFlow_registerThenLoginThenAuthenticatedAccessThenRefresh() throws Exception {
    String email = "ana.feliz@exemplo.com.br";
    String password = "SenhaForte123!";

    // 1. Registro cria a conta e já retorna um par de tokens.
    MvcResult registerResult = mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RegisterRequest("Ana Beatriz Souza", email, password))))
        .andExpect(status().isCreated())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.user.email").value(email))
        .andExpect(jsonPath("$.user.id").exists())
        .andExpect(jsonPath("$.tokens.tokenType").value("Bearer"))
        .andExpect(jsonPath("$.tokens.accessToken").isNotEmpty())
        .andExpect(jsonPath("$.tokens.refreshToken").isNotEmpty())
        // Nunca vaza senha nem hash na resposta.
        .andExpect(jsonPath("$.user.password").doesNotExist())
        .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
        .andReturn();
    assertThat(registerResult.getResponse().getContentAsString()).doesNotContain(password);

    // 2. Login com as mesmas credenciais emite um novo par de tokens.
    MvcResult loginResult = mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.email").value(email))
        .andReturn();
    AuthResponse loginResponse =
        objectMapper.readValue(loginResult.getResponse().getContentAsString(), AuthResponse.class);
    String accessToken = loginResponse.getTokens().getAccessToken();
    String refreshToken = loginResponse.getTokens().getRefreshToken();

    // 3. Acesso autenticado: /auth/session exige e valida o access token JWT.
    mockMvc.perform(get("/auth/session")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.email").value(email))
        .andExpect(jsonPath("$.expiresAt").exists());

    // 4. Refresh rotaciona: novo par de tokens, refresh token diferente do anterior.
    MvcResult refreshResult = mockMvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RefreshTokenRequest(refreshToken))))
        .andExpect(status().isOk())
        .andReturn();
    TokenPair rotated =
        objectMapper.readValue(refreshResult.getResponse().getContentAsString(), TokenPair.class);
    // O refresh token é sempre diferente (segredo aleatório novo a cada
    // rotação). O access token *pode* coincidir se emitido no mesmo segundo
    // que o anterior — claims JWT (iat/exp) têm granularidade de segundo, e
    // mesmas claims + mesma chave produzem a mesma assinatura; não é um
    // requisito de segurança que dois access tokens distintos difiram byte a
    // byte dentro do mesmo segundo, então não é asserido aqui.
    assertThat(rotated.getRefreshToken()).isNotEqualTo(refreshToken);

    // O novo access token também autentica normalmente.
    mockMvc.perform(get("/auth/session")
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + rotated.getAccessToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.email").value(email));
  }

  @Test
  void register_withEmailAlreadyRegistered_returns409() throws Exception {
    String email = "ana.duplicada@exemplo.com.br";
    RegisterRequest request = new RegisterRequest("Ana Duplicada", email, "SenhaForte123!");

    mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isConflict())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(409));
  }

  @Test
  void login_withWrongPassword_returns401AsProblemDetails() throws Exception {
    String email = "ana.senhaerrada@exemplo.com.br";
    mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RegisterRequest("Ana Senha Errada", email, "SenhaCorreta123!"))))
        .andExpect(status().isCreated());

    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new LoginRequest(email, "SenhaErrada999!"))))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(401));
  }

  @Test
  void login_withNonexistentEmail_returns401WithoutRevealingCause() throws Exception {
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new LoginRequest("nao.existe.jamais@exemplo.com.br", "QualquerSenha123!"))))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void protectedRoute_withoutToken_returns401() throws Exception {
    mockMvc.perform(get("/auth/session"))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void protectedRoute_withMalformedToken_returns401() throws Exception {
    mockMvc.perform(get("/auth/session")
            .header(HttpHeaders.AUTHORIZATION, "Bearer isto-nao-e-um-jwt-valido"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void publicAuthEndpoints_doNotRequireAuthorizationHeader() throws Exception {
    // register/login/refresh já são exercitados sem header Authorization nos
    // demais testes; aqui fixamos explicitamente que um payload inválido
    // ainda assim não vira 401 (a rota é pública; o erro é de validação).
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void refresh_rotatesTokenAndRejectsReuseOfInvalidatedToken() throws Exception {
    String email = "ana.rotacao@exemplo.com.br";
    mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RegisterRequest("Ana Rotação", email, "SenhaForte123!"))))
        .andExpect(status().isCreated());

    MvcResult loginResult = mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new LoginRequest(email, "SenhaForte123!"))))
        .andExpect(status().isOk())
        .andReturn();
    AuthResponse loginResponse =
        objectMapper.readValue(loginResult.getResponse().getContentAsString(), AuthResponse.class);
    String firstRefreshToken = loginResponse.getTokens().getRefreshToken();

    // Primeira troca: válida, emite refreshToken2 e invalida firstRefreshToken.
    MvcResult firstRefreshResult = mockMvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RefreshTokenRequest(firstRefreshToken))))
        .andExpect(status().isOk())
        .andReturn();
    TokenPair secondPair =
        objectMapper.readValue(firstRefreshResult.getResponse().getContentAsString(), TokenPair.class);
    String secondRefreshToken = secondPair.getRefreshToken();
    assertThat(secondRefreshToken).isNotEqualTo(firstRefreshToken);

    // Reuso do token já rotacionado (firstRefreshToken) é rejeitado.
    mockMvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RefreshTokenRequest(firstRefreshToken))))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

    // O reuso detectado invalida a família inteira: mesmo o token que era
    // válido no momento do reuso (secondRefreshToken) deixa de funcionar —
    // a psicóloga precisa logar de novo, contendo o pior caso de um refresh
    // token vazado sendo reapresentado depois de já ter sido trocado.
    mockMvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RefreshTokenRequest(secondRefreshToken))))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void refresh_withNeverIssuedToken_returns401() throws Exception {
    mockMvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new RefreshTokenRequest("token-forjado-nunca-emitido"))))
        .andExpect(status().isUnauthorized())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
  }

  @Test
  void login_isRateLimitedAfterExceedingAttempts() throws Exception {
    // Chave de rate-limit é IP + e-mail; usar um e-mail exclusivo deste
    // teste isola o bucket dos demais testes da classe (o contexto Spring, e
    // portanto o LoginRateLimiter em memória, é compartilhado entre métodos).
    String email = "ana.rate.limit@exemplo.com.br";
    LoginRequest loginRequest = new LoginRequest(email, "QualquerSenha123!");
    String body = objectMapper.writeValueAsString(loginRequest);

    // Capacidade default é 5 por minuto (application.yml,
    // psiops.security.rate-limit.login.capacity) — as primeiras 5 tentativas
    // são rejeitadas por credencial inválida (conta nem existe), não por
    // rate-limit.
    for (int attempt = 0; attempt < 5; attempt++) {
      mockMvc.perform(post("/auth/login")
              .contentType(MediaType.APPLICATION_JSON)
              .content(body))
          .andExpect(status().isUnauthorized());
    }

    // A 6ª tentativa esgota a janela: 429, não 401.
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isTooManyRequests())
        .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(429));
  }
}
