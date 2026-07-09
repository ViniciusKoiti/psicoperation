package com.psiops.api.auth.application;

import com.psiops.api.auth.domain.InvalidRefreshTokenException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Rotação de refresh token com estado <strong>em memória</strong> — não há
 * (nem pode haver, nesta tarefa) uma tabela de refresh tokens no schema: V1 e
 * V2 são imutáveis e não a definem, e criar uma migration está fora do escopo
 * de PSI-022 (ver {@code tasks/PSI-022.yaml}, {@code out_of_scope} e
 * {@code open_questions}). A estratégia escolhida espelha deliberadamente o
 * rate-limit em memória já aceito para o MVP single-instance (ver
 * {@link LoginRateLimiter}): um {@link ConcurrentHashMap} de {@code userId}
 * para o único refresh token válido corrente daquele usuário (a "família").
 *
 * <p><strong>Trade-off aceito e documentado</strong>: todo o estado de
 * refresh vive no heap desta instância. Um restart do processo (deploy,
 * crash, etc.) esvazia o mapa — toda psicóloga logada precisa fazer login de
 * novo (o access token de curta duração que ela já tinha continua válido até
 * expirar, então a interrupção não é imediata). Aceitável para o MVP
 * single-instance; deixa de ser aceitável se a API rodar em múltiplas
 * instâncias (o mapa não é compartilhado) — nesse caso, uma tarefa futura
 * precisa introduzir uma tabela de refresh tokens via nova migration.
 *
 * <p><strong>Rotação e reuso</strong>: cada usuário tem no máximo uma
 * "família" de refresh ativa por vez (um novo login sobrescreve a anterior,
 * invalidando implicitamente qualquer sessão de refresh anterior daquele
 * usuário — simplificação aceitável para o MVP, que não modela múltiplos
 * dispositivos simultâneos). A cada troca bem-sucedida, o segredo antigo é
 * descartado e um novo é gerado e armazenado. Se o token apresentado tiver o
 * formato certo (userId + segredo) mas o segredo não bater com o corrente —
 * ou seja, é um token já rotacionado (reuso), de uma sessão antiga já
 * substituída por um novo login, ou simplesmente forjado — a família inteira
 * é invalidada (removida do mapa) e a troca é rejeitada, obrigando um novo
 * login. O store não tenta distinguir essas três causas (é
 * <em>fail-closed</em>: qualquer segredo que não bata é tratado como
 * suspeito), então até a sessão corrente, ainda não usada, é derrubada junto
 * caso algum token antigo seja reapresentado. Isso contém o pior caso — um
 * refresh token vazado sendo reusado depois de já ter sido trocado pelo dono
 * legítimo — ao custo de também poder derrubar uma sessão legítima se um
 * token velho voltar a circular por engano (aceitável: o pior que acontece é
 * pedir um novo login).
 *
 * <p>O segredo nunca é guardado em claro no mapa — apenas o hash SHA-256, na
 * mesma linha de cuidado usada para senhas (ali com BCrypt; aqui SHA-256
 * simples é suficiente porque o segredo já é aleatório de alta entropia, não
 * uma senha escolhida por humano).
 */
@Service
public class RefreshTokenService {

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();
  private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
  private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

  private final Map<UUID, StoredRefreshToken> store = new ConcurrentHashMap<>();
  private final Duration refreshTokenTtl;

  public RefreshTokenService(JwtProperties jwtProperties) {
    this.refreshTokenTtl = jwtProperties.getRefreshTokenTtl();
  }

  private record StoredRefreshToken(String secretHashHex, Instant expiresAt) {
  }

  /** Resultado de emitir (login/registro) ou rotacionar (refresh) um refresh token. */
  public record IssuedRefreshToken(String token, Instant expiresAt) {
  }

  /** Emite um novo refresh token para o usuário, substituindo qualquer família anterior. */
  public IssuedRefreshToken issue(UUID userId) {
    return storeNewSecret(userId);
  }

  /**
   * Valida o refresh token apresentado e, se válido, rotaciona (descarta o
   * atual, emite um novo) e retorna o {@code userId} do dono e o novo token.
   *
   * @throws InvalidRefreshTokenException se o token for malformado, desconhecido, expirado ou já
   *     rotacionado (reuso) — nesse último caso a família é invalidada por completo
   */
  public RotatedRefreshToken rotate(String presentedToken) {
    ParsedToken parsed = parse(presentedToken);
    StoredRefreshToken current = store.get(parsed.userId());
    if (current == null) {
      // Nunca emitido para este userId (ou já invalidado/logout) — rejeita.
      throw new InvalidRefreshTokenException();
    }
    if (Instant.now().isAfter(current.expiresAt())) {
      store.remove(parsed.userId());
      throw new InvalidRefreshTokenException();
    }
    String presentedHash = sha256Hex(parsed.secret());
    if (!constantTimeEquals(presentedHash, current.secretHashHex())) {
      // Segredo não bate com o corrente: token já rotacionado (reuso) ou
      // forjado. Invalida a família inteira — o dono legítimo (que já tem o
      // token novo) simplesmente segue usando o novo; quem reapresentou o
      // antigo (vazamento) fica sem acesso, e agora o dono também precisa
      // logar de novo caso ainda estivesse com o antigo em mãos.
      store.remove(parsed.userId());
      throw new InvalidRefreshTokenException();
    }

    IssuedRefreshToken reissued = storeNewSecret(parsed.userId());
    return new RotatedRefreshToken(parsed.userId(), reissued.token(), reissued.expiresAt());
  }

  /** Resultado de uma rotação bem-sucedida. */
  public record RotatedRefreshToken(UUID userId, String token, Instant expiresAt) {
  }

  private IssuedRefreshToken storeNewSecret(UUID userId) {
    byte[] secretBytes = new byte[32];
    SECURE_RANDOM.nextBytes(secretBytes);
    String secret = URL_ENCODER.encodeToString(secretBytes);
    Instant expiresAt = Instant.now().plus(refreshTokenTtl);
    store.put(userId, new StoredRefreshToken(sha256Hex(secret), expiresAt));
    String token = URL_ENCODER.encodeToString(userId.toString().getBytes(StandardCharsets.UTF_8))
        + "."
        + secret;
    return new IssuedRefreshToken(token, expiresAt);
  }

  private record ParsedToken(UUID userId, String secret) {
  }

  private ParsedToken parse(String token) {
    if (token == null || token.isBlank()) {
      throw new InvalidRefreshTokenException();
    }
    int separator = token.indexOf('.');
    if (separator <= 0 || separator == token.length() - 1) {
      throw new InvalidRefreshTokenException();
    }
    try {
      String userIdPart = new String(URL_DECODER.decode(token.substring(0, separator)), StandardCharsets.UTF_8);
      UUID userId = UUID.fromString(userIdPart);
      String secret = token.substring(separator + 1);
      return new ParsedToken(userId, secret);
    } catch (IllegalArgumentException ex) {
      throw new InvalidRefreshTokenException();
    }
  }

  private static String sha256Hex(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException ex) {
      // SHA-256 é garantido por toda JVM compatível (JLS/JCA) — não é um
      // cenário de runtime real, apenas satisfaz o checked exception.
      throw new IllegalStateException("SHA-256 indisponível na JVM", ex);
    }
  }

  private static boolean constantTimeEquals(String a, String b) {
    return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
  }
}
