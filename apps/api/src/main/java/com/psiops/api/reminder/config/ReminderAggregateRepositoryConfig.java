package com.psiops.api.reminder.config;

import com.psiops.api.reminder.persistence.ReminderEntity;
import java.util.UUID;
import org.axonframework.common.jpa.EntityManagerProvider;
import org.axonframework.eventhandling.EventBus;
import org.axonframework.modelling.command.GenericJpaRepository;
import org.axonframework.modelling.command.Repository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean do {@link Repository} do agregado de lembrete ({@link
 * ReminderEntity}). Agregados state-stored não usam o repositório
 * event-sourced padrão do Axon — precisam declarar explicitamente um {@code
 * GenericJpaRepository}, referenciado pelo nome do bean no atributo {@code
 * repository} de {@code @Aggregate} na própria entidade. Mesmo gabarito de
 * {@code com.psiops.api.appointment.config.AppointmentAggregateRepositoryConfig}
 * (PSI-024), com {@code identifierConverter(UUID::fromString)} pelo mesmo
 * motivo: {@link ReminderEntity#getId()}/{@code @Id} é {@code UUID}, casando
 * com a coluna real {@code reminders.id} (migration V2, imutável, tipo {@code
 * uuid} — nenhuma migration foi criada para esta tarefa).
 */
@Configuration(proxyBeanMethods = false)
public class ReminderAggregateRepositoryConfig {

  @Bean
  public Repository<ReminderEntity> reminderAggregateRepository(
      EntityManagerProvider entityManagerProvider,
      EventBus eventBus,
      org.axonframework.config.Configuration axonConfiguration) {
    return GenericJpaRepository.builder(ReminderEntity.class)
        .entityManagerProvider(entityManagerProvider)
        .eventBus(eventBus)
        .repositoryProvider(axonConfiguration::repository)
        .identifierConverter(UUID::fromString)
        .build();
  }
}
