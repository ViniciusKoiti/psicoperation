package com.psiops.api.settings.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Configurações da conta (tabela {@code settings}), uma linha por usuária.
 *
 * <p>Ainda não há contrato OpenAPI de settings (chega em tarefa de domínio
 * futura). Este scaffold estabelece apenas a tabela e o vínculo 1‑para‑1 com
 * {@code users}; as colunas de negócio (ex.: mensalidade padrão em centavos,
 * fuso horário) serão acrescentadas por novas migrations — a V1 é imutável
 * após o merge. Nenhuma coluna de negócio é inventada aqui.
 */
@Entity
@Table(name = "settings")
public class SettingsEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, unique = true, updatable = false)
  private UUID userId;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected SettingsEntity() {
    // Exigido pelo JPA.
  }

  public SettingsEntity(UUID id, UUID userId, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
    this.id = id;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
