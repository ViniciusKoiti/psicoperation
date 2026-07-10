package com.psiops.api.appointment.config;

import com.psiops.api.appointment.persistence.AppointmentEntity;
import java.util.UUID;
import org.axonframework.common.jpa.EntityManagerProvider;
import org.axonframework.eventhandling.EventBus;
import org.axonframework.modelling.command.GenericJpaRepository;
import org.axonframework.modelling.command.Repository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean do {@link Repository} do agregado de consulta ({@link
 * AppointmentEntity}). Agregados state-stored não usam o repositório
 * event-sourced padrão do Axon — precisam declarar explicitamente um {@code
 * GenericJpaRepository}, referenciado pelo nome do bean no atributo {@code
 * repository} de {@code @Aggregate} na própria entidade. Segue o gabarito de
 * {@code com.psiops.api.axonsample.config.SampleTaskAggregateRepositoryConfig}
 * (PSI-011), com um adicional: {@code identifierConverter(UUID::fromString)}.
 *
 * <p>Sem esse conversor, {@code GenericJpaRepository} chama {@code
 * entityManager.find(AppointmentEntity.class, aggregateIdentifierAsString)}
 * — o Axon resolve identificadores de agregado como {@code String} por
 * padrão (rotas de comando) — e falha ("Supplied id had wrong type") porque
 * {@link AppointmentEntity#getId()}/{@code @Id} é {@code UUID}, casando com
 * a coluna real {@code appointments.id} (migration V2, imutável, tipo
 * {@code uuid} — nenhuma migration foi criada para esta tarefa). O
 * conversor faz a ponte sem exigir que o campo Java do {@code @Id} vire
 * {@code String} (que quebraria {@code spring.jpa.hibernate.ddl-auto:
 * validate} contra a coluna {@code uuid}).
 */
@Configuration(proxyBeanMethods = false)
public class AppointmentAggregateRepositoryConfig {

  @Bean
  public Repository<AppointmentEntity> appointmentAggregateRepository(
      EntityManagerProvider entityManagerProvider,
      EventBus eventBus,
      org.axonframework.config.Configuration axonConfiguration) {
    return GenericJpaRepository.builder(AppointmentEntity.class)
        .entityManagerProvider(entityManagerProvider)
        .eventBus(eventBus)
        .repositoryProvider(axonConfiguration::repository)
        .identifierConverter(UUID::fromString)
        .build();
  }
}
