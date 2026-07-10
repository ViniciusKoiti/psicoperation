import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../data/patients_adapter.dart';

/// Estado de carregamento da lista de pacientes.
enum PatientsListStatus { loading, ready, error }

/// Estado (separado da apresentação) da lista de pacientes: carrega
/// pacientes ativos por padrão, permite alternar para o filtro de
/// arquivados e filtra por nome no client (busca reativa a cada
/// digitação — assumption do manifesto PSI-042: sem paginação/busca
/// server-side no MVP).
class PatientsListController extends ChangeNotifier {
  PatientsListController(this._adapter);

  final PatientsAdapter _adapter;

  PatientsListStatus _status = PatientsListStatus.loading;
  PatientsListStatus get status => _status;

  bool _showArchived = false;

  /// `true` quando a lista exibida é a de pacientes arquivados
  /// (`PatientStatus.inativo`); `false` para ativos (padrão).
  bool get showArchived => _showArchived;

  List<Patient> _patients = [];

  String _query = '';
  String get query => _query;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  /// Pacientes carregados, filtrados por [query] (contém, sem diferenciar
  /// maiúsculas/minúsculas) — filtro reativo aplicado a cada mudança de
  /// [setQuery].
  List<Patient> get patients {
    final normalizedQuery = _query.trim().toLowerCase();
    if (normalizedQuery.isEmpty) return List.unmodifiable(_patients);
    return _patients
        .where((patient) => patient.name.toLowerCase().contains(normalizedQuery))
        .toList(growable: false);
  }

  /// Atualiza o termo de busca e reaplica o filtro imediatamente (sem nova
  /// chamada ao adapter — a busca roda sobre a lista já carregada).
  void setQuery(String value) {
    _query = value;
    notifyListeners();
  }

  Future<void> showActivePatients() async {
    _showArchived = false;
    await load();
  }

  Future<void> showArchivedPatients() async {
    _showArchived = true;
    await load();
  }

  Future<void> load() async {
    _status = PatientsListStatus.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      final status = _showArchived ? PatientStatus.inativo : PatientStatus.ativo;
      final results = await _adapter.listPatientsByStatus(status);
      _patients = results.toList()..sort((a, b) => a.name.compareTo(b.name));
      _status = PatientsListStatus.ready;
    } catch (_) {
      _status = PatientsListStatus.error;
      _errorMessage = 'Não foi possível carregar os pacientes.';
    }
    notifyListeners();
  }
}
