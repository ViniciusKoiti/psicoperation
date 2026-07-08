package com.psiops.api.lead.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Lead da lista de espera (tabela {@code leads}).
 *
 * <p>Espelha o schema {@code Lead} do contrato de lead (PSI-005). O
 * {@code whatsapp} é armazenado no formato canônico E.164 ({@code +55...},
 * 14 caracteres), conforme o schema {@code WhatsAppBR}.
 */
@Entity
@Table(name = "leads")
public class LeadEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(nullable = false, length = 14)
  private String whatsapp;

  @Column(nullable = false, length = 254, unique = true)
  private String email;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected LeadEntity() {
    // Exigido pelo JPA.
  }

  public LeadEntity(UUID id, String name, String whatsapp, String email, OffsetDateTime createdAt) {
    this.id = id;
    this.name = name;
    this.whatsapp = whatsapp;
    this.email = email;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getWhatsapp() {
    return whatsapp;
  }

  public String getEmail() {
    return email;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
