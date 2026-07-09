package com.psiops.api.patient.application;

import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientStatus;
import com.psiops.contracts.model.Patient;

/**
 * Converte entre {@link PatientEntity} (persistência) e o DTO de contrato
 * {@link Patient} (gerado de {@code packages/contracts}). O campo {@code
 * userId} nunca aparece no DTO — o escopo multi-tenant é implícito no bearer
 * token (ver schema {@code Patient} em {@code components/patient/schemas.yaml}).
 *
 * <p>Os enums de status são intencionalmente dois tipos distintos (persistência
 * vs. contrato, ver javadoc de {@link PatientStatus}); a conversão entre eles é
 * por nome de constante, já que os valores são os mesmos ({@code ATIVO}/{@code
 * INATIVO}).
 */
public final class PatientMapper {

  private PatientMapper() {
  }

  public static Patient toContract(PatientEntity entity) {
    return new Patient(
            entity.getId(),
            entity.getName(),
            entity.getMonthlyFeeCents(),
            entity.getBillingDay(),
            toContractStatus(entity.getStatus()),
            entity.getCreatedAt())
        .whatsapp(entity.getWhatsapp())
        .email(entity.getEmail())
        .notes(entity.getNotes());
  }

  public static com.psiops.contracts.model.PatientStatus toContractStatus(PatientStatus status) {
    return com.psiops.contracts.model.PatientStatus.valueOf(status.name());
  }

  public static PatientStatus toPersistenceStatus(com.psiops.contracts.model.PatientStatus status) {
    return PatientStatus.valueOf(status.name());
  }
}
