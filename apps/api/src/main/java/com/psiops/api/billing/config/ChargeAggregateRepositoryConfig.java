package com.psiops.api.billing.config;

import com.psiops.api.billing.application.BillingProperties;
import com.psiops.api.billing.persistence.ChargeEntity;
import java.util.UUID;
import org.axonframework.common.jpa.EntityManagerProvider;
import org.axonframework.eventhandling.EventBus;
import org.axonframework.modelling.command.GenericJpaRepository;
import org.axonframework.modelling.command.Repository;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean do {@link Repository} do agregado de cobrança ({@link ChargeEntity}).
 * Mesmo gabarito de {@code
 * com.psiops.api.appointment.config.AppointmentAggregateRepositoryConfig}
 * (PSI-024): agregados state-stored precisam declarar explicitamente um
 * {@code GenericJpaRepository}, referenciado pelo nome do bean no atributo
 * {@code repository} de {@code @Aggregate} na própria entidade, com um
 * {@code identifierConverter(UUID::fromString)} porque o Axon resolve
 * identificadores de agregado como {@code String} por padrão, mas {@link
 * ChargeEntity#getId()}/{@code @Id} é {@code UUID} (coluna real {@code
 * charges.id}, migration V2, imutável — nenhuma migration foi criada para
 * esta tarefa).
 *
 * <p>Também habilita {@link BillingProperties} ({@code psiops.billing.*} em
 * {@code application.yml}) — mesmo padrão de {@code
 * com.psiops.api.auth.web.SecurityConfig} habilitando {@code JwtProperties}.
 */
@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(BillingProperties.class)
public class ChargeAggregateRepositoryConfig {

  @Bean
  public Repository<ChargeEntity> chargeAggregateRepository(
      EntityManagerProvider entityManagerProvider,
      EventBus eventBus,
      org.axonframework.config.Configuration axonConfiguration) {
    return GenericJpaRepository.builder(ChargeEntity.class)
        .entityManagerProvider(entityManagerProvider)
        .eventBus(eventBus)
        .repositoryProvider(axonConfiguration::repository)
        .identifierConverter(UUID::fromString)
        .build();
  }
}
