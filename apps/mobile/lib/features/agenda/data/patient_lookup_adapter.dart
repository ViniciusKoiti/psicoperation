import 'package:psiops_contracts/api.dart';

/// Porta de leitura mínima da carteira de pacientes, usada apenas para
/// resolver `patientId → nome` na exibição de consultas (dashboard/agenda).
///
/// Escopo deliberadamente pequeno: cadastro, edição e gestão completa de
/// pacientes são a feature `mobile: pacientes` (PSI-042), fora desta tarefa.
/// Reaproveita o modelo [Patient] de `packages/contracts/gen/dart` — não
/// duplica um DTO próprio (regra 8 do CLAUDE.md).
abstract interface class PatientLookupAdapter {
  /// Lista os pacientes da psicóloga autenticada (para resolver nomes em
  /// listas de consultas/pendências financeiras).
  Future<List<Patient>> listPatients();
}

/// Erro genérico ao carregar a carteira de pacientes (rede, servidor,
/// resposta inesperada). [message] é um texto pt-BR adequado para exibição
/// direta na UI.
class PatientLookupException implements Exception {
  const PatientLookupException(this.message);

  final String message;

  @override
  String toString() => 'PatientLookupException: $message';
}

/// Adapter em memória usado no ambiente `AppEnvironment.dev` (e em testes).
///
/// Seed fixo com os três pacientes referenciados pelo
/// `InMemoryAppointmentAdapter`/`InMemoryChargeAdapter`.
final class InMemoryPatientLookupAdapter implements PatientLookupAdapter {
  InMemoryPatientLookupAdapter({DateTime Function()? now}) : _now = now ?? DateTime.now;

  final DateTime Function() _now;

  @override
  Future<List<Patient>> listPatients() async {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    final createdAt = _now();
    return [
      Patient(
        id: 'patient-1',
        name: 'Beatriz Andrade',
        monthlyFee: 25000,
        billingDay: 5,
        status: PatientStatus.ativo,
        createdAt: createdAt,
      ),
      Patient(
        id: 'patient-2',
        name: 'Carlos Eduardo Lima',
        monthlyFee: 20000,
        billingDay: 10,
        status: PatientStatus.ativo,
        createdAt: createdAt,
      ),
      Patient(
        id: 'patient-3',
        name: 'Daniela Souza',
        monthlyFee: 22000,
        billingDay: 15,
        status: PatientStatus.ativo,
        createdAt: createdAt,
      ),
    ];
  }
}
