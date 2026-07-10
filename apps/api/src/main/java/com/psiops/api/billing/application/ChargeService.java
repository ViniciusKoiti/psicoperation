package com.psiops.api.billing.application;

import com.psiops.api.billing.domain.ChargeAlreadyExistsException;
import com.psiops.api.billing.domain.ChargeNotFoundException;
import com.psiops.api.billing.domain.InvalidChargeStateException;
import com.psiops.api.billing.domain.command.CreateChargeCommand;
import com.psiops.api.billing.domain.command.MarkChargeOverdueCommand;
import com.psiops.api.billing.domain.command.RegisterChargePaymentCommand;
import com.psiops.api.billing.persistence.ChargeEntity;
import com.psiops.api.billing.persistence.ChargeRepository;
import com.psiops.api.billing.persistence.ChargeStatus;
import com.psiops.api.billing.web.DelinquencyItem;
import com.psiops.api.billing.web.DelinquencySummary;
import com.psiops.api.billing.web.GenerateChargesResponse;
import com.psiops.api.patient.persistence.PatientEntity;
import com.psiops.api.patient.persistence.PatientRepository;
import com.psiops.api.patient.persistence.PatientStatus;
import com.psiops.contracts.model.Charge;
import com.psiops.contracts.model.ChargePage;
import com.psiops.contracts.model.CreateChargeRequest;
import com.psiops.contracts.model.PageMeta;
import com.psiops.contracts.model.RegisterPaymentRequest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Casos de uso do módulo financeiro de mensalidades (PSI-026): emissão de
 * cobrança avulsa, geração idempotente das mensalidades do mês, registro de
 * pagamento, listagem, visão de inadimplência (com totais) e juros simples.
 *
 * <p><strong>Isolamento multi-tenant estrito</strong>: todo método recebe
 * {@code userId} (resolvido pelo controller via {@code @CurrentUserId}) e
 * toda consulta/gravação passa por um método de {@link ChargeRepository} que
 * filtra por {@code userId} — nunca um {@code findById} puro. Uma cobrança
 * de outra usuária é tratada como inexistente: {@link
 * ChargeNotFoundException} (404) para operações por id, lista/página vazia
 * para listagens — nunca 403.
 *
 * <p><strong>Detecção de atraso (assumption do manifesto PSI-026)</strong>:
 * acontece nas operações do próprio módulo (consulta, listagem, geração
 * mensal, registro de pagamento) — nunca por uma varredura diária proativa
 * (isso é responsabilidade da PSI-029, fora de escopo). {@link
 * #detectOverdueForUser} é chamado no início de todo método público que lê
 * ou grava cobranças da usuária, varre as cobranças {@code pendente}
 * vencidas e despacha {@link MarkChargeOverdueCommand} para cada uma — o
 * próprio agregado garante que o evento {@code cobranca.atrasada} nunca seja
 * publicado duas vezes para a mesma cobrança (ver {@code
 * ChargeEntity#handle(MarkChargeOverdueCommand)}).
 *
 * <p><strong>Idempotência da geração mensal</strong>: apoiada na chave
 * natural {@code userId + patientId + competence} — antes de criar,
 * consulta-se {@link ChargeRepository#findByUserIdAndCompetence} e só se
 * emite cobrança para pacientes ATIVOS ainda não presentes nesse conjunto.
 * Sem um índice único no banco (migration V2 imutável, nenhuma nova
 * migration nesta tarefa — ver {@code out_of_scope} do manifesto), a
 * garantia vale para chamadas sequenciais (inclusive repetidas), que é o que
 * os testes de aceite exercitam; verdadeira exclusão mútua sob requisições
 * concorrentes exigiria uma constraint única em {@code charges}, registrada
 * como risco/assumption no PR.
 */
@Service
public class ChargeService {

  private static final int MAX_PAGE_SIZE = 100;

  private final ChargeRepository chargeRepository;
  private final PatientRepository patientRepository;
  private final CommandGateway commandGateway;
  private final BillingProperties billingProperties;

  public ChargeService(
      ChargeRepository chargeRepository,
      PatientRepository patientRepository,
      CommandGateway commandGateway,
      BillingProperties billingProperties) {
    this.chargeRepository = chargeRepository;
    this.patientRepository = patientRepository;
    this.commandGateway = commandGateway;
    this.billingProperties = billingProperties;
  }

  @Transactional
  public Charge create(UUID userId, CreateChargeRequest request) {
    detectOverdueForUser(userId);

    PatientEntity patient = assertPatientOwnedAndActive(userId, request.getPatientId());
    assertNotDuplicate(userId, request.getPatientId(), request.getCompetence());

    Double monthlyRatePercent;
    Double finePercent;
    if (request.getInterest() != null) {
      monthlyRatePercent = request.getInterest().getMonthlyRatePercent();
      finePercent = request.getInterest().getFinePercent();
    } else {
      monthlyRatePercent = billingProperties.getDefaultInterest().getMonthlyRatePercent();
      finePercent = billingProperties.getDefaultInterest().getFinePercent();
    }

    UUID chargeId = UUID.randomUUID();
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    commandGateway.sendAndWait(
        new CreateChargeCommand(
            chargeId,
            userId,
            patient.getId(),
            request.getCompetence(),
            request.getAmount(),
            request.getDueDate(),
            ChargeStatus.PENDENTE,
            monthlyRatePercent,
            finePercent,
            now));

    // A cobrança pode já nascer vencida (dueDate no passado) — a varredura
    // logo abaixo transiciona para ATRASADA e publica cobranca.atrasada
    // ainda dentro desta mesma operação (ver javadoc da classe).
    detectOverdueForUser(userId);

    return ChargeMapper.toContract(findOwned(userId, chargeId));
  }

  @Transactional
  public Charge get(UUID userId, UUID chargeId) {
    detectOverdueForUser(userId);
    return ChargeMapper.toContract(findOwned(userId, chargeId));
  }

  @Transactional
  public ChargePage list(
      UUID userId, int page, int size, UUID patientId, String competence, String statusParam) {
    detectOverdueForUser(userId);

    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    ChargeStatus status = resolveStatus(statusParam);
    Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "dueDate"));

    Page<ChargeEntity> result = chargeRepository.search(userId, patientId, competence, status, pageable);

    List<Charge> items = result.getContent().stream().map(ChargeMapper::toContract).toList();
    PageMeta meta = new PageMeta(result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    return new ChargePage(items, meta);
  }

  @Transactional
  public Charge registerPayment(UUID userId, UUID chargeId, RegisterPaymentRequest request) {
    detectOverdueForUser(userId);

    ChargeEntity existing = findOwned(userId, chargeId);
    commandGateway.sendAndWait(
        new RegisterChargePaymentCommand(
            existing.getId(),
            request.getPaidAmount(),
            request.getPaidAt(),
            ChargeMapper.toPersistenceMethod(request.getMethod()),
            request.getNote()));

    return ChargeMapper.toContract(findOwned(userId, chargeId));
  }

  /**
   * Gera as mensalidades da competência informada para todos os pacientes
   * ATIVOS da usuária, pulando quem já tem cobrança emitida para essa
   * competência (idempotente, ver javadoc da classe) e quem está arquivado
   * (nunca recebe mensalidade nova).
   */
  @Transactional
  public GenerateChargesResponse generateMonthlyCharges(UUID userId, String competence) {
    if (competence == null || !competence.matches("^[0-9]{4}-(0[1-9]|1[0-2])$")) {
      throw new InvalidChargeStateException("competence deve estar no formato AAAA-MM: " + competence);
    }

    List<PatientEntity> activePatients = patientRepository.findByUserIdAndStatus(userId, PatientStatus.ATIVO);
    Set<UUID> alreadyCharged = new HashSet<>();
    for (ChargeEntity existing : chargeRepository.findByUserIdAndCompetence(userId, competence)) {
      alreadyCharged.add(existing.getPatientId());
    }

    int year = Integer.parseInt(competence.substring(0, 4));
    int month = Integer.parseInt(competence.substring(5, 7));
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

    List<UUID> createdIds = new ArrayList<>();
    int alreadyExisted = 0;
    for (PatientEntity patient : activePatients) {
      if (alreadyCharged.contains(patient.getId())) {
        alreadyExisted++;
        continue;
      }
      LocalDate dueDate = LocalDate.of(year, month, patient.getBillingDay());
      UUID chargeId = UUID.randomUUID();
      commandGateway.sendAndWait(
          new CreateChargeCommand(
              chargeId,
              userId,
              patient.getId(),
              competence,
              patient.getMonthlyFeeCents(),
              dueDate,
              ChargeStatus.PENDENTE,
              billingProperties.getDefaultInterest().getMonthlyRatePercent(),
              billingProperties.getDefaultInterest().getFinePercent(),
              now));
      createdIds.add(chargeId);
    }

    // Cobranças recém-criadas com vencimento no passado (competência
    // retroativa) já nascem atrasadas nesta mesma operação — ver javadoc da
    // classe sobre a detecção acontecer nas operações do módulo.
    detectOverdueForUser(userId);

    int totalPatients = patientRepository.findByUserId(userId).size();
    int archivedSkipped = totalPatients - activePatients.size();

    List<Charge> created =
        createdIds.stream().map(id -> ChargeMapper.toContract(findOwned(userId, id))).toList();
    return new GenerateChargesResponse(created, alreadyExisted, archivedSkipped);
  }

  /**
   * Visão de inadimplência: cobranças {@code atrasada} da usuária, com o
   * valor corrigido (juros simples, {@link SimpleInterestCalculator}) e
   * totais — ver javadoc de {@code DelinquencySummary} sobre este endpoint
   * complementar a {@code GET /charges?status=atrasada} do contrato.
   */
  @Transactional
  public DelinquencySummary delinquencySummary(UUID userId) {
    detectOverdueForUser(userId);

    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    List<ChargeEntity> overdue = chargeRepository.findByUserIdAndStatus(userId, ChargeStatus.ATRASADA);

    List<DelinquencyItem> items = new ArrayList<>();
    long totalAmount = 0L;
    long totalInterest = 0L;
    long totalCorrected = 0L;
    for (ChargeEntity charge : overdue) {
      long daysLate = ChronoUnit.DAYS.between(charge.getDueDate(), today);
      double monthlyRatePercent =
          charge.getInterest() == null || charge.getInterest().getMonthlyRatePercent() == null
              ? 0.0
              : charge.getInterest().getMonthlyRatePercent();
      long interestCents = SimpleInterestCalculator.interestCents(charge.getAmountCents(), monthlyRatePercent, daysLate);
      long correctedCents = charge.getAmountCents() + interestCents;

      items.add(new DelinquencyItem(ChargeMapper.toContract(charge), daysLate, interestCents, correctedCents));
      totalAmount += charge.getAmountCents();
      totalInterest += interestCents;
      totalCorrected += correctedCents;
    }

    return new DelinquencySummary(items, items.size(), totalAmount, totalInterest, totalCorrected);
  }

  /**
   * Varre as cobranças {@code pendente} da usuária vencidas até hoje e
   * dispara {@link MarkChargeOverdueCommand} para cada uma — ver javadoc da
   * classe. Idempotente por construção: uma cobrança já {@code atrasada}
   * nunca é retornada por {@link
   * ChargeRepository#findByUserIdAndStatusAndDueDateBefore}, então nunca
   * gera um segundo comando/evento.
   */
  private void detectOverdueForUser(UUID userId) {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    List<ChargeEntity> overdueCandidates =
        chargeRepository.findByUserIdAndStatusAndDueDateBefore(userId, ChargeStatus.PENDENTE, today);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    for (ChargeEntity candidate : overdueCandidates) {
      commandGateway.sendAndWait(new MarkChargeOverdueCommand(candidate.getId(), now));
    }
  }

  private ChargeEntity findOwned(UUID userId, UUID chargeId) {
    return chargeRepository.findByIdAndUserId(chargeId, userId).orElseThrow(() -> new ChargeNotFoundException(chargeId));
  }

  private PatientEntity assertPatientOwnedAndActive(UUID userId, UUID patientId) {
    PatientEntity patient =
        patientRepository
            .findByIdAndUserId(patientId, userId)
            .orElseThrow(
                () -> new InvalidChargeStateException("paciente não encontrado para esta psicóloga: " + patientId));
    if (patient.getStatus() != PatientStatus.ATIVO) {
      throw new InvalidChargeStateException("paciente arquivado não recebe cobrança nova: " + patientId);
    }
    return patient;
  }

  private void assertNotDuplicate(UUID userId, UUID patientId, String competence) {
    boolean exists =
        chargeRepository.findByUserIdAndCompetence(userId, competence).stream()
            .anyMatch(c -> c.getPatientId().equals(patientId));
    if (exists) {
      throw new ChargeAlreadyExistsException(patientId, competence);
    }
  }

  private ChargeStatus resolveStatus(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      com.psiops.contracts.model.ChargeStatus contractStatus = com.psiops.contracts.model.ChargeStatus.fromValue(raw);
      return ChargeMapper.toPersistenceStatus(contractStatus);
    } catch (IllegalArgumentException e) {
      return null;
    }
  }
}
