package com.psiops.api.axon;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.support.ContainersConfig;
import java.util.UUID;
import org.axonframework.eventhandling.GenericDomainEventMessage;
import org.axonframework.eventhandling.tokenstore.TokenStore;
import org.axonframework.eventhandling.tokenstore.jpa.JpaTokenStore;
import org.axonframework.eventsourcing.eventstore.DomainEventStream;
import org.axonframework.eventsourcing.eventstore.EventStorageEngine;
import org.axonframework.eventsourcing.eventstore.jpa.JpaEventStorageEngine;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Prova a fundação do Axon (PSI-011): a aplicação sobe sem tentar contatar um
 * Axon Server (não há dependência dele no classpath — connector excluído no
 * pom.xml, {@code axon.axonserver.enabled=false}), e a autoconfiguração
 * registra o event store e o token store JPA embutidos, apontando para o
 * PostgreSQL de teste (Testcontainers). O schema das tabelas do Axon é criado
 * pela migration V2 (PSI-021); o Hibernate roda em {@code ddl-auto: validate}
 * (mesmo valor de produção, ver package-info de {@code com.psiops.api.axon.config}).
 */
@SpringBootTest
@Import(ContainersConfig.class)
class AxonJpaEventStoreContextTest {

  @Autowired private EventStorageEngine eventStorageEngine;
  @Autowired private TokenStore tokenStore;
  @Autowired private TransactionTemplate transactionTemplate;

  @Test
  void contextLoadsWithJpaBackedEventStoreAndTokenStore() {
    assertThat(eventStorageEngine).isInstanceOf(JpaEventStorageEngine.class);
    assertThat(tokenStore).isInstanceOf(JpaTokenStore.class);
  }

  @Test
  void roundTripsAnEventThroughTheJpaEventStorageEngine() {
    String aggregateId = UUID.randomUUID().toString();
    var event =
        new GenericDomainEventMessage<>(
            "AxonJpaEventStoreContextTest", aggregateId, 0, "evento de prova do round-trip");

    transactionTemplate.executeWithoutResult(status -> eventStorageEngine.appendEvents(event));

    DomainEventStream stream =
        transactionTemplate.execute(status -> eventStorageEngine.readEvents(aggregateId));

    assertThat(stream).isNotNull();
    assertThat(stream.hasNext()).isTrue();
    assertThat(stream.next().getPayload()).isEqualTo("evento de prova do round-trip");
    assertThat(stream.hasNext()).isFalse();
  }
}
