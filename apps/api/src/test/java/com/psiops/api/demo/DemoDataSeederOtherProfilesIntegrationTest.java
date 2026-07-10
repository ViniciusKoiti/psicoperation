package com.psiops.api.demo;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.auth.persistence.UserRepository;
import com.psiops.api.support.ContainersConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;

/**
 * Prova negativa do risco do manifesto PSI-046 ("seed executado por engano
 * fora do perfil demo poluiria ambientes reais"): com o perfil {@code demo}
 * INATIVO (nenhum {@code @ActiveProfiles} aqui — mesmo perfil "default" que
 * as demais suítes {@code *FlowIntegrationTest} usam, equivalente a dev/
 * produção sem a flag do perfil demo), {@link DemoDataSeeder} não é sequer
 * registrado no contexto, e nenhum dado de demonstração é criado.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@Import(ContainersConfig.class)
class DemoDataSeederOtherProfilesIntegrationTest {

  @Autowired private ApplicationContext applicationContext;
  @Autowired private UserRepository userRepository;

  @Test
  void demoSeederBeanIsNotRegisteredOutsideTheDemoProfile() {
    assertThat(applicationContext.getBeanNamesForType(DemoDataSeeder.class)).isEmpty();
  }

  @Test
  void noDemoDataIsSeededOutsideTheDemoProfile() {
    assertThat(userRepository.findByEmail(DemoDataSeeder.DEMO_EMAIL)).isEmpty();
  }
}
