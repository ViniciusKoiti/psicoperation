import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../patients/data/patients_adapter.dart';
import '../data/appointment_adapter.dart';
import '../data/conflict_detector.dart';

/// Modo de exibição da agenda: dia único ou semana inteira.
enum AgendaViewMode { day, week }

/// Estado de carregamento da agenda.
enum AgendaLoadStatus { loading, ready, error }

/// Estado (separado da apresentação) da feature Agenda.
///
/// Depende de [AppointmentAdapter] e [PatientsAdapter] por injeção — o
/// ponto de composição (`app/app.dart`) decide qual adapter (mock ou real)
/// fornecer, seguindo o padrão de PSI-040. Usa apenas
/// `PatientsAdapter.listPatients()` (todos os pacientes, ativos e
/// arquivados) para resolver nomes — o CRUD completo de pacientes é a
/// feature `patients` (PSI-042).
///
/// A janela de dados carregada por [load] é ampla (de 7 dias atrás a ~4
/// meses à frente do instante corrente) para que a navegação entre
/// dias/semanas dentro desse horizonte não precise recarregar, e para que a
/// pré-checagem de conflito ([hasConflict]) enxergue consultas futuras o
/// suficiente antes de confirmar um novo agendamento.
class AgendaController extends ChangeNotifier {
  AgendaController(this._appointments, this._patients, {DateTime Function()? now})
    : _now = now ?? DateTime.now,
      _focusedDay = dateOnly((now ?? DateTime.now)());

  final AppointmentAdapter _appointments;
  final PatientsAdapter _patients;
  final DateTime Function() _now;
  static const _detector = AppointmentConflictDetector();

  static const _windowPast = Duration(days: 7);
  static const _windowFuture = Duration(days: 120);

  AgendaLoadStatus _status = AgendaLoadStatus.loading;
  AgendaLoadStatus get status => _status;

  AgendaViewMode _viewMode = AgendaViewMode.day;
  AgendaViewMode get viewMode => _viewMode;

  DateTime _focusedDay;

  /// Dia em foco na visão diária (também usado para calcular a semana em
  /// foco na visão semanal).
  DateTime get focusedDay => _focusedDay;

  /// Dia civil correspondente a "hoje" — usado para destacar o dia atual na
  /// UI.
  DateTime get today => dateOnly(_now());

  List<Appointment> _windowAppointments = [];
  Map<String, String> _patientNames = {};

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _actionErrorMessage;

  /// Mensagem pt-BR da última falha de criação/remarcação/cancelamento
  /// (inclui conflito de horário). `null` quando a última ação teve sucesso.
  String? get actionErrorMessage => _actionErrorMessage;

  void clearActionError() {
    _actionErrorMessage = null;
    notifyListeners();
  }

  /// Nome do paciente para exibição — cai para um rótulo genérico se o
  /// paciente não estiver (ainda) na carteira resolvida.
  String patientName(String patientId) =>
      _patientNames[patientId] ?? 'Paciente';

  /// Consultas do dia [day] (não canceladas), ordenadas por horário.
  List<Appointment> appointmentsOn(DateTime day) {
    final result =
        _windowAppointments
            .where(
              (a) =>
                  isSameDate(a.startsAt, day) &&
                  a.status != AppointmentStatus.cancelada,
            )
            .toList()
          ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return result;
  }

  DateTime get weekStart => startOfWeek(_focusedDay);

  List<DateTime> get weekDays => List.generate(7, (i) => weekStart.add(Duration(days: i)));

  void showDayView() {
    if (_viewMode == AgendaViewMode.day) return;
    _viewMode = AgendaViewMode.day;
    notifyListeners();
  }

  void showWeekView() {
    if (_viewMode == AgendaViewMode.week) return;
    _viewMode = AgendaViewMode.week;
    notifyListeners();
  }

  void goToToday() {
    _focusedDay = dateOnly(_now());
    notifyListeners();
  }

