package com.psiops.api.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.psiops.api.auth.domain.InvalidRefreshTokenException;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Testes unitários (sem Spring, sem banco) da lógica de rotação e detecção de
 * reuso do refresh token em memória — o núcleo da estratégia documentada em
 * {@link RefreshTokenService}.
 */
class RefreshTokenServiceTest {

  private RefreshTokenService service;

  @BeforeEach
  void setUp() {
    JwtProperties jwtProperties = new JwtProperties();
    jwtProperties.setSecret("teste-apenas-um-segredo-de-32-bytes-no-minimo!!");
    jwtProperties.setRefreshTokenTtl(Duration.ofDays(7));
    service = new RefreshTokenService(jwtProperties);
  }

  @Test
  void issueThenRotate_succeedsAndChangesToken() {
    UUID userId = UUID.randomUUID();
    RefreshTokenService.IssuedRefreshToken issued = service.issue(userId);

    RefreshTokenService.RotatedRefreshToken rotated = service.rotate(issued.token());

    assertThat(rotated.userId()).isEqualTo(userId);
    assertThat(rotated.token()).isNotEqualTo(issued.token());
  }

  @Test
  void rotate_rejectsTokenNeverIssued() {
    assertThatThrownBy(() -> service.rotate("nao-existe.segredo"))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }

  @Test
  void rotate_rejectsMalformedToken() {
    assertThatThrownBy(() -> service.rotate("sem-separador-de-userid"))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }

  @Test
  void rotate_rejectsReuseOfAlreadyRotatedToken_andInvalidatesFamily() {
    UUID userId = UUID.randomUUID();
    RefreshTokenService.IssuedRefreshToken first = service.issue(userId);

    RefreshTokenService.RotatedRefreshToken second = service.rotate(first.token());

    // Reapresentar o token já trocado (first) é reuso: rejeitado.
    assertThatThrownBy(() -> service.rotate(first.token()))
        .isInstanceOf(InvalidRefreshTokenException.class);

    // O reuso invalidou a família inteira: o token que era o corrente válido
    // (second) também deixa de funcionar, forçando novo login.
    assertThatThrownBy(() -> service.rotate(second.token()))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }

  @Test
  void issue_forNewLogin_supersedesPreviousSession_presentingStaleTokenIsFailClosed() {
    UUID userId = UUID.randomUUID();
    RefreshTokenService.IssuedRefreshToken firstSession = service.issue(userId);
    RefreshTokenService.IssuedRefreshToken secondSession = service.issue(userId);

    // O token da 1ª sessão já não é o corrente (a 2ª sessão o substituiu).
    // O store não distingue "sessão antiga substituída" de "reuso suspeito
    // de token vazado" — qualquer segredo que não bata com o corrente
    // derruba a família inteira (fail-closed), então mesmo a sessão nova
    // (2ª), ainda não usada, deixa de funcionar depois dessa tentativa.
    assertThatThrownBy(() -> service.rotate(firstSession.token()))
        .isInstanceOf(InvalidRefreshTokenException.class);
    assertThatThrownBy(() -> service.rotate(secondSession.token()))
        .isInstanceOf(InvalidRefreshTokenException.class);
  }
}
