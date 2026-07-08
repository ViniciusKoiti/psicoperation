package com.psiops.api.auth.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Conta da psicóloga (tabela {@code users}).
 *
 * <p>Espelha o schema {@code User} do contrato de auth (PSI-005), acrescido do
 * {@code passwordHash} — que existe só no armazenamento, nunca no DTO de saída.
 * O identificador é um {@link UUID} gerado pela aplicação (decisão registrada
 * como open_question no manifesto PSI-010).
 */
@Entity
@Table(name = "users")
public class UserEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(nullable = false, length = 254, unique = true)
  private String email;

  /** Hash BCrypt da senha; nunca a senha em claro, nunca exposto em DTO. */
  @Column(name = "password_hash", nullable = false, length = 100)
  private String passwordHash;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected UserEntity() {
    // Exigido pelo JPA.
  }

  public UserEntity(UUID id, String name, String email, String passwordHash, OffsetDateTime createdAt) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getEmail() {
    return email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
