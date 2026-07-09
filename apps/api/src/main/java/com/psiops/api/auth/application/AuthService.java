package com.psiops.api.auth.application;

import com.psiops.api.auth.domain.EmailAlreadyRegisteredException;
import com.psiops.api.auth.domain.InvalidCredentialsException;
import com.psiops.api.auth.domain.InvalidRefreshTokenException;
import com.psiops.api.auth.persistence.UserEntity;
import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.contracts.model.AuthResponse;
import com.psiops.contracts.model.LoginRequest;
import com.psiops.contracts.model.RegisterRequest;
import com.psiops.contracts.model.TokenPair;
import com.psiops.contracts.model.User;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso de autenticação: registro, login e refresh. Orquestra
 * {@link UserRepository} (persistência da conta), {@link JwtService} (access
 * token) e {@link RefreshTokenService} (refresh token, rotação em memória).
 *
 * <p>Nunca loga nem retorna senha ou hash — apenas o DTO {@link User}, que
 * não tem esses campos por construção (contrato gerado).
 */
@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final RefreshTokenService refreshTokenService;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      RefreshTokenService refreshTokenService) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.refreshTokenService = refreshTokenService;
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    String email = request.getEmail().trim().toLowerCase();
    if (userRepository.existsByEmail(email)) {
      throw new EmailAlreadyRegisteredException();
    }
    UserEntity entity = new UserEntity(
        UUID.randomUUID(),
        request.getName(),
        email,
        passwordEncoder.encode(request.getPassword()),
        OffsetDateTime.now(ZoneOffset.UTC));
    userRepository.save(entity);
    return buildAuthResponse(entity);
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    String email = request.getEmail().trim().toLowerCase();
    UserEntity entity = userRepository.findByEmail(email)
        .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
        .orElseThrow(InvalidCredentialsException::new);
    return buildAuthResponse(entity);
  }

  @Transactional(readOnly = true)
  public TokenPair refresh(String presentedRefreshToken) {
    RefreshTokenService.RotatedRefreshToken rotated = refreshTokenService.rotate(presentedRefreshToken);
    UserEntity entity = userRepository.findById(rotated.userId())
        // A conta pode ter sido removida entre a emissão do refresh anterior
        // e agora; trata como refresh inválido (não há conta para autenticar).
        .orElseThrow(InvalidRefreshTokenException::new);
    JwtService.IssuedAccessToken accessToken = jwtService.issueAccessToken(entity.getId(), entity.getEmail());
    return new TokenPair(
        TokenPair.TokenTypeEnum.BEARER,
        accessToken.token(),
        accessToken.expiresInSeconds(),
        rotated.token());
  }

  private AuthResponse buildAuthResponse(UserEntity entity) {
    JwtService.IssuedAccessToken accessToken = jwtService.issueAccessToken(entity.getId(), entity.getEmail());
    RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issue(entity.getId());
    TokenPair tokens = new TokenPair(
        TokenPair.TokenTypeEnum.BEARER,
        accessToken.token(),
        accessToken.expiresInSeconds(),
        refreshToken.token());
    return new AuthResponse(UserMapper.toContract(entity), tokens);
  }
}
