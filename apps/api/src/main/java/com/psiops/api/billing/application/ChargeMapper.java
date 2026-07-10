package com.psiops.api.billing.application;

import com.psiops.api.billing.persistence.ChargeEntity;
import com.psiops.contracts.model.Charge;
import com.psiops.contracts.model.ChargeStatus;
import com.psiops.contracts.model.Payment;
import com.psiops.contracts.model.PaymentMethod;
import com.psiops.contracts.model.SimpleInterestParams;

/**
 * Converte entre {@link ChargeEntity} (persistência/agregado) e o DTO de
 * contrato {@link Charge} (gerado de {@code packages/contracts}). O campo
 * {@code userId} nunca aparece no DTO — o escopo multi-tenant é implícito no
 * bearer token (mesmo padrão de {@code
 * com.psiops.api.appointment.application.AppointmentMapper}).
 *
 * <p>Os enums de status/meio de pagamento são intencionalmente dois tipos
 * distintos (persistência vs. contrato); a conversão é por nome de
 * constante, já que os valores são os mesmos (ex.: {@code EM_DIA}, {@code
 * PIX}).
 */
public final class ChargeMapper {

  private ChargeMapper() {}

  public static Charge toContract(ChargeEntity entity) {
    Charge charge =
        new Charge(
            entity.getId(),
            entity.getPatientId(),
            entity.getCompetence(),
            entity.getAmountCents(),
            entity.getDueDate(),
            toContractStatus(entity.getStatus()),
            entity.getCreatedAt());
    if (entity.getInterest() != null) {
      charge.interest(
          new SimpleInterestParams(
              entity.getInterest().getMonthlyRatePercent(), entity.getInterest().getFinePercent()));
    }
    if (entity.getPayment() != null) {
      Payment payment =
          new Payment(
              entity.getPayment().getPaidAmountCents(),
              entity.getPayment().getPaidAt(),
              toContractMethod(entity.getPayment().getMethod()));
      payment.note(entity.getPayment().getNote());
      charge.payment(payment);
    }
    return charge;
  }

  public static ChargeStatus toContractStatus(com.psiops.api.billing.persistence.ChargeStatus status) {
    return ChargeStatus.valueOf(status.name());
  }

  public static com.psiops.api.billing.persistence.ChargeStatus toPersistenceStatus(ChargeStatus status) {
    return com.psiops.api.billing.persistence.ChargeStatus.valueOf(status.name());
  }

  public static PaymentMethod toContractMethod(com.psiops.api.billing.persistence.PaymentMethod method) {
    return PaymentMethod.valueOf(method.name());
  }

  public static com.psiops.api.billing.persistence.PaymentMethod toPersistenceMethod(PaymentMethod method) {
    return com.psiops.api.billing.persistence.PaymentMethod.valueOf(method.name());
  }
}
