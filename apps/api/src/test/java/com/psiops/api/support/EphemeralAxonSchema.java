package com.psiops.api.support;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.test.context.TestPropertySource;

/**
 * Aplica {@code spring.jpa.hibernate.ddl-auto=update} apenas em teste.
 *
 * <p>Em produção o Flyway é o dono do schema ({@code ddl-auto: validate} em
 * {@code application.yml}, inalterado). As tabelas do event store, do token
 * store e do saga store do Axon (PSI-011) ainda não têm migration Flyway —
 * {@code apps/api/src/main/resources/db/migration/**} é caminho proibido
 * nesta tarefa; a migration definitiva (V2) é responsabilidade da PSI-021.
 * Como o Axon registra essas entidades JPA automaticamente assim que
 * spring-data-jpa está no classpath e o Axon Server está ausente (ver
 * package-info de {@code com.psiops.api.axon.config}), TODO teste que sobe o
 * contexto Spring completo precisa dessa anotação — mesmo os que não mexem
 * com Axon diretamente (ex.: {@code HealthEndpointTest}) — porque todos
 * compartilham a mesma unidade de persistência.
 *
 * <p><strong>Por que não um {@code src/test/resources/application.yml}:</strong>
 * Spring Boot resolve {@code classpath:/application.yml} para um único
 * recurso — quando existe também um em {@code src/test/resources}, ele
 * <em>substitui inteiramente</em> o de {@code src/main/resources} (não há
 * merge), silenciando todo o resto da configuração de produção nos testes
 * (datasource, Flyway, actuator, o próprio bloco {@code axon:}). Foi
 * verificado empiricamente que isso quebrava {@code
 * axon.eventhandling.processors.axonsample.mode} sem nenhum teste acusar o
 * problema (os defaults do Spring coincidiam com os valores esperados). Um
 * {@link TestPropertySource} aditivo, aplicado só na classe de teste, evita
 * esse risco.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=update")
public @interface EphemeralAxonSchema {}
