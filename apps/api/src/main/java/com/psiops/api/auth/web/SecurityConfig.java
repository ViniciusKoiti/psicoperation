package com.psiops.api.auth.web;

import com.psiops.api.auth.application.JwtProperties;
import com.psiops.api.auth.application.JwtService;
import com.psiops.api.auth.application.LoginRateLimitProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security stateless (sem sessão, sem cookie) com autenticação por
 * JWT (PSI-022).
 *
 * <p><strong>Rotas públicas</strong> (sem token): {@code /auth/register},
 * {@code /auth/login}, {@code /auth/refresh} — a própria credencial de
 * autenticação nesses três é o payload (senha ou refresh token), não um
 * bearer token ainda válido; {@code /leads/**} — endpoint da lista de espera
 * pública da landing (contrato já definido, controller chega em PSI-028,
 * mas a regra de acesso já é fixada aqui para não exigir revisão de
 * segurança quando aquele endpoint for implementado); e
 * {@code /actuator/health/**} — sonda de infraestrutura. Toda outra rota
 * exige um access token JWT válido (ver {@link JwtAuthenticationFilter}).
 */
@Configuration
@EnableWebSecurity
@EnableConfigurationProperties({JwtProperties.class, LoginRateLimitProperties.class})
public class SecurityConfig {

  private static final String[] PUBLIC_PATHS = {
      "/auth/register",
      "/auth/login",
      "/auth/refresh",
      "/leads/**",
      "/actuator/health/**",
      "/actuator/health"
  };

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService) throws Exception {
    http
        .csrf(csrf -> csrf.disable()) // API stateless sem cookie de sessão: sem CSRF a proteger.
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .httpBasic(basic -> basic.disable())
        .formLogin(form -> form.disable())
        .exceptionHandling(handling -> handling.authenticationEntryPoint(new JwtAuthenticationEntryPoint()))
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers(PUBLIC_PATHS).permitAll()
            .anyRequest().authenticated())
        .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }
}
