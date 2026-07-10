package com.psiops.api.notification.billing;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.psiops.api.billing.application.ChargeService;
import org.junit.jupiter.api.Test;

/**
 * Verifica que a varredura agendada (PSI-029) apenas CHAMA {@link
 * ChargeService#detectOverdueForAllUsers()} - nenhuma lógica própria de
 * detecção de atraso vive aqui (ver javadoc da classe).
 */
class OverdueChargeScanSchedulerTest {

  @Test
  void scan_delegatesEntirelyToChargeService() {
    ChargeService chargeService = mock(ChargeService.class);
    OverdueChargeScanScheduler scheduler = new OverdueChargeScanScheduler(chargeService);

    scheduler.scan();

    verify(chargeService, times(1)).detectOverdueForAllUsers();
  }
}
