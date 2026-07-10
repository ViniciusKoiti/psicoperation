package com.psiops.api.notification.email;

import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Envio de e-mail em texto simples via {@link JavaMailSender} (Mailpit em
 * dev, ver {@code spring.mail.*} em {@code application.yml}), com retry e
 * backoff exponencial para falhas transitórias de SMTP (PSI-029).
 *
 * <p><strong>Sem regra de negócio</strong>: esta classe só entrega uma
 * mensagem já pronta (assunto/corpo/destinatário resolvidos pelo chamador) -
 * ver restrição do manifesto PSI-029 ("nenhuma regra de negócio nova no
 * handler de e-mail").
 *
 * <p><strong>Isolamento do processador</strong>: o loop de retry abaixo é
 * bloqueante ({@link Thread#sleep}) de propósito - é seguro porque esta
 * classe só é chamada a partir do processing group {@code email-delivery}
 * (modo {@code tracking}, thread própria, ver {@code application.yml}),
 * nunca a partir de uma thread de requisição HTTP nem da thread única do
 * {@code SimpleDeadlineManager} (ver risco documentado no manifesto: "retries
 * agressivos... podem represar o event processor; isolar o handler em
 * processing group próprio").
 *
 * <p>Depois de esgotar {@code psiops.notification.email.retry.max-attempts}
 * tentativas, lança {@link EmailDeliveryFailedException} (falha definitiva) -
 * nunca propaga a {@link MailException} original além disso, para que o
 * chamador decida o registro final (log e/ou coluna de status) sem travar o
 * processador.
 */
@Component
public class RetryingEmailSender {

  private static final Logger log = LoggerFactory.getLogger(RetryingEmailSender.class);

  private final JavaMailSender mailSender;
  private final EmailProperties properties;

  public RetryingEmailSender(JavaMailSender mailSender, EmailProperties properties) {
    this.mailSender = mailSender;
    this.properties = properties;
  }

  /**
   * Envia um e-mail em texto simples, tentando até {@code max-attempts}
   * vezes com backoff exponencial entre tentativas. Lança {@link
   * EmailDeliveryFailedException} se todas as tentativas falharem.
   */
  public void send(String to, String subject, String body) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(properties.getFrom());
    message.setTo(to);
    message.setSubject(subject);
    message.setText(body);

    int maxAttempts = Math.max(1, properties.getRetry().getMaxAttempts());
    Duration backoff = properties.getRetry().getInitialBackoff();
    double multiplier = properties.getRetry().getMultiplier();

    MailException lastFailure = null;
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        mailSender.send(message);
        if (attempt > 1) {
          log.info("E-mail entregue para {} na tentativa {} de {}", to, attempt, maxAttempts);
        }
        return;
      } catch (MailException e) {
        lastFailure = e;
        log.warn("Falha transitória ao enviar e-mail para {} (tentativa {} de {}): {}", to, attempt, maxAttempts, e.getMessage());
        if (attempt < maxAttempts) {
          sleep(backoff);
          backoff = Duration.ofMillis((long) (backoff.toMillis() * multiplier));
        }
      }
    }
    throw new EmailDeliveryFailedException(
        "falha definitiva ao enviar e-mail para " + to + " após " + maxAttempts + " tentativas", lastFailure);
  }

  private void sleep(Duration duration) {
    try {
      Thread.sleep(duration.toMillis());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new EmailDeliveryFailedException("interrompido durante espera de retry de e-mail", e);
    }
  }
}
