import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../agenda/data/appointment_adapter.dart';
import '../../agenda/data/patient_lookup_adapter.dart';
import '../data/charge_adapter.dart';
import '../data/task_adapter.dart';

/// Estado de carregamento do dashboard.
enum DashboardStatus { loading, ready, error }

/// Estado (separado da apresentação) da feature Dashboard do dia.
///
/// Agrega três fontes de dados independentes — próximas consultas do dia
/// ([AppointmentAdapter]), pendências financeiras ([ChargeAdapter]) e
/// tarefas do dia ([TaskAdapter]) — mais a resolução de nomes de paciente
/// ([PatientLookupAdapter]). Todas injetadas: o ponto de composição
/// (`app/app.dart`) decide mock vs. real, seguindo o padrão de PSI-040.
class DashboardController extends ChangeNotifier {
  DashboardController(
    this._appointments,
    this._charges,
    this._tasks,
    this._patients, {
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final AppointmentAdapter _appointments;
  final ChargeAdapter _charges;
  final TaskAdapter _tasks;
  final PatientLookupAdapter _patients;
  final DateTime Function() _now;

  DashboardStatus _status = DashboardStatus.loading;
  DashboardStatus get status => _status;

  DateTime get today => dateOnly(_now());

  List<Appointment> _todayAppointments = [];

  /// Próximas consultas de hoje (não canceladas), ordenadas por horário.
  List<Appointment> get todayAppointments => _todayAppointments;

  List<Charge> _pendingCharges = [];

  /// Mensalidades `pendente`/`atrasada`, ordenadas por vencimento (as mais
  /// urgentes primeiro).
  List<Charge> get pendingCharges => _pendingCharges;

  List<Task> _todayTasks = [];

  /// Tarefas cujo `dueDate` cai em hoje, pendentes primeiro.
  List<Task> get todayTasks => _todayTasks;

  Map<String, String> _patientNames = {};

  /// Nome do paciente para exibição — cai para um rótulo genérico se o
  /// paciente não estiver (ainda) na carteira resolvida.
  String patientName(String patientId) =>
      _patientNames[patientId] ?? 'Paciente';

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  Future<void> load() async {
    _status = DashboardStatus.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      final todayDate = dateOnly(_now());
      final tomorrow = todayDate.add(const Duration(days: 1));

      final appointmentsResult = await _appointments.listAppointments(
        from: todayDate,
        to: tomorrow,
      );
      final chargesResult = await _charges.listCharges();
      final tasksResult = await _tasks.listTasks();
      final patients = await _patients.listPatients();

      _todayAppointments =
          appointmentsResult
              .where((a) => a.status != AppointmentStatus.cancelada)
              .toList()
            ..sort((a, b) => a.startsAt.compareTo(b.startsAt));

      _pendingCharges =
          chargesResult
              .where(
                (c) =>
                    c.status == ChargeStatus.pendente ||
                    c.status == ChargeStatus.atrasada,
              )
              .toList()
            ..sort((a, b) => a.dueDate.compareTo(b.dueDate));

      _todayTasks =
          tasksResult
              .where((t) => t.dueDate != null && isSameDate(t.dueDate!, todayDate))
              .toList()
            ..sort((a, b) {
              final aDone = a.completedAt != null;
              final bDone = b.completedAt != null;
              if (aDone == bDone) return a.title.compareTo(b.title);
              return aDone ? 1 : -1;
            });

      _patientNames = {for (final patient in patients) patient.id: patient.name};
      _status = DashboardStatus.ready;
    } catch (_) {
      _status = DashboardStatus.error;
      _errorMessage = 'Não foi possível carregar o dashboard.';
    }
    notifyListeners();
  }
}
