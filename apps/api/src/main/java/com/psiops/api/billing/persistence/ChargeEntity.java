package com.psiops.api.billing.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Cobrança de mensalidade de um paciente, referente a uma competência (mês)
 * — tabela {@code charges}.
 *
 * <p>Espelha o schema {@code Charge} do contrato de billing (PSI-020).
 * {@code competence} é a competência no formato {@code AAAA-MM} (schema
 * {@code Competence}). Valores monetários SEMPRE em centavos ({@code
 * amountCents}, {@code Payment.paidAmountCents}, BIGINT) — nunca ponto
 * flutuante. Multi-tenant estrito: toda linha carrega {@code userId} da
 * psicóloga dona da cobrança.
 */
@Entity
@Table(name = "charges")
public class ChargeEntity {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(name = "patient_id", nullable = false)
  private UUID patientId;

  /** Competência (mês de referência) no formato {@code AAAA-MM}. */
  @Column(nullable = false, length = 7)
  private String competence;

  @Column(name = "amount_cents", nullable = false)
  private long amountCents;

  @Column(name = "due_date", nullable = false)
  private LocalDate dueDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ChargeStatus status;

  @Embedded private SimpleInterestParams interest;

  @Embedded private Payment payment;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected ChargeEntity() {
    // Exigido pelo JPA.
  }

  public ChargeEntity(
      UUID id,
      UUID userId,
      UUID patientId,
      String competence,
      long amountCents,
      LocalDate dueDate,
      ChargeStatus status,
      SimpleInterestParams interest,
      Payment payment,
      OffsetDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.patientId = patientId;
    this.competence = competence;
    this.amountCents = amountCents;
    this.dueDate = dueDate;
    this.status = status;
    this.interest = interest;
    this.payment = payment;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getPatientId() {
    return patientId;
  }

  public String getCompetence() {
    return competence;
  }

  public long getAmountCents() {
    return amountCents;
  }

  public LocalDate getDueDate() {
    return dueDate;
  }

  public ChargeStatus getStatus() {
    return status;
  }

  public SimpleInterestParams getInterest() {
    return interest;
  }

  public Payment getPayment() {
    return payment;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
