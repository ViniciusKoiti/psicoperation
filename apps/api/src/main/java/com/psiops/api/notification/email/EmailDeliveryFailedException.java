package com.psiops.api.notification.email;

/**
 * Falha DEFINITIVA de envio (PSI-029): {@link RetryingEmailSender} esgotou o
 * número de tentativas configurado ({@code
 * psiops.notification.email.retry.max-attempts}) para uma falha transitória
 * de SMTP. Quem captura esta exceção decide o registro final (ex.: {@code
 * ReminderEmailHandler} marca o lembrete como {@code FALHOU}; {@code
 * ChargeOverdueEmailHandler} apenas loga, por não haver coluna própria para
 * cobranças) - nunca é deixada propagar para o processador Axon (isso o
 * travaria retendo redelivery indefinida do mesmo evento).
 */
public class EmailDeliveryFailedException extends RuntimeException {

  public EmailDeliveryFailedException(String message, Throwable cause) {
    super(message, cause);
  }
}
