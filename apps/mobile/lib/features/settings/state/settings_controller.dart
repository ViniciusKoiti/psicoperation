import 'package:flutter/foundation.dart';
import 'package:psiops_contracts/api.dart';

import '../../home/data/profile_repository.dart';
import '../data/settings_adapter.dart';

/// Estado de carregamento da tela de configurações.
enum SettingsStatus { loading, ready, error }

/// Estado (separado da apresentação) da tela de configurações (PSI-043).
///
/// Agrega três fontes de dados independentes, todas injetadas (o ponto de
/// composição `app/app.dart` decide mock vs. real, seguindo o padrão de
/// PSI-040/041/042): perfil da psicóloga ([ProfileRepository]), valor
/// padrão de sessão e demais preferências de conta ([SettingsAdapter.
/// getSettings]/[SettingsAdapter.updateSettings]) e preferências de
/// lembrete de cobrança ([SettingsAdapter.getReminderPreferences]/
/// [SettingsAdapter.updateReminderPreferences]). O logout é responsabilidade
/// do `SessionController` da PSI-040 — este controller não o gerencia,
/// apenas a tela invoca o callback injetado (mesmo padrão de `HomeScreen`).
class SettingsController extends ChangeNotifier {
  SettingsController(this._profile, this._settings);

  final ProfileRepository _profile;
  final SettingsAdapter _settings;

  SettingsStatus _status = SettingsStatus.loading;
  SettingsStatus get status => _status;

  User? _user;
  User? get user => _user;

  Settings? _accountSettings;
  Settings? get accountSettings => _accountSettings;

  ReminderPreferences? _reminderPreferences;
  ReminderPreferences? get reminderPreferences => _reminderPreferences;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  String? _actionErrorMessage;

  /// Mensagem pt-BR da última falha de ação (salvar perfil / valor padrão /
  /// preferências de lembrete). `null` quando a última ação teve sucesso.
  String? get actionErrorMessage => _actionErrorMessage;

  Future<void> load() async {
    _status = SettingsStatus.loading;
    _errorMessage = null;
    notifyListeners();
    try {
      _user = await _profile.currentProfile();
      _accountSettings = await _settings.getSettings();
      _reminderPreferences = await _settings.getReminderPreferences();
      _status = SettingsStatus.ready;
    } catch (_) {
      _status = SettingsStatus.error;
      _errorMessage = 'Não foi possível carregar as configurações.';
    }
    notifyListeners();
  }

  /// Atualiza o nome de exibição do perfil. Retorna `true` em sucesso.
  Future<bool> saveProfileName(String name) async {
    _actionErrorMessage = null;
    try {
      _user = await _profile.updateProfile(name);
      notifyListeners();
      return true;
    } catch (_) {
      _actionErrorMessage = 'Não foi possível salvar o perfil.';
      notifyListeners();
      return false;
    }
  }

  /// Atualiza o valor padrão de sessão ([cents] em centavos BRL inteiros —
  /// nunca ponto flutuante). Retorna `true` em sucesso.
  Future<bool> saveDefaultSessionFee(int cents) async {
    _actionErrorMessage = null;
    try {
      _accountSettings = await _settings.updateSettings(
        SettingsUpdateRequest(defaultMonthlyFee: cents),
      );
      notifyListeners();
      return true;
    } on SettingsAdapterException catch (error) {
      _actionErrorMessage = error.message;
      notifyListeners();
      return false;
    } catch (_) {
      _actionErrorMessage = 'Não foi possível salvar o valor padrão de sessão.';
      notifyListeners();
      return false;
    }
  }

  /// Atualiza as preferências de lembrete de cobrança (ligar/desligar +
  /// antecedência em dias). Retorna `true` em sucesso.
  Future<bool> saveReminderPreferences({required bool enabled, required int daysBefore}) async {
    _actionErrorMessage = null;
    try {
      _reminderPreferences = await _settings.updateReminderPreferences(
        ReminderPreferences(enabled: enabled, daysBefore: daysBefore),
      );
      notifyListeners();
      return true;
    } catch (_) {
      _actionErrorMessage = 'Não foi possível salvar as preferências de lembrete.';
      notifyListeners();
      return false;
    }
  }
}
