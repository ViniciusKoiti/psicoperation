package com.psiops.api.notification.billing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.psiops.api.billing.application.BillingProperties;
import com.psiops.api.billing.application.ChargeService;
import com.psiops.api.billing.domain.command.MarkChargeOverdueCommand;
import com.psiops.api.billing.persistence.ChargeEntity;
import com.psiops.api.billing.persistence.ChargeRepository;
import com.psiops.api.billing.persistence.ChargeStatus;
import com.psiops.api.patient.persistence.PatientRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Testes de {@link ChargeService#detectOverdueForAllUsers()} (PSI-029) - a
 * varredura diária chamada por {@link OverdueChargeScanScheduler}, que
 * amplia a SUPERFÍCIE de disparo da regra já existente do módulo financeiro
 * (PSI-026) para todas as usuárias, sem reimplementá-la (ver javadoc do
 * método): dispara o MESMO {@link MarkChargeOverdueCommand} usado por {@code
 * ChargeService#detectOverdueForUser}, agora escopado a {@link
 * ChargeRepository#findByStatusAndDueDateBefore}, sem filtro de {@code
 * userId}.
 */
class ChargeServiceOverdueScanTest {

  private final ChargeRepository chargeRepository = mock(ChargeRepository.class);
  private final PatientRepository patientRepository = mock(PatientRepository.class);
  private final CommandGateway commandGateway = mock(CommandGateway.class);
  private final ChargeService chargeService =
      new ChargeService(chargeRepository, patientRepository, commandGateway, new BillingProperties());

  private ChargeEntity pendingOverdue(UUID id, LocalDate dueDate) {
    return new ChargeEntity(
        id, UUID.randomUUID(), UUID.randomUUID(), "2026-07", 15000L, dueDate, ChargeStatus.PENDENTE, null, null,
        OffsetDateTime.now(ZoneOffset.UTC).minusDays(5));
  }

  @Test
  void detectOverdueForAllUsers_dispatchesMarkOverdueCommandForEveryCandidate_acrossAllTenants() {
    UUID chargeA = UUID.randomUUID();
    UUID chargeB = UUID.randomUUID();
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    when(chargeRepository.findByStatusAndDueDateBefore(ChargeStatus.PENDENTE, today))
        .thenReturn(List.of(pendingOverdue(chargeA, today.minusDays(3)), pendingOverdue(chargeB, today.minusDays(1))));

    chargeService.detectOverdueForAllUsers();

    ArgumentCaptor<MarkChargeOverdueCommand> captor = ArgumentCaptor.forClass(MarkChargeOverdueCommand.class);
    verify(commandGateway, times(2)).sendAndWait(captor.capture());
    assertThat(captor.getAllValues()).extracting(MarkChargeOverdueCommand::chargeId).containsExactlyInAnyOrder(chargeA, chargeB);
  }

  @Test
  void detectOverdueForAllUsers_withNoCandidates_dispatchesNothing() {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    when(chargeRepository.findByStatusAndDueDateBefore(ChargeStatus.PENDENTE, today)).thenReturn(List.of());

    chargeService.detectOverdueForAllUsers();

    verify(commandGateway, org.mockito.Mockito.never()).sendAndWait(any());
  }
}
