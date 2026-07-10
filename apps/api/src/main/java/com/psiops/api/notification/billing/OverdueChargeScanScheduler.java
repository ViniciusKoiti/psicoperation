package com.psiops.api.notification.billing;

import com.psiops.api.billing.application.ChargeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Varredura diária agendada de cobranças vencidas (PSI-029, acceptance
 * criteria do manifesto: "Verificação diária agendada detecta cobranças
 * vencidas e transiciona/emite conforme a regra do módulo financeiro").
 *
 * <p><strong>Sem regra de negócio própria</strong>: delega inteiramente a
 * {@link ChargeService#detectOverdueForAllUsers()} - a regra "vencida e sem
 * pagamento vira atrasada, publicando {@code cobranca.atrasada}" já existe e
 * é aplicada pelo agregado {@code ChargeEntity} desde a PSI-026; este
 * componente só fornece o GATILHO diário, independente de qualquer usuária
 * acessar o sistema (ao contrário da detecção síncrona já existente,
 * disparada a cada operação HTTP do módulo financeiro).
 *
 * <p><strong>Sem reidratação necessária</strong>: diferente do {@code
 * SimpleDeadlineManager} (que esquece agendamentos entre reinícios), {@code
 * @Scheduled} com {@code cron} é reavaliado pelo Spring TaskScheduler a cada
 * inicialização - nenhum estado precisa ser recuperado.
 *
 * <p>Cron default: 03:00 (horário do servidor/UTC) - fora do horário comercial
 * típico de uma psicóloga solo brasileira, configurável via {@code
 * psiops.notification.overdue-scan.cron}.
 */
@Component
public class OverdueChargeScanScheduler {

  private static final Logger log = LoggerFactory.getLogger(OverdueChargeScanScheduler.class);

  private final ChargeService chargeService;

  public OverdueChargeScanScheduler(ChargeService chargeService) {
    this.chargeService = chargeService;
  }

  @Scheduled(cron = "${psiops.notification.overdue-scan.cron:0 0 3 * * *}")
  public void scan() {
    log.info("iniciando varredura diária de cobranças vencidas (PSI-029)");
    chargeService.detectOverdueForAllUsers();
    log.info("varredura diária de cobranças vencidas concluída");
  }
}
