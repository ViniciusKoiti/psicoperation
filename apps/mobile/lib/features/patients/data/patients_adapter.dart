import 'package:psiops_contracts/api.dart';

/// Porta de acesso à carteira de pacientes: leitura (lista geral, lista por
/// status, busca de um paciente), cadastro/edição, arquivamento e histórico
/// de registros administrativos.
///
/// **Reconciliação com PSI-041**: esta tarefa (PSI-042) consolida, numa
/// única abstração, o papel do `PatientLookupAdapter` somente-leitura criado
/// em PSI-041 (usado para resolver `patientId → nome` na agenda e no
/// dashboard) com o CRUD completo do módulo de pacientes — evita dois
/// adapters concorrentes representando a mesma entidade. [listPatients]
/// preserva exatamente a assinatura/semântica original (lista TODOS os
/// pacientes, ativos e arquivados) usada por `AgendaController` e
/// `DashboardController`; os arquivos `features/agenda/data/
/// patient_lookup_adapter.dart` e `http_patient_lookup_adapter.dart` da
/// PSI-041 foram removidos em favor deste adapter único.
///
/// Os tipos [Patient], [PatientStatus], [PatientCreateRequest],
/// [PatientUpdateRequest] e [AttendanceRecord] vêm de
/// `packages/contracts/gen/dart` (codegen do `openapi.yaml` — ADR 0008);
/// este adapter nunca redefine DTOs de API localmente.
///
/// Duas implementações, seguindo o padrão de PSI-040/PSI-041:
/// - `InMemoryPatientsAdapter`: mock em memória, padrão em dev/test.
/// - `HttpPatientsAdapter`: client HTTP real tipado pelos mesmos modelos,
///   implementado e compilável, mas não exercitado contra a API real nesta
///   tarefa (integração real é PSI-045).
abstract interface class PatientsAdapter {
  /// Lista TODOS os pacientes da psicóloga autenticada (ativos e
  /// arquivados) — usado para resolver nomes em telas que não filtram por
  /// status (agenda, dashboard). Papel herdado do antigo
  /// `PatientLookupAdapter` (PSI-041).
  Future<List<Patient>> listPatients();

  /// Lista pacientes filtrados por [status] — usado pela lista padrão de
  /// pacientes (`PatientStatus.ativo`) e pelo filtro de arquivados
  /// (`PatientStatus.inativo`).
  Future<List<Patient>> listPatientsByStatus(PatientStatus status);

  /// Busca um único paciente por [id]. Lança [PatientNotFoundException] se
  /// não existir.
  Future<Patient> getPatient(String id);

  /// Cadastra um novo paciente (`status` inicial sempre `ativo`).
  Future<Patient> createPatient(PatientCreateRequest request);

  /// Atualiza dados cadastrais de um paciente existente. Lança
  /// [PatientNotFoundException] se [id] não existir.
  Future<Patient> updatePatient(String id, PatientUpdateRequest request);

  /// Arquiva um paciente (`status = inativo`): some das listagens padrão
  /// (`listPatientsByStatus(PatientStatus.ativo)`), mas preserva o
  /// histórico de consultas, registros administrativos e mensalidades —
  /// nunca exclui o registro. Exclusão definitiva (LGPD) é
  /// deliberadamente fora de escopo (ver manifesto PSI-042). Lança
  /// [PatientNotFoundException] se [id] não existir.
  Future<void> archivePatient(String id);

  /// Histórico de registros administrativos (compareceu/faltou/remarcada +
  /// anotação operacional) do paciente [patientId], mais recentes primeiro.
  /// NUNCA contém dado clínico (ver [AttendanceRecord]).
  ///
  /// Gap de contrato conhecido (ver open_questions do manifesto PSI-042): a
  /// spec OpenAPI atual só expõe escrita de presença por consulta (`PUT
  /// /appointments/{id}/attendance`), sem um endpoint de leitura em lote por
  /// paciente nem o campo de presença no `Appointment` retornado por `GET
  /// /appointments`. `HttpPatientsAdapter` (não exercitado contra a API
  /// real nesta tarefa) retorna lista vazia até que o contrato modele essa
  /// leitura; `InMemoryPatientsAdapter` (padrão em dev/test) semeia dados de
  /// exemplo para exercitar esta seção do detalhe do paciente.
  Future<List<AttendanceRecord>> listAdministrativeRecords(String patientId);
}

/// Erro genérico de acesso à carteira de pacientes (rede, servidor, resposta
/// inesperada). [message] é um texto pt-BR adequado para exibição direta na
/// UI.
class PatientsAdapterException implements Exception {
  const PatientsAdapterException(this.message);

  final String message;

  @override
  String toString() => 'PatientsAdapterException: $message';
}

/// O paciente referenciado não existe (HTTP 404 no adapter real).
class PatientNotFoundException extends PatientsAdapterException {
  const PatientNotFoundException([super.message = 'Paciente não encontrado.']);
}

