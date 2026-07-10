package com.psiops.api.notification.email;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Testes de {@link RetryingEmailSender} (PSI-029): retry com backoff
 * exponencial para falha transitória de SMTP, sucesso após retry, e falha
 * definitiva após esgotar {@code max-attempts} - {@link JavaMailSender}
 * mockado (nunca depende de Mailpit rodando, ver instrução de validação do
 * manifesto).
 */
class RetryingEmailSenderTest {

  private EmailProperties properties() {
    EmailProperties properties = new EmailProperties();
    properties.setFrom("PsiOps <no-reply@psiops.local>");
    properties.getRetry().setMaxAttempts(3);
    properties.getRetry().setInitialBackoff(Duration.ofMillis(1));
    properties.getRetry().setMultiplier(1.0);
    return properties;
  }

  @Test
  void sendsSuccessfully_onFirstAttempt_noRetry() {
    JavaMailSender mailSender = mock(JavaMailSender.class);
    RetryingEmailSender sender = new RetryingEmailSender(mailSender, properties());

    sender.send("paciente@exemplo.com", "Assunto", "Corpo");

    verify(mailSender, times(1)).send(any(org.springframework.mail.SimpleMailMessage.class));
  }

  @Test
  void transientFailureThenSuccess_retriesAndDelivers() {
    JavaMailSender mailSender = mock(JavaMailSender.class);
    doThrow(new MailSendException("smtp indisponível"))
        .doNothing()
        .when(mailSender)
        .send(any(org.springframework.mail.SimpleMailMessage.class));
    RetryingEmailSender sender = new RetryingEmailSender(mailSender, properties());

    sender.send("paciente@exemplo.com", "Assunto", "Corpo");

    verify(mailSender, times(2)).send(any(org.springframework.mail.SimpleMailMessage.class));
  }

  @Test
  void allAttemptsFail_throwsEmailDeliveryFailedException_afterMaxAttempts() {
    JavaMailSender mailSender = mock(JavaMailSender.class);
    doThrow(new MailSendException("smtp indisponível")).when(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
    RetryingEmailSender sender = new RetryingEmailSender(mailSender, properties());

    assertThatThrownBy(() -> sender.send("paciente@exemplo.com", "Assunto", "Corpo"))
        .isInstanceOf(EmailDeliveryFailedException.class);

    verify(mailSender, times(3)).send(any(org.springframework.mail.SimpleMailMessage.class));
  }
}
