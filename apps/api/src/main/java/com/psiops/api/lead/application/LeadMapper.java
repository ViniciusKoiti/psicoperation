package com.psiops.api.lead.application;

import com.psiops.api.lead.persistence.LeadEntity;
import com.psiops.contracts.model.Lead;

/**
 * Converte a entidade de persistência {@link LeadEntity} no DTO de contrato
 * {@link Lead} (gerado de {@code openapi.yaml}, pacote
 * {@code com.psiops.contracts.model}).
 *
 * <p>Existe já no scaffold para provar o consumo dos contratos Java como
 * dependência Maven — a fronteira entre modelo interno e contrato de API fica
 * explícita desde o início. A direção inversa (request → entidade) chega com o
 * endpoint de criação de lead, em tarefa de feature.
 */
public final class LeadMapper {

  private LeadMapper() {
  }

  public static Lead toContract(LeadEntity entity) {
    return new Lead(
        entity.getId(),
        entity.getName(),
        entity.getWhatsapp(),
        entity.getEmail(),
        entity.getCreatedAt());
  }
}
