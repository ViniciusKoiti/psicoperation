package com.psiops.api.billing.persistence;

import com.psiops.api.billing.domain.command.CreateChargeCommand;
import com.psiops.api.billing.domain.command.MarkChargeOverdueCommand;
import com.psiops.api.billing.domain.command.RegisterChargePaymentCommand;
import com.psiops.api.billing.domain.ChargeAlreadyPaidException;
import com.psiops.api.billing.domain.event.ChargeCreatedEvent;
import com.psiops.api.billing.domain.event.ChargeOverdueDetectedEvent;
import com.psiops.api.billing.domain.event.ChargePaymentRegisteredEvent;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.commandhandling.CommandHandler;
import org.axonframework.eventsourcing.EventSourcingHandler;
import org.axonframework.modelling.command.AggregateIdentifier;
import org.axonframework.modelling.command.AggregateLifecycle;
import org.axonframework.spring.stereotype.Aggregate;

/**
 * Cobrança de mensalidade de um paciente, referente a uma competência (mês)
 * — tabela {@code charges}.
 *
 * <p>Espelha o schema {@code Charge} do contrato de billing (PSI-020).
 * {@code competence} é a competência no formato {@code AAAA-MM} (schema
 * {@code Competence}). Valores monetários SEMPRE em centavos ({@code
 * amountCents}, {@code Payment.paidAmountCents}, BIGINT) — nunca ponto
 * flutuante. Multi-tenant estrito: toda linha carrega {@code userId} da
 * psicóloga dona da cobrança.
 *
 * <p><strong>Agregado Axon state-stored (PSI-026)</strong>: mesmo padrão de
 * {@code com.psiops.api.appointment.persistence.AppointmentEntity} (PSI-024)
 * — esta classe é, simultaneamente, a entidade JPA de persistência e o
 * agregado Axon (repositório {@code GenericJpaRepository} explícito, ver
 * {@link com.psiops.api.billing.config.ChargeAggregateRepositoryConfig}). O
 * construtor "de dados" abaixo (todos os campos) permanece público e sem
 * anotação Axon — usado por testes de repositório (ex.: {@code
 * ChargeRepositoryTest}, PSI-021) e por qualquer código que precise
 * persistir uma linha diretamente via {@code ChargeRepository#save}, sem
 * passar pelo {@code CommandGateway}; a criação via caso de uso ({@code
 * ChargeService}) sempre usa o construtor anotado {@code @CommandHandler}.
 */
@Entity
@Table(name = "charges")
@Aggregate(repository = "chargeAggregateRepository")
public class ChargeEntity {

  @Id
  @AggregateIdentifier
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(name = "patient_id", nullable = false)
  private UUID patientId;

  /** Competência (mês de referência) no formato {@code AAAA-MM}. */
  @Column(nullable = false, length = 7)
  private String competence;

  @Column(name = "amount_cents", nullable = false)
  private long amountCents;

  @Column(name = "due_date", nullable = false)
  private LocalDate dueDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ChargeStatus status;

  @Embedded private SimpleInterestParams interest;

  @Embedded private Payment payment;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected ChargeEntity() {
    // Exigido pelo JPA.
  }

  public ChargeEntity(
      UUID id,
      UUID userId,
      UUID patientId,
      String competence,
      long amountCents,
      LocalDate dueDate,
      ChargeStatus status,
      SimpleInterestParams interest,
      Payment payment,
      OffsetDateTime createdAt) {
    this.id = id;
    this.userId = userId;
    this.patientId = patientId;
    this.competence = competence;
    this.amountCents = amountCents;
    this.dueDate = dueDate;
    this.status = status;
    this.interest = interest;
    this.payment = payment;
    this.createdAt = createdAt;
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getPatientId() {
    return patientId;
  }

  public String getCompetence() {
    return competence;
  }

  public long getAmountCents() {
    return amountCents;
  }

  public LocalDate getDueDate() {
    return dueDate;
  }

  public ChargeStatus getStatus() {
    return status;
  }

  public SimpleInterestParams getInterest() {
    return interest;
  }

  public Payment getPayment() {
    return payment;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  // ---------------------------------------------------------------------
  // Comandos e eventos Axon (PSI-026). Ver javadoc da classe: assim como no
  // agregado de agenda (PSI-024), os @CommandHandler só validam invariantes
  // do PRÓPRIO agregado; posse do paciente e detecção de atraso (que exigem
  // consultar outros repositórios) são responsabilidade do caso de uso
  // (ChargeService), antes de despachar o comando.
  // ---------------------------------------------------------------------

  @CommandHandler
  public ChargeEntity(CreateChargeCommand command) {
    AggregateLifecycle.apply(
        new ChargeCreatedEvent(
            command.chargeId(),
            command.userId(),
            command.patientId(),
            command.competence(),
            command.amountCents(),
            command.dueDate(),
            command.status(),
            command.interestMonthlyRatePercent(),
            command.interestFinePercent(),
            command.createdAt()));
  }

  @CommandHandler
  public void handle(RegisterChargePaymentCommand command) {
    if (payment != null) {
      // Idempotente do ponto de vista de negócio: cobrança já paga rejeita
      // um novo pagamento (409), nunca sobrescreve o pagamento existente.
      throw new ChargeAlreadyPaidException(id);
    }
    AggregateLifecycle.apply(
        new ChargePaymentRegisteredEvent(
            id, command.paidAmountCents(), command.paidAt(), command.method(), command.note()));
  }

  @CommandHandler
  public void handle(MarkChargeOverdueCommand command) {
    if (status == ChargeStatus.ATRASADA || payment != null) {
      // Idempotente: cobrança já atrasada (ou já paga entrementes) — nenhum
      // evento novo é publicado, garantindo que cobranca.atrasada nunca
      // duplique para a mesma cobrança.
      return;
    }
    AggregateLifecycle.apply(
        new ChargeOverdueDetectedEvent(
            UUID.randomUUID(), id, userId, patientId, competence, amountCents, dueDate, command.detectedAt()));
  }

  @EventSourcingHandler
  public void on(ChargeCreatedEvent event) {
    this.id = event.chargeId();
    this.userId = event.userId();
    this.patientId = event.patientId();
    this.competence = event.competence();
    this.amountCents = event.amountCents();
    this.dueDate = event.dueDate();
    this.status = event.status();
    this.interest =
        (event.interestMonthlyRatePercent() == null && event.interestFinePercent() == null)
            ? null
            : new SimpleInterestParams(event.interestMonthlyRatePercent(), event.interestFinePercent());
    this.payment = null;
    this.createdAt = event.createdAt();
  }

  @EventSourcingHandler
  public void on(ChargePaymentRegisteredEvent event) {
    this.payment = new Payment(event.paidAmountCents(), event.paidAt(), event.method(), event.note());
    this.status = ChargeStatus.EM_DIA;
  }

  @EventSourcingHandler
  public void on(ChargeOverdueDetectedEvent event) {
    this.status = ChargeStatus.ATRASADA;
  }
}
