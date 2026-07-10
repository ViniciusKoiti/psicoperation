package com.psiops.api.reminder.domain;

import java.util.UUID;

/**
 * O vínculo opcional informado na criação do lembrete (paciente, consulta ou
 * cobrança) não corresponde a um recurso existente <strong>da psicóloga
 * autenticada</strong> — seja porque o id simplesmente não existe, seja
 * porque existe mas pertence a outra usuária. De propósito, os dois casos são
 * indistinguíveis pelo cliente: 404 sempre, nunca 403 nem 400, para não
 * vazar a existência de um recurso de outro tenant (acceptance criteria do
 * manifesto PSI-027 — difere do padrão 400 usado por {@code
 * com.psiops.api.billing.domain.InvalidChargeStateException} para o mesmo
 * tipo de checagem em outro módulo).
 */
public class ReminderLinkNotFoundException extends RuntimeException {

  public ReminderLinkNotFoundException(String resourceName, UUID resourceId) {
    super(resourceName + " não encontrado(a) para esta psicóloga: " + resourceId);
  }
}