  void goToPreviousDay() {
    _focusedDay = _focusedDay.subtract(const Duration(days: 1));
    notifyListeners();
  }

  void goToNextDay() {
    _focusedDay = _focusedDay.add(const Duration(days: 1));
    notifyListeners();
  }

  void goToPreviousWeek() {
    _focusedDay = _focusedDay.subtract(const Duration(days: 7));
    notifyListeners();
  }

  void goToNextWeek() {
    _focusedDay = _focusedDay.add(const Duration(days: 7));
    notifyListeners();
  }

  Future<void> load() async {
    _status = AgendaLoadStatus.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      final anchor = dateOnly(_now());
      final results = await _appointments.listAppointments(
        from: anchor.subtract(_windowPast),
        to: anchor.add(_windowFuture),
      );
      final patients = await _patients.listPatients();
      _windowAppointments = results;
      _patientNames = {for (final patient in patients) patient.id: patient.name};
      _status = AgendaLoadStatus.ready;
    } catch (_) {
      _status = AgendaLoadStatus.error;
      _errorMessage = 'Não foi possível carregar a agenda.';
    }
    notifyListeners();
  }

  /// Pré-checagem de conflito no client, aplicando EXATAMENTE a mesma regra
  /// ([AppointmentConflictDetector]) usada pelo adapter — cobre o critério
  /// de aceite "detecção de conflito de horário executada no client antes da
  /// confirmação". A checagem definitiva ainda acontece no adapter (mock ou
  /// HTTP) ao efetivar a criação/remarcação.
  bool hasConflict({
    required DateTime startsAt,
    required int durationMinutes,
    String? excludeAppointmentId,
  }) {
    return _detector.conflicts(
      startsAt: startsAt,
      durationMinutes: durationMinutes,
      existing: _windowAppointments,
      excludeAppointmentId: excludeAppointmentId,
    );
  }

  /// Cria uma consulta (avulsa ou com recorrência semanal simples). Retorna
  /// `true` em sucesso; em falha (inclusive conflito de horário), retorna
  /// `false` e popula [actionErrorMessage].
  Future<bool> createAppointment({
    required String patientId,
    required DateTime startsAt,
    required int durationMinutes,
    WeeklyRecurrence? recurrence,
  }) async {
    _actionErrorMessage = null;
    try {
      await _appointments.createAppointment(
        AppointmentCreateRequest(
          patientId: patientId,
          startsAt: startsAt,
          durationMinutes: durationMinutes,
          recurrence: recurrence,
        ),
      );
      await load();
      return true;
    } on AppointmentAdapterException catch (error) {
      _actionErrorMessage = error.message;
      notifyListeners();
      return false;
    }
  }

  /// Remarca uma consulta existente. Afeta somente a ocorrência indicada
  /// (ver documentação de [AppointmentAdapter.rescheduleAppointment]).
  Future<bool> reschedule({
    required String appointmentId,
    required DateTime newStartsAt,
    int? newDurationMinutes,
  }) async {
    _actionErrorMessage = null;
    try {
      await _appointments.rescheduleAppointment(
        appointmentId,
        AppointmentUpdateRequest(
          startsAt: newStartsAt,
          durationMinutes: newDurationMinutes,
        ),
      );
      await load();
      return true;
    } on AppointmentAdapterException catch (error) {
      _actionErrorMessage = error.message;
      notifyListeners();
      return false;
    }
  }

  /// Cancela uma consulta (ação destrutiva — a confirmação é responsabilidade
  /// da UI antes de chamar este método).
  Future<bool> cancel(String appointmentId) async {
    _actionErrorMessage = null;
    try {
      await _appointments.cancelAppointment(appointmentId);
      await load();
      return true;
    } on AppointmentAdapterException catch (error) {
      _actionErrorMessage = error.message;
      notifyListeners();
      return false;
    }
  }
}
