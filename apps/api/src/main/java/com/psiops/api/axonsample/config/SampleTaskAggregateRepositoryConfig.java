package com.psiops.api.axonsample.config;

import com.psiops.api.axonsample.domain.SampleTaskAggregate;
import org.axonframework.common.jpa.EntityManagerProvider;
import org.axonframework.eventhandling.EventBus;
import org.axonframework.modelling.command.GenericJpaRepository;
import org.axonframework.modelling.command.Repository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean do {@link Repository} do agregado exemplo. Agregados state-stored não
 * usam o repositório event-sourced padrão do Axon — cada agregado precisa
 * declarar explicitamente um {@code GenericJpaRepository}, referenciado pelo
 * nome do bean no atributo {@code repository} de {@code @Aggregate} na
 * própria classe do agregado. Este é o gabarito para os módulos de domínio
 * reais (ver package-info de {@code com.psiops.api.axonsample}).
 */
@Configuration(proxyBeanMethods = false)
public class SampleTaskAggregateRepositoryConfig {

  @Bean
  public Repository<SampleTaskAggregate> sampleTaskAggregateRepository(
      EntityManagerProvider entityManagerProvider,
      EventBus eventBus,
      org.axonframework.config.Configuration axonConfiguration) {
    return GenericJpaRepository.builder(SampleTaskAggregate.class)
        .entityManagerProvider(entityManagerProvider)
        .eventBus(eventBus)
        .repositoryProvider(axonConfiguration::repository)
        .build();
  }
}
