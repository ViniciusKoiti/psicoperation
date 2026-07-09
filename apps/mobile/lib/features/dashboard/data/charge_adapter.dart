import 'package:psiops_contracts/api.dart';

/// Porta de leitura das cobranças (mensalidades) para o dashboard do dia.
///
/// Escopo deliberadamente somente-leitura: emitir cobrança e registrar
/// pagamento são a feature `mobile: financeiro e configurações` (PSI-043),
/// fora desta tarefa. O dashboard só precisa listar para calcular as
/// pendências financeiras (mensalidades `pendente`/`atrasada`) do dia.
///
/// Reaproveita o modelo [Charge] de `packages/contracts/gen/dart` — não
/// duplica um DTO próprio (regra 8 do CLAUDE.md). Valores monetários chegam
/// sempre em centavos BRL inteiros (`Charge.amount`).
abstract interface class ChargeAdapter {
  /// Lista as cobranças da psicóloga autenticada.
  Future<List<Charge>> listCharges();
}

/// Erro genérico ao carregar cobranças (rede, servidor, resposta inesperada).
class ChargeAdapterException implements Exception {
  const ChargeAdapterException(this.message);

  final String message;

  @override
  String toString() => 'ChargeAdapterException: $message';
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

  @override
  Future<List<Charge>> listCharges() async {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    return List.unmodifiable(_charges);
  }
}
