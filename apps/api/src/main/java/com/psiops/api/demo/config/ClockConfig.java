package com.psiops.api.demo.config;

import java.time.Clock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Fornece o {@link Clock} usado por {@code com.psiops.api.demo.DemoDataSeeder}
 * para calcular "a data de execução" (agenda de 2 semanas, vencimentos de
 * mensalidade) — nunca lida diretamente de {@code LocalDate.now()}/{@code
 * OffsetDateTime.now()} sem argumento, exatamente para permitir que testes
 * substituam este bean por um {@link Clock#fixed} e verifiquem o
 * determinismo relativo à data (risco do manifesto PSI-046).
 *
 * <p>Bean simples, sem restrição de perfil: nenhum outro componente do
 * módulo consome {@link Clock} hoje, então registrá-lo incondicionalmente
 * não tem efeito colateral fora do perfil {@code demo} (onde {@code
 * DemoDataSeeder} é o único consumidor). {@code @ConditionalOnMissingBean}
 * permite que um teste importe um {@code Clock} fixo próprio sem colidir.
 */
@Configuration(proxyBeanMethods = false)
public class ClockConfig {

  @Bean
  @ConditionalOnMissingBean(Clock.class)
  public Clock clock() {
    return Clock.systemUTC();
  }
}
