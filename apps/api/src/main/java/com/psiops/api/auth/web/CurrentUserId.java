package com.psiops.api.auth.web;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Injeta o {@code userId} ({@link java.util.UUID}) da psicóloga autenticada
 * no parâmetro de um método de controller.
 *
 * <p>Este é o <strong>mecanismo único e documentado</strong> pelo qual
 * qualquer módulo do backend obtém o usuário autenticado — o alicerce do
 * isolamento multi-tenant estrito por {@code userId} usado a partir de
 * PSI-023. Nenhum módulo deve ler o {@code SecurityContextHolder} ou o
 * {@code Authentication} diretamente; sempre {@code @CurrentUserId UUID userId}
 * como parâmetro do método do controller.
 *
 * <pre>{@code
 * @GetMapping("/patients")
 * public PatientPage list(@CurrentUserId UUID userId) { ... }
 * }</pre>
 *
 * <p>Só resolve em rotas protegidas pelo {@link JwtAuthenticationFilter}
 * (toda rota exceto as listadas em {@link SecurityConfig} como públicas) —
 * usá-lo em uma rota pública é um erro de programação e lança
 * {@link IllegalStateException} em tempo de requisição (ver
 * {@link CurrentUserIdArgumentResolver}).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUserId {
}
