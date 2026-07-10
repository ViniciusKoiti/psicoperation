package com.psiops.api.billing.web;

import com.psiops.api.auth.web.CurrentUserId;
import com.psiops.api.billing.application.ChargeService;
import com.psiops.contracts.model.Charge;
import com.psiops.contracts.model.ChargePage;
import com.psiops.contracts.model.CreateChargeRequest;
import com.psiops.contracts.model.RegisterPaymentRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de cobranças/mensalidades conforme os contratos em {@code
 * packages/contracts/openapi/paths/billing/*.yaml} (PSI-026): {@code GET
 * /charges}, {@code POST /charges}, {@code GET /charges/{chargeId}} e {@code
 * POST /charges/{chargeId}/payment}.
 *
 * <p>Todos os DTOs de request/response desses quatro endpoints vêm de {@code
 * com.psiops.contracts.model} (gerados de {@code openapi.yaml}); nenhum é
 * redefinido aqui.
 *
 * <p><strong>{@code POST /charges/generate} e {@code GET
 * /charges/delinquency}</strong> são endpoints adicionais desta
 * implementação (geração idempotente das mensalidades do mês e visão de
 * inadimplência com totais, ambos exigidos pelo acceptance criteria do
 * manifesto PSI-026) — ainda não declarados na especificação OpenAPI
 * (PSI-020, fora do escopo permitido desta tarefa: {@code
 * packages/contracts/**} é forbidden_path). Seus DTOs de request/response
 * são próprios ({@code GenerateChargesRequest}/{@code
 * GenerateChargesResponse}/{@code DelinquencySummary}, neste mesmo pacote),
 * mas reaproveitam {@link Charge} para os itens — ver javadoc de cada um.
 *
 * <p><strong>Isolamento multi-tenant</strong>: todo método resolve {@code
 * userId} exclusivamente via {@code @CurrentUserId} (nunca lê o {@code
 * SecurityContextHolder} diretamente) e repassa ao {@link ChargeService},
 * que garante que toda consulta/gravação seja escopada a essa usuária.
 */
@RestController
@RequestMapping("/charges")
public class ChargeController {

  private final ChargeService chargeService;

  public ChargeController(ChargeService chargeService) {
    this.chargeService = chargeService;
  }

  @GetMapping
  public ChargePage list(
      @CurrentUserId UUID userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) UUID patientId,
      @RequestParam(required = false) String competence,
      @RequestParam(required = false) String status) {
    return chargeService.list(userId, page, size, patientId, competence, status);
  }

  @PostMapping
  public ResponseEntity<Charge> create(@CurrentUserId UUID userId, @Valid @RequestBody CreateChargeRequest request) {
    Charge created = chargeService.create(userId, request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/{chargeId}")
  public Charge get(@CurrentUserId UUID userId, @PathVariable UUID chargeId) {
    return chargeService.get(userId, chargeId);
  }

  @PostMapping("/{chargeId}/payment")
  public Charge registerPayment(
      @CurrentUserId UUID userId,
      @PathVariable UUID chargeId,
      @Valid @RequestBody RegisterPaymentRequest request) {
    return chargeService.registerPayment(userId, chargeId, request);
  }

  @PostMapping("/generate")
  public GenerateChargesResponse generate(
      @CurrentUserId UUID userId, @Valid @RequestBody GenerateChargesRequest request) {
    return chargeService.generateMonthlyCharges(userId, request.competence());
  }

  @GetMapping("/delinquency")
  public DelinquencySummary delinquency(@CurrentUserId UUID userId) {
    return chargeService.delinquencySummary(userId);
  }
}
