package com.psiops.api.lead.config;

import com.psiops.api.lead.application.LeadRateLimitProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Habilita {@link LeadRateLimitProperties} ({@code
 * psiops.security.rate-limit.leads} em {@code application.yml}) — mesmo
 * padrão de {@code com.psiops.api.auth.web.SecurityConfig} habilitando
 * {@code LoginRateLimitProperties} e de {@code
 * com.psiops.api.billing.config.ChargeAggregateRepositoryConfig} habilitando
 * {@code BillingProperties}.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(LeadRateLimitProperties.class)
public class LeadConfig {
}
