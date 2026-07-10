import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../agenda/data/appointment_adapter.dart';
import '../../dashboard/data/charge_adapter.dart';
import '../data/patients_adapter.dart';

/// Estado de carregamento do detalhe de um paciente.
enum PatientDetailStatus { loading, ready, error }

/// Estado (separado da apresentação) da tela de detalhe de um paciente.
///
/// Agrega quatro fontes de dados independentes, todas injetadas (o ponto de
/// composição `app/app.dart` decide mock vs. real, seguindo o padrão de
/// PSI-040/PSI-041):
/// - [PatientsAdapter.getPatient]: dados cadastrais.
/// - [AppointmentAdapter.listAppointments]: histórico de consultas (filtrado
///   por `patientId` no client — o adapter de agenda, escopo da PSI-041,
///   não expõe filtro por paciente na sua interface atual; ver acoplamento
///   restrito ao nível de adapter, não de tela, conforme risco do manifesto
///   PSI-042).
/// - [PatientsAdapter.listAdministrativeRecords]: histórico de registros
///   administrativos (presença/falta/remarcação), nunca dado clínico.
/// - [ChargeAdapter.listCharges]: situação financeira (mensalidades),
///   filtrada por `patientId` no client — assumption do manifesto PSI-042
///   (derivada dos modelos de mensalidade já existentes, somente leitura).
class PatientDetailController extends ChangeNotifier {
  PatientDetailController(
    this._patients,
    this._appointments,
    this._charges,
    this._patientId, {
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final PatientsAdapter _patients;
  final AppointmentAdapter _appointments;
  final ChargeAdapter _charges;
  final String _patientId;
  final DateTime Function() _now;

  // Janela ampla o suficiente para cobrir o histórico de consultas de um
  // paciente recorrente (mesmo critério de amplitude usado por
  // `AgendaController`, mas com mais profundidade no passado — aqui o
  // objetivo é histórico, não agendamento futuro).
  static const _windowPast = Duration(days: 730);
  static const _windowFuture = Duration(days: 120);

  PatientDetailStatus _status = PatientDetailStatus.loading;
  PatientDetailStatus get status => _status;

  Patient? _patient;
  Patient? get patient => _patient;

  List<Appointment> _appointmentHistory = [];

  /// Consultas do paciente, mais recentes primeiro.
  List<Appointment> get appointmentHistory => _appointmentHistory;

  List<AttendanceRecord> _administrativeRecords = [];

  /// Registros administrativos do paciente, mais recentes primeiro.
  List<AttendanceRecord> get administrativeRecords => _administrativeRecords;

  List<Charge> _charges_ = [];

  /// Mensalidades do paciente, vencimento mais recente primeiro.
  List<Charge> get charges => _charges_;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _actionErrorMessage;

  /// Mensagem pt-BR da última falha de arquivamento. `null` quando a última
  /// ação teve sucesso.
  String? get actionErrorMessage => _actionErrorMessage;

  Future<void> load() async {
    _status = PatientDetailStatus.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      final patient = await _patients.getPatient(_patientId);
      final anchor = dateOnly(_now());
      final appointments = await _appointments.listAppointments(
        from: anchor.subtract(_windowPast),
        to: anchor.add(_windowFuture),
      );
      final records = await _patients.listAdministrativeRecords(_patientId);
      final allCharges = await _charges.listCharges();

      _patient = patient;
      _appointmentHistory =
          appointments.where((a) => a.patientId == _patientId).toList()
            ..sort((a, b) => b.startsAt.compareTo(a.startsAt));
      _administrativeRecords = records;
      _charges_ =
          allCharges.where((c) => c.patientId == _patientId).toList()
            ..sort((a, b) => b.dueDate.compareTo(a.dueDate));
      _status = PatientDetailStatus.ready;
    } on PatientNotFoundException {
      _status = PatientDetailStatus.error;
      _errorMessage = 'Paciente não encontrado.';
    } catch (_) {
      _status = PatientDetailStatus.error;
      _errorMessage = 'Não foi possível carregar o paciente.';
    }
    notifyListeners();
  }

  /// Arquiva o paciente corrente (confirmação é responsabilidade da UI antes
  /// de chamar este método). Retorna `true` em sucesso; em falha, retorna
  /// `false` e popula [actionErrorMessage].
  Future<bool> archive() async {
    _actionErrorMessage = null;
    try {
      await _patients.archivePatient(_patientId);
      return true;
    } on PatientsAdapterException catch (error) {
      _actionErrorMessage = error.message;
      notifyListeners();
      return false;
    }
  }
}
