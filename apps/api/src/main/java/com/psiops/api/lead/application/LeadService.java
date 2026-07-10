package com.psiops.api.lead.application;

import com.psiops.api.lead.persistence.LeadEntity;
import com.psiops.api.lead.persistence.LeadRepository;
import com.psiops.contracts.model.Lead;
import com.psiops.contracts.model.LeadCreateRequest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

/**
 * Caso de uso de captura de lead da lista de espera (PSI-028): recebe o
 * payload já validado pelo contrato ({@link LeadCreateRequest}, formato de
 * e-mail e WhatsApp E.164 garantidos por {@code @Valid} no controller) e
 * persiste na tabela {@code leads} criada pela V1 (PSI-010).
 *
 * <p><strong>Deduplicação idempotente por e-mail normalizado</strong>
 * (trim + lowercase, ver {@code uq_leads_email} na V1): reenviar o mesmo
 * e-mail nunca cria um segundo registro e sempre responde com o mesmo
 * formato de sucesso do primeiro cadastro — nunca um erro/():"já
 * cadastrado" que revelaria a um formulário público que aquele e-mail já
 * estava na lista (risco de enumeração citado no manifesto) — nunca um erro
 * do tipo "já cadastrado". O caso comum (sem corrida) é resolvido com um
 * {@code findByEmail} antes de inserir; o
 * caso raro de duas requisições concorrentes para o mesmo e-mail é fechado
 * pela constraint {@code uq_leads_email} do banco — {@link #create}
 * recupera dessa violação em vez de deixá-la virar 500.
 *
 * <p>Este método não é anotado com {@code @Transactional}: cada chamada ao
 * {@link LeadRepository} já roda na sua própria transação (comportamento
 * padrão do Spring Data JPA quando não há uma transação envolvente). Isso é
 * proposital — se o {@code saveAndFlush} abaixo falhar por violação de
 * unicidade, a transação daquela chamada é revertida isoladamente, e a
 * consulta de fallback por e-mail roda em uma transação nova e íntegra. Se
 * tudo corresse em uma única transação envolvente, o erro do banco deixaria
 * a transação (e a conexão) em estado abortado, e a consulta de fallback
 * falharia também.
 */
@Service
public class LeadService {

  private final LeadRepository leadRepository;

  public LeadService(LeadRepository leadRepository) {
    this.leadRepository = leadRepository;
  }

  public Lead create(LeadCreateRequest request) {
    String normalizedEmail = request.getEmail().trim().toLowerCase();

    // Caminho comum: e-mail já cadastrado é apenas devolvido (sem revelar
    // que já existia — a resposta é idêntica à de um cadastro novo).
    var existing = leadRepository.findByEmail(normalizedEmail);
    if (existing.isPresent()) {
      return LeadMapper.toContract(existing.get());
    }

    LeadEntity entity = new LeadEntity(
        UUID.randomUUID(),
        request.getName().trim(),
        request.getWhatsapp(),
        normalizedEmail,
        OffsetDateTime.now(ZoneOffset.UTC));

    try {
      leadRepository.saveAndFlush(entity);
      return LeadMapper.toContract(entity);
    } catch (DataIntegrityViolationException raceLost) {
      // Duas requisições concorrentes para o mesmo e-mail: a outra venceu a
      // corrida e inseriu primeiro (uq_leads_email). Trata como sucesso
      // idempotente, igual ao caminho comum acima, em vez de propagar um 500
      // ou um conflito que revelaria a existência prévia.
      return leadRepository.findByEmail(normalizedEmail)
          .map(LeadMapper::toContract)
          .orElseThrow(() -> raceLost);
    }
  }
}
