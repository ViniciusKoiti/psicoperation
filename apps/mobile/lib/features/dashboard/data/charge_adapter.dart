import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';

/// Porta de acesso às cobranças (mensalidades).
///
/// Nasceu somente-leitura no dashboard do dia (PSI-041, [listCharges]).
/// A PSI-043 **estende** esta mesma abstração — em vez de criar um adapter
/// financeiro concorrente — com as duas escritas que faltavam: emitir uma
/// cobrança ([createCharge], usada para gerar as mensalidades do mês) e
/// registrar o pagamento de uma ([registerPayment], usada para marcar como
/// paga). Reconciliação registrada no manifesto PSI-043: o dashboard e a
/// tela financeira compartilham o mesmo adapter/mesma leitura
/// ([listCharges]), evitando dois modelos de cobrança divergentes.
///
/// Reaproveita os modelos [Charge]/[CreateChargeRequest]/
/// [RegisterPaymentRequest] de `packages/contracts/gen/dart` — não duplica
/// DTOs próprios (regra 8 do CLAUDE.md). Valores monetários chegam sempre em
/// centavos BRL inteiros.
///
/// Duas implementações, seguindo o padrão de PSI-040/041/042:
/// - `InMemoryChargeAdapter`: mock em memória, padrão em dev/test.
/// - `HttpChargeAdapter`: client HTTP real tipado pelos mesmos modelos,
///   implementado e compilável, mas não exercitado contra a API real nesta
///   tarefa (integração real é PSI-045).
abstract interface class ChargeAdapter {
  /// Lista as cobranças da psicóloga autenticada.
  Future<List<Charge>> listCharges();

  /// Emite uma cobrança (`POST /charges`) para um paciente/competência.
  ///
  /// **Idempotência** (acceptance criteria da PSI-043): a chave lógica é
  /// paciente + competência (o `userId` é implícito ao escopo do token/
  /// instância do adapter — nunca um campo explícito, mesma regra de
  /// `Patient`). Chamar de novo para o mesmo par paciente/competência lança
  /// [ChargeAlreadyExistsException] em vez de duplicar — espelha o `409` da
  /// spec (`paths/billing/charges.yaml`).
  Future<Charge> createCharge(CreateChargeRequest request);

  /// Registra o pagamento (administrativo) da cobrança [chargeId]
  /// (`POST /charges/{chargeId}/payment`), atualizando seu status para
  /// `em_dia`. Lança [ChargeNotFoundException] se a cobrança não existir, ou
  /// [ChargeAlreadyPaidException] se ela já tiver sido paga (espelha o `409`
  /// da spec, `paths/billing/charge-payment.yaml`).
  Future<Charge> registerPayment(String chargeId, RegisterPaymentRequest request);
}

/// Erro genérico ao carregar/alterar cobranças (rede, servidor, resposta
/// inesperada). [message] é um texto pt-BR adequado para exibição direta na
/// UI.
class ChargeAdapterException implements Exception {
  const ChargeAdapterException(this.message);

  final String message;

  @override
  String toString() => 'ChargeAdapterException: $message';
}

/// Já existe cobrança para o par paciente/competência (HTTP 409 em
/// `createCharge`) — o mecanismo de idempotência da geração mensal.
class ChargeAlreadyExistsException extends ChargeAdapterException {
  const ChargeAlreadyExistsException([
    super.message = 'Já existe uma mensalidade emitida para este paciente nesta competência.',
  ]);
}

/// A cobrança referenciada não existe (HTTP 404 no adapter real).
class ChargeNotFoundException extends ChargeAdapterException {
  const ChargeNotFoundException([super.message = 'Mensalidade não encontrada.']);
}

/// A cobrança referenciada já foi paga (HTTP 409 em `registerPayment`).
class ChargeAlreadyPaidException extends ChargeAdapterException {
  const ChargeAlreadyPaidException([super.message = 'Esta mensalidade já foi paga.']);
}

/// Adapter em memória usado no ambiente `AppEnvironment.dev` (e em testes).
///
/// Seed com uma mensalidade em dia, uma pendente e uma atrasada — cobre os
/// três `ChargeStatus` para exercitar o dashboard (estado com pendências e,
/// via seeds vazios em teste, o estado vazio).
final class InMemoryChargeAdapter implements ChargeAdapter {
  InMemoryChargeAdapter({DateTime Function()? now, bool seedSampleData = true})
    : _now = now ?? DateTime.now {
    if (seedSampleData) _seedDefaults();
  }