/// Adapter em memória usado no ambiente `AppEnvironment.dev` (e em testes).
///
/// Seed fixo com os três pacientes historicamente referenciados pelos mocks
/// de agenda/financeiro (`InMemoryAppointmentAdapter`/`InMemoryChargeAdapter`
/// usam `patient-1`/`patient-2`/`patient-3`) — preserva compatibilidade com
/// os testes e seeds da PSI-041 após a consolidação do adapter.
final class InMemoryPatientsAdapter implements PatientsAdapter {
  InMemoryPatientsAdapter({DateTime Function()? now, bool seedSampleData = true})
    : _now = now ?? DateTime.now {
    if (seedSampleData) _seedDefaults();
  }

  final DateTime Function() _now;
  final List<Patient> _patients = [];
  final Map<String, List<AttendanceRecord>> _administrativeRecords = {};

  // Seeds já usam patient-1..3 (PSI-041); novos cadastros continuam a
  // sequência a partir de 4 para nunca colidir com os IDs semeados.
  int _sequence = 3;

  String _nextId() {
    _sequence++;
    return 'patient-$_sequence';
  }

  void _seedDefaults() {
    final createdAt = _now();
    _patients.addAll([
      Patient(
        id: 'patient-1',
        name: 'Beatriz Andrade',
        whatsapp: '+5511990000001',
        email: 'beatriz.andrade@exemplo.com.br',
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
    ]);

    _administrativeRecords['patient-1'] = [
      AttendanceRecord(
        attendance: AttendanceStatus.compareceu,
        administrativeNotes: 'Chegou no horário.',
        recordedAt: createdAt.subtract(const Duration(days: 7)),
      ),
      AttendanceRecord(
        attendance: AttendanceStatus.remarcada,
        administrativeNotes: 'Remarcou por viagem.',
        recordedAt: createdAt.subtract(const Duration(days: 14)),
      ),
    ];
    _administrativeRecords['patient-2'] = [
      AttendanceRecord(
        attendance: AttendanceStatus.faltou,
        administrativeNotes: 'Faltou sem aviso prévio.',
        recordedAt: createdAt.subtract(const Duration(days: 3)),
      ),
    ];
    _administrativeRecords['patient-3'] = const [];
  }

  Future<void> _delay() => Future<void>.delayed(const Duration(milliseconds: 10));

  @override
  Future<List<Patient>> listPatients() async {
    await _delay();
    return List.unmodifiable(_patients);
  }

  @override
  Future<List<Patient>> listPatientsByStatus(PatientStatus status) async {
    await _delay();
    return _patients.where((patient) => patient.status == status).toList();
  }

  @override
  Future<Patient> getPatient(String id) async {
    await _delay();
    for (final patient in _patients) {
      if (patient.id == id) return patient;
    }
    throw const PatientNotFoundException();
  }

  @override
  Future<Patient> createPatient(PatientCreateRequest request) async {
    await _delay();
    final patient = Patient(
      id: _nextId(),
      name: request.name,
      whatsapp: request.whatsapp,
      email: request.email,
      monthlyFee: request.monthlyFee,
      billingDay: request.billingDay,
      status: PatientStatus.ativo,
      notes: request.notes,
      createdAt: _now(),
    );
    _patients.add(patient);
    return patient;
  }

  @override
  Future<Patient> updatePatient(String id, PatientUpdateRequest request) async {
    await _delay();
    final index = _patients.indexWhere((patient) => patient.id == id);
    if (index == -1) throw const PatientNotFoundException();

    final current = _patients[index];
    final updated = Patient(
      id: current.id,
      name: request.name ?? current.name,
      whatsapp: request.whatsapp ?? current.whatsapp,
      email: request.email ?? current.email,
      monthlyFee: request.monthlyFee ?? current.monthlyFee,
      billingDay: request.billingDay ?? current.billingDay,
      status: request.status ?? current.status,
      notes: request.notes ?? current.notes,
      createdAt: current.createdAt,
    );
    _patients[index] = updated;
    return updated;
  }

  @override
  Future<void> archivePatient(String id) async {
    await _delay();
    final index = _patients.indexWhere((patient) => patient.id == id);
    if (index == -1) throw const PatientNotFoundException();

    final current = _patients[index];
    _patients[index] = Patient(
      id: current.id,
      name: current.name,
      whatsapp: current.whatsapp,
      email: current.email,
      monthlyFee: current.monthlyFee,
      billingDay: current.billingDay,
      status: PatientStatus.inativo,
      notes: current.notes,
      createdAt: current.createdAt,
    );
  }

  @override
  Future<List<AttendanceRecord>> listAdministrativeRecords(String patientId) async {
    await _delay();
    final records = List<AttendanceRecord>.from(
      _administrativeRecords[patientId] ?? const [],
    );
    records.sort((a, b) {
      final recordedA = a.recordedAt;
      final recordedB = b.recordedAt;
      if (recordedA == null || recordedB == null) return 0;
      return recordedB.compareTo(recordedA);
    });
    return records;
  }
}
