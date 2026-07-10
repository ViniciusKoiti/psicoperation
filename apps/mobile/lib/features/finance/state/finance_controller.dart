import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../dashboard/data/charge_adapter.dart';
import '../../patients/data/patients_adapter.dart';

/// Estado de carregamento da tela financeira.
enum FinanceStatus { loading, ready, error }

/// Resultado de uma geração de mensalidades do mês (feedback pt-BR na UI).
class MonthlyGenerationResult {
  const MonthlyGenerationResult({required this.created, required this.skipped});

  /// Quantas mensalidades novas foram emitidas.
  final int created;

  /// Quantos pacientes ativos já tinham mensalidade emitida para a
  /// competência (idempotência — `ChargeAlreadyExistsException` do
  /// adapter) e por isso foram ignorados.
  final int skipped;
}

/// Estado (separado da apresentação) da tela financeira (PSI-043).
///
/// Agrega mensalidades do mês em foco ([focusedMonth]) agrupadas pelos três
/// `ChargeStatus` (em dia/pendente/atrasada), com totais por status e total
/// geral em centavos BRL inteiros (nunca ponto flutuante — regra invariável
/// do CLAUDE.md), mais as duas ações do acceptance criteria: marcar uma
/// mensalidade como paga ([markAsPaid]) e gerar as mensalidades do mês para
/// os pacientes ativos ([generateMonth], idempotente — depende de
/// `ChargeAdapter.createCharge` lançar [ChargeAlreadyExistsException] para
/// pares paciente/competência já emitidos).
///
/// Depende de [ChargeAdapter] e [PatientsAdapter] por injeção — o ponto de
/// composição (`app/app.dart`) decide mock vs. real, seguindo o padrão de
/// PSI-040/041/042.
class FinanceController extends ChangeNotifier {
  FinanceController(this._charges, this._patients, {DateTime Function()? now})
    : _now = now ?? DateTime.now,
      _focusedMonth = _monthOf((now ?? DateTime.now)());

  final ChargeAdapter _charges;
  final PatientsAdapter _patients;
  final DateTime Function() _now;

  static DateTime _monthOf(DateTime date) => DateTime(date.year, date.month, 1);

  FinanceStatus _status = FinanceStatus.loading;
  FinanceStatus get status => _status;

  DateTime _focusedMonth;

  /// Mês (dia sempre `1`) em foco na navegação mensal.
  DateTime get focusedMonth => _focusedMonth;

  /// Competência (`AAAA-MM`) correspondente a [focusedMonth].
  String get focusedCompetence => competenceOf(_focusedMonth);

  List<Charge> _emDia = [];
  List<Charge> _pendentes = [];
  List<Charge> _atrasadas = [];

  /// Mensalidades `em_dia` do mês em foco, ordenadas por vencimento.
  List<Charge> get emDiaCharges => _emDia;

  /// Mensalidades `pendente` do mês em foco, ordenadas por vencimento.
  List<Charge> get pendenteCharges => _pendentes;

  /// Mensalidades `atrasada` do mês em foco, ordenadas por vencimento.
  List<Charge> get atrasadaCharges => _atrasadas;

  /// `true` quando não há nenhuma mensalidade gerada para o mês em foco
  /// (estado vazio do acceptance criteria).
  bool get isEmpty => _emDia.isEmpty && _pendentes.isEmpty && _atrasadas.isEmpty;

  int _sumCents(List<Charge> charges) =>
      charges.fold(0, (total, charge) => total + charge.amount);

  /// Total em centavos das mensalidades `em_dia` do mês em foco.
  int get totalEmDiaCents => _sumCents(_emDia);

  /// Total em centavos das mensalidades `pendente` do mês em foco.
  int get totalPendenteCents => _sumCents(_pendentes);

  /// Total em centavos das mensalidades `atrasada` do mês em foco.
  int get totalAtrasadaCents => _sumCents(_atrasadas);

  /// Total geral (soma dos três status) em centavos do mês em foco.
  int get totalGeralCents => totalEmDiaCents + totalPendenteCents + totalAtrasadaCents;

  Map<String, String> _patientNames = {};

  /// Nome do paciente para exibição — cai para um rótulo genérico se o
  /// paciente não estiver (ainda) na carteira resolvida.
  String patientName(String patientId) => _patientNames[patientId] ?? 'Paciente';

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _actionErrorMessage;

  /// Mensagem pt-BR da última falha de ação (marcar como paga / gerar mês).
  /// `null` quando a última ação teve sucesso.
  String? get actionErrorMessage => _actionErrorMessage;

  MonthlyGenerationResult? _lastGenerationResult;

