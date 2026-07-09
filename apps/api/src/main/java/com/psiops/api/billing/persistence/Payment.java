package com.psiops.api.billing.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.OffsetDateTime;

/**
 * Registro de pagamento de uma cobrança (embutido em {@link ChargeEntity}).
 * Espelha o schema {@code Payment} do contrato de billing (PSI-020). Valor
 * monetário SEMPRE em centavos ({@code paidAmountCents}, BIGINT).
 */
@Embeddable
public class Payment {

  @Column(name = "paid_amount_cents")
  private Long paidAmountCents;

  @Column(name = "paid_at")
  private OffsetDateTime paidAt;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_method", length = 20)
  private PaymentMethod method;

  @Column(name = "payment_note", length = 500)
  private String note;

  protected Payment() {
    // Exigido pelo JPA.
  }

  public Payment(Long paidAmountCents, OffsetDateTime paidAt, PaymentMethod method, String note) {
    this.paidAmountCents = paidAmountCents;
    this.paidAt = paidAt;
    this.method = method;
    this.note = note;
  }

  public Long getPaidAmountCents() {
    return paidAmountCents;
  }

  public OffsetDateTime getPaidAt() {
    return paidAt;
  }

  public PaymentMethod getMethod() {
    return method;
  }

  public String getNote() {
    return note;
  }
}
