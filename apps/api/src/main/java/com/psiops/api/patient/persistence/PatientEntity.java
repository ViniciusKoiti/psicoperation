package com.psiops.api.patient.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Paciente (contato administrativo e de cobrança da psicóloga) — tabela
 * {@code patients}.
 *
 * <p>Espelha o schema {@code Patient} do contrato de patient (PSI-020).
 * Multi-tenant estrito: toda linha carrega {@code userId} da psicóloga dona
 * do cadastro (o contrato deriva esse escopo do bearer token, não expõe o
 * campo no DTO). Valor monetário SEMPRE em centavos ({@code monthlyFeeCents},
 * BIGINT) — nunca ponto flutuante.
 *
 * <p><strong>Sem dado clínico</strong>: {@code notes} é anotação
 * ADMINISTRATIVA livre (ex.: combinados de pagamento); nenhuma coluna de
 * diagnóstico, evolução ou prontuário existe ou deve ser adicionada aqui.
 */
@Entity
@Table(name = "patients")
public class PatientEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(length = 14)
  private String whatsapp;

  @Column(length = 254)
  private String email;

  @Column(name = "monthly_fee_cents", nullable = false)
  private long monthlyFeeCents;

  @Column(name = "billing_day", nullable = false)
  private int billingDay;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private PatientStatus status;

  @Column(length = 2000)
  private String notes;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected PatientEntity() {
    // Exigido pelo JPA.
  }

  public PatientEntity(
      UUID id,
      UUID userId,
      String name,
      String whatsapp,
      String email,
      long monthlyFeeCents,
      int billingDay,
      PatientStatus status,
      String notes,
      OffsetDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.whatsapp = whatsapp;
    this.email = email;
    this.monthlyFeeCents = monthlyFeeCents;
    this.billingDay = billingDay;
    this.status = status;
    this.notes = notes;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
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

  public long getMonthlyFeeCents() {
    return monthlyFeeCents;
  }

  public int getBillingDay() {
    return billingDay;
  }

  public PatientStatus getStatus() {
    return status;
  }

  public String getNotes() {
    return notes;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  // Mutadores usados pelo caso de uso de atualização/arquivamento (PSI-023).
  // A entidade permanece carregada dentro de uma transação (ver
  // com.psiops.api.patient.application.PatientService); o dirty-checking do
  // Hibernate persiste as alterações no commit.

  public void setName(String name) {
    this.name = name;
  }

  public void setWhatsapp(String whatsapp) {
    this.whatsapp = whatsapp;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setMonthlyFeeCents(long monthlyFeeCents) {
    this.monthlyFeeCents = monthlyFeeCents;
  }

  public void setBillingDay(int billingDay) {
    this.billingDay = billingDay;
  }

  public void setStatus(PatientStatus status) {
    this.status = status;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }
}