  final DateTime Function() _now;
  final List<Charge> _charges = [];

  // Seeds já usam charge-mock-1..3 (PSI-041); novas cobranças (geração
  // mensal) continuam a sequência a partir de 3 para nunca colidir com os
  // ids semeados (mesmo padrão de `InMemoryPatientsAdapter._sequence`).
  int _sequence = 3;

  String _nextId() {
    _sequence++;
    return 'charge-mock-$_sequence';
  }

  void _seedDefaults() {
    final today = _now();
    final competence =
        '${today.year.toString().padLeft(4, '0')}-${today.month.toString().padLeft(2, '0')}';

    _charges.addAll([
      Charge(
        id: 'charge-mock-1',
        patientId: 'patient-1',
        competence: competence,
        amount: 25000,
        dueDate: DateTime(today.year, today.month, today.day).add(
          const Duration(days: 10),
        ),
        status: ChargeStatus.emDia,
        createdAt: today,
      ),
      Charge(
        id: 'charge-mock-2',
        patientId: 'patient-2',
        competence: competence,
        amount: 20000,
        dueDate: DateTime(today.year, today.month, today.day).add(
          const Duration(days: 3),
        ),
        status: ChargeStatus.pendente,
        createdAt: today,
      ),
      Charge(
        id: 'charge-mock-3',
        patientId: 'patient-3',
        competence: competence,
        amount: 22000,
        dueDate: DateTime(today.year, today.month, today.day).subtract(
          const Duration(days: 6),
        ),
        status: ChargeStatus.atrasada,
        createdAt: today,
      ),
    ]);
  }

  Future<void> _delay() => Future<void>.delayed(const Duration(milliseconds: 10));

  @override
  Future<List<Charge>> listCharges() async {
    await _delay();
    return List.unmodifiable(_charges);
  }

  @override
  Future<Charge> createCharge(CreateChargeRequest request) async {
    await _delay();

    // Idempotência (chave paciente + competência) — mesma regra do 409 real
    // documentada em `ChargeAdapter.createCharge`. Verificada aqui, no mock,
    // porque `FinanceController.generateMonth` (PSI-043) depende dela para
    // nunca duplicar mensalidades já emitidas.
    final alreadyExists = _charges.any(
      (charge) => charge.patientId == request.patientId && charge.competence == request.competence,
    );
    if (alreadyExists) throw const ChargeAlreadyExistsException();

    final today = dateOnly(_now());
    final dueDate = dateOnly(request.dueDate);
    // Uma mensalidade recém-emitida nunca nasce `em_dia` (isso é reservado
    // para quando `registerPayment` é chamado): `pendente` enquanto não
    // vencer, `atrasada` se a geração ocorrer depois do vencimento do mês
    // (ex.: dia de cobrança já passou quando a psicóloga gera a
    // competência corrente). Ver risco de ambiguidade de classificação
    // registrado no manifesto PSI-043.
    final status = dueDate.isBefore(today) ? ChargeStatus.atrasada : ChargeStatus.pendente;

    final charge = Charge(
      id: _nextId(),
      patientId: request.patientId,
      competence: request.competence,
      amount: request.amount,
      dueDate: request.dueDate,
      status: status,
      interest: request.interest,
      createdAt: _now(),
    );
    _charges.add(charge);
    return charge;
  }

  @override
  Future<Charge> registerPayment(String chargeId, RegisterPaymentRequest request) async {
    await _delay();

    final index = _charges.indexWhere((charge) => charge.id == chargeId);
    if (index == -1) throw const ChargeNotFoundException();

    final current = _charges[index];
    if (current.payment != null) throw const ChargeAlreadyPaidException();

    final updated = Charge(
      id: current.id,
      patientId: current.patientId,
      competence: current.competence,
      amount: current.amount,
      dueDate: current.dueDate,
      status: ChargeStatus.emDia,
      interest: current.interest,
      payment: Payment(
        paidAmount: request.paidAmount,
        paidAt: request.paidAt,
        method: request.method,
        note: request.note,
      ),
      createdAt: current.createdAt,
    );
    _charges[index] = updated;
    return updated;
  }
}
