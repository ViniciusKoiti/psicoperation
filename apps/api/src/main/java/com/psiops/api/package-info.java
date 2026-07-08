/**
 * Backend único do PsiOps.
 *
 * <h2>Convenção de organização (orienta todas as features futuras)</h2>
 *
 * O código é organizado por <strong>módulos de domínio</strong>: cada domínio
 * é um pacote de topo sob {@code com.psiops.api} (ex.: {@code auth},
 * {@code lead}, {@code settings}). Dentro de cada módulo, as classes se
 * distribuem em quatro camadas:
 *
 * <ul>
 *   <li>{@code web} — controllers / adaptadores de entrada HTTP;</li>
 *   <li>{@code application} — casos de uso e orquestração (mappers, serviços);</li>
 *   <li>{@code domain} — modelo de domínio (no futuro, agregados state-stored
 *       do Axon Framework);</li>
 *   <li>{@code persistence} — entidades JPA e repositórios Spring Data.</li>
 * </ul>
 *
 * <p>Neste scaffold só existem as camadas efetivamente exercitadas
 * ({@code persistence} nos três módulos e {@code application} no módulo
 * {@code lead}); as demais surgem à medida que as features chegam. Não há
 * endpoints de negócio ainda — apenas {@code /actuator/health}.
 *
 * <p>Contratos: os DTOs de API vêm de {@code com.psiops.contracts.model}
 * (codegen de {@code packages/contracts}); nunca redefinidos aqui.
 */
package com.psiops.api;
