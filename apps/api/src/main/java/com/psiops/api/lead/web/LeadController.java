package com.psiops.api.lead.web;

import com.psiops.api.lead.application.LeadRateLimiter;
import com.psiops.api.lead.application.LeadService;
import com.psiops.contracts.model.Lead;
import com.psiops.contracts.model.LeadCreateRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint público da lista de espera conforme
 * {@code packages/contracts/openapi/paths/lead/leads.yaml} (PSI-028).
 *
 * <p>Todos os DTOs de request/response vêm de {@code com.psiops.contracts.model}
 * (gerados de {@code openapi.yaml}); nenhum é redefinido aqui.
 *
 * <p><strong>Rota pública</strong>: {@code /leads/**} já está liberada do
 * guard JWT em {@link com.psiops.api.auth.web.SecurityConfig} (PSI-022) —
 * nenhuma anotação de segurança é necessária aqui.
 */
@RestController
@RequestMapping("/leads")
public class LeadController {

  private final LeadService leadService;
  private final LeadRateLimiter leadRateLimiter;

  public LeadController(LeadService leadService, LeadRateLimiter leadRateLimiter) {
    this.leadService = leadService;
    this.leadRateLimiter = leadRateLimiter;
  }

  @PostMapping
  public ResponseEntity<Lead> create(
      @Valid @RequestBody LeadCreateRequest request, HttpServletRequest httpRequest) {
    // Chave de rate-limit: apenas o IP remoto (ver javadoc de
    // LeadRateLimiter) — getRemoteAddr() é suficiente para o MVP sem reverse
    // proxy com IP forwarding configurado, mesma ressalva já registrada em
    // AuthController.login.
    leadRateLimiter.checkAndConsume(httpRequest.getRemoteAddr());
    Lead lead = leadService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(lead);
  }
}
