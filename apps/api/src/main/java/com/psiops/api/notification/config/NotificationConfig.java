package com.psiops.api.notification.config;

import com.psiops.api.notification.email.EmailProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Habilita {@link EmailProperties} ({@code psiops.notification.email.*}) e o
 * agendamento de tarefas ({@code @Scheduled}) usado pela varredura diária de
 * cobranças vencidas ({@code
 * com.psiops.api.notification.billing.OverdueChargeScanScheduler}) - mesmo
 * padrão de {@code com.psiops.api.billing.config.ChargeAggregateRepositoryConfig}
 * habilitando {@code BillingProperties}.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(EmailProperties.class)
@EnableScheduling
public class NotificationConfig {}
