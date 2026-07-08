package com.psiops.api.axon.config;

import org.axonframework.common.transaction.TransactionManager;
import org.axonframework.config.ConfigurationScopeAwareProvider;
import org.axonframework.deadline.DeadlineManager;
import org.axonframework.deadline.SimpleDeadlineManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registra o {@link DeadlineManager} usado pelos agregados para agendar
 * lembretes (base da PSI-029). O Axon Spring Boot NÃO fornece um
 * {@code DeadlineManager} por padrão (ao contrário de {@code CommandBus}/
 * {@code QueryBus}/{@code EventBus}) — é preciso declará-lo explicitamente.
 *
 * <p>Escolha do MVP: {@link SimpleDeadlineManager}, em memória. Ver a
 * decisão e a limitação (não sobrevive a restart) documentadas no
 * package-info deste pacote.
 */
@Configuration(proxyBeanMethods = false)
public class AxonDeadlineConfig {

  /**
   * O disparo do deadline roda numa thread própria do {@link
   * SimpleDeadlineManager}, fora de qualquer transação Spring. Como o handler
   * do deadline aplica um evento (persistido pelo event store JPA), é
   * obrigatório fornecer o {@link TransactionManager} do Axon: sem ele, a
   * execução do deadline falha com {@code TransactionRequiredException}.
   */
  @Bean
  public DeadlineManager deadlineManager(
      org.axonframework.config.Configuration axonConfiguration,
      TransactionManager transactionManager) {
    return SimpleDeadlineManager.builder()
        .scopeAwareProvider(new ConfigurationScopeAwareProvider(axonConfiguration))
        .transactionManager(transactionManager)
        .build();
  }
}
