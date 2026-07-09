package com.psiops.api.auth.web;

import com.psiops.api.auth.domain.AuthenticatedUser;
import java.util.UUID;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Resolve parâmetros anotados com {@link CurrentUserId} para o {@code userId}
 * do {@link AuthenticatedUser} corrente no {@code SecurityContextHolder} —
 * ver javadoc de {@link CurrentUserId} para o porquê deste ser o único
 * caminho suportado para obter o usuário autenticado.
 */
public class CurrentUserIdArgumentResolver implements HandlerMethodArgumentResolver {

  @Override
  public boolean supportsParameter(MethodParameter parameter) {
    return parameter.hasParameterAnnotation(CurrentUserId.class)
        && parameter.getParameterType().equals(UUID.class);
  }

  @Override
  public Object resolveArgument(
      MethodParameter parameter,
      ModelAndViewContainer mavContainer,
      NativeWebRequest webRequest,
      WebDataBinderFactory binderFactory) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
      // Só acontece se @CurrentUserId for usado numa rota pública (erro de
      // programação, não uma condição de cliente) — a rota deveria estar
      // protegida pelo JwtAuthenticationFilter antes de chegar aqui.
      throw new IllegalStateException(
          "@CurrentUserId usado numa rota sem autenticação JWT resolvida; "
              + "confira se a rota está protegida em SecurityConfig");
    }
    return user.userId();
  }
}