  /// Resultado da última geração de mensalidades do mês, para a UI compor a
  /// mensagem de feedback (acceptance criteria: "com feedback do
  /// resultado"). `null` antes da primeira geração nesta sessão.
  MonthlyGenerationResult? get lastGenerationResult => _lastGenerationResult;

  /// Navega para o mês civil anterior ao [focusedMonth] e recarrega.
  Future<void> goToPreviousMonth() async {
    _focusedMonth = previousMonth(_focusedMonth);
    await load();
  }

  /// Navega para o mês civil seguinte ao [focusedMonth] e recarrega.
  Future<void> goToNextMonth() async {
    _focusedMonth = nextMonth(_focusedMonth);
    await load();
  }

  /// Volta ao mês corrente (relativo ao relógio injetado) e recarrega.
  Future<void> goToCurrentMonth() async {
    _focusedMonth = _monthOf(_now());
    await load();
  }

  Future<void> load() async {
    _status = FinanceStatus.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      final allCharges = await _charges.listCharges();
      final competence = focusedCompetence;
      final monthCharges = allCharges.where((charge) => charge.competence == competence);

      int compareDueDate(Charge a, Charge b) => a.dueDate.compareTo(b.dueDate);

      _emDia = monthCharges.where((c) => c.status == ChargeStatus.emDia).toList()
        ..sort(compareDueDate);
      _pendentes = monthCharges.where((c) => c.status == ChargeStatus.pendente).toList()
        ..sort(compareDueDate);
      _atrasadas = monthCharges.where((c) => c.status == ChargeStatus.atrasada).toList()
        ..sort(compareDueDate);

      final patients = await _patients.listPatients();
      _patientNames = {for (final patient in patients) patient.id: patient.name};
      _status = FinanceStatus.ready;
    } catch (_) {
      _status = FinanceStatus.error;
      _errorMessage = 'Não foi possível carregar o financeiro do mês.';
    }
    notifyListeners();
  }

  /// Marca [charge] como paga (confirmação é responsabilidade da UI antes de
  /// chamar este método). Assume o valor integral da cobrança e o instante
  /// corrente do relógio injetado como data de pagamento (MVP — resolve a
  /// open_question do manifesto PSI-043 a favor do fluxo mais simples: sem
  /// campo de data de pagamento nem pagamento parcial nesta tarefa). Retorna
  /// `true` em sucesso, recarregando os totais imediatamente; em falha,
  /// retorna `false` e popula [actionErrorMessage].
  Future<bool> markAsPaid(
    Charge charge, {
    required PaymentMethod method,
    String? note,
  }) async {
    _actionErrorMessage = null;
    try {
      await _charges.registerPayment(
        charge.id,
        RegisterPaymentRequest(
          paidAmount: charge.amount,
          paidAt: _now().toUtc(),
          method: method,
          note: note,
        ),
      );
      await load();
      return true;
    } on ChargeAdapterException catch (error) {
      _actionErrorMessage = error.message;
      notifyListeners();
      return false;
    }
  }

  /// Gera as mensalidades da competência de [focusedMonth] para todos os
  /// pacientes ativos, usando o valor (`Patient.monthlyFee`) e o dia de
  /// vencimento (`Patient.billingDay`) de cada paciente.
  ///
  /// **Idempotente**: para cada paciente ativo, tenta `ChargeAdapter.
  /// createCharge`; se já existir cobrança para o par paciente/competência,
  /// o adapter lança [ChargeAlreadyExistsException] — capturada aqui e
  /// contabilizada como "ignorada" (`skipped`) em vez de propagar erro ou
  /// duplicar a mensalidade. Chamar de novo para o mesmo mês nunca duplica.
  /// Recarrega os dados ao final e retorna o resultado para a UI exibir o
  /// feedback (acceptance criteria).
  Future<MonthlyGenerationResult> generateMonth() async {
    _actionErrorMessage = null;
    var created = 0;
    var skipped = 0;
    try {
      final activePatients = await _patients.listPatientsByStatus(PatientStatus.ativo);
      final competence = focusedCompetence;
      for (final patient in activePatients) {
        final dueDate = DateTime(_focusedMonth.year, _focusedMonth.month, patient.billingDay);
        try {
          await _charges.createCharge(
            CreateChargeRequest(
              patientId: patient.id,
              competence: competence,
              amount: patient.monthlyFee,
              dueDate: dueDate,
            ),
          );
          created++;
        } on ChargeAlreadyExistsException {
          skipped++;
        }
      }
      final result = MonthlyGenerationResult(created: created, skipped: skipped);
      _lastGenerationResult = result;
      await load();
      return result;
    } catch (_) {
      _actionErrorMessage = 'Não foi possível gerar as mensalidades do mês.';
      final result = MonthlyGenerationResult(created: created, skipped: skipped);
      _lastGenerationResult = result;
      notifyListeners();
      return result;
    }
  }
}
