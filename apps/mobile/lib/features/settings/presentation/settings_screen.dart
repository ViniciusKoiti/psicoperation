import 'package:flutter/material.dart';

import '../../../app/formatting.dart';
import '../../home/data/profile_repository.dart';
import '../data/settings_adapter.dart';
import '../state/settings_controller.dart';

/// Antecedências (em dias) oferecidas para o lembrete de cobrança no MVP.
const List<int> _reminderDaysBeforeOptions = [1, 2, 3, 5, 7];

/// Converte um texto pt-BR em centavos, ou `null` se inválido. Reaproveita
/// [parseCentsFromBRLInput] (mesma conversão usada pelo valor da
/// mensalidade do paciente, PSI-042) — mantém uma única implementação de
/// parsing monetário no app.
int? _parseFeeCents(String? value) {
  final trimmed = value?.trim() ?? '';
  if (trimmed.isEmpty) return null;
  return parseCentsFromBRLInput(trimmed);
}

String? _validateFeeField(String? value) {
  final cents = _parseFeeCents(value);
  if (cents == null) return 'Informe um valor monetário válido (ex.: 150,00).';
  if (cents <= 0) return 'O valor deve ser maior que zero.';
  return null;
}

/// Tela de configurações (PSI-043): perfil da psicóloga, valor padrão de
/// sessão (entrada monetária mascarada em centavos BRL), preferências de
/// lembrete de cobrança e logout.
///
/// Cria e gerencia seu próprio [SettingsController] a partir dos adapters
/// injetados — mesmo padrão de camadas das demais telas (PSI-041/042).
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({
    super.key,
    required this.profileRepository,
    required this.settingsAdapter,
    required this.onLogout,
  });

  final ProfileRepository profileRepository;
  final SettingsAdapter settingsAdapter;

  /// Encerra a sessão gerenciada pela PSI-040 (`SessionController.logout`).
  /// O redirect do `go_router` leva a usuária de volta ao login
  /// automaticamente (mesmo padrão de `HomeScreen`).
  final Future<void> Function() onLogout;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final SettingsController _controller = SettingsController(
    widget.profileRepository,
    widget.settingsAdapter,
  );

  final _profileFormKey = GlobalKey<FormState>();
  final _feeFormKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _feeController;

  bool _savingProfile = false;
  bool _savingFee = false;
  bool _savingReminder = false;

  bool _reminderEnabled = true;
  int _reminderDaysBefore = 3;
  bool _reminderInitialized = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _feeController = TextEditingController();
    _controller.addListener(_syncFieldsFromController);
    _controller.load();
  }

  void _syncFieldsFromController() {
    if (_controller.status != SettingsStatus.ready) return;
    final user = _controller.user;
    if (user != null && _nameController.text.isEmpty) {
      _nameController.text = user.name;
    }
    final settings = _controller.accountSettings;
    if (settings != null && _feeController.text.isEmpty) {
      _feeController.text = centsToBRLInput(settings.defaultMonthlyFee ?? 0);
    }
    final reminder = _controller.reminderPreferences;
    if (reminder != null && !_reminderInitialized) {
      _reminderInitialized = true;
      setState(() {
        _reminderEnabled = reminder.enabled;
        _reminderDaysBefore = reminder.daysBefore;
      });
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_syncFieldsFromController);
    _controller.dispose();
    _nameController.dispose();
    _feeController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    final form = _profileFormKey.currentState;
    if (form == null || !form.validate()) return;
    setState(() => _savingProfile = true);
    final success = await _controller.saveProfileName(_nameController.text.trim());
    if (!mounted) return;
    setState(() => _savingProfile = false);
    _showFeedback(success, 'Perfil salvo.', _controller.actionErrorMessage);
  }

  Future<void> _saveFee() async {
    final form = _feeFormKey.currentState;
    if (form == null || !form.validate()) return;
    final cents = _parseFeeCents(_feeController.text)!;
    setState(() => _savingFee = true);
    final success = await _controller.saveDefaultSessionFee(cents);
    if (!mounted) return;
    setState(() => _savingFee = false);
    _showFeedback(success, 'Valor padrão de sessão salvo.', _controller.actionErrorMessage);
  }

  Future<void> _saveReminderPreferences() async {
    setState(() => _savingReminder = true);
    final success = await _controller.saveReminderPreferences(
      enabled: _reminderEnabled,
      daysBefore: _reminderDaysBefore,
    );
    if (!mounted) return;
    setState(() => _savingReminder = false);
    _showFeedback(success, 'Preferências de lembrete salvas.', _controller.actionErrorMessage);
  }

  void _showFeedback(bool success, String successMessage, String? errorMessage) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? successMessage : (errorMessage ?? 'Não foi possível salvar.'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Scaffold(
          appBar: AppBar(title: const Text('Configurações')),
          body: switch (_controller.status) {
            SettingsStatus.loading => const Center(
              key: Key('settings-loading'),
              child: CircularProgressIndicator(),
            ),
            SettingsStatus.error => Center(
              child: Text(
                _controller.errorMessage ?? 'Não foi possível carregar as configurações.',
                key: const Key('settings-error'),
                style: textTheme.bodyLarge?.copyWith(color: colors.error),
              ),
            ),
            SettingsStatus.ready => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _SectionHeader('Perfil'),
                Form(
                  key: _profileFormKey,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        key: const Key('settings-name-field'),
                        controller: _nameController,
                        decoration: const InputDecoration(labelText: 'Nome de exibição'),
                        validator: (value) {
                          final trimmed = value?.trim() ?? '';
                          if (trimmed.isEmpty) return 'Informe o nome.';
                          return null;
                        },
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _controller.user?.email ?? '',
                        style: TextStyle(color: colors.onSurfaceVariant),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        key: const Key('settings-save-profile-button'),
                        onPressed: _savingProfile ? null : _saveProfile,
                        child: _savingProfile
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Salvar perfil'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _SectionHeader('Valor padrão de sessão'),
                Form(
                  key: _feeFormKey,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        key: const Key('settings-default-fee-field'),
                        controller: _feeController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(
                          labelText: 'Valor padrão de sessão (R\$)',
                          hintText: '150,00',
                        ),
                        validator: _validateFeeField,
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        key: const Key('settings-save-fee-button'),
                        onPressed: _savingFee ? null : _saveFee,
                        child: _savingFee
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Salvar valor padrão'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                _SectionHeader('Lembretes de cobrança'),
                SwitchListTile(
                  key: const Key('settings-reminder-enabled-switch'),
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Enviar lembrete de cobrança'),
                  value: _reminderEnabled,
                  onChanged: (value) => setState(() => _reminderEnabled = value),
                ),
                if (_reminderEnabled)
                  DropdownButtonFormField<int>(
                    key: const Key('settings-reminder-days-field'),
                    value: _reminderDaysBefore,
                    decoration: const InputDecoration(labelText: 'Antecedência (dias)'),
                    items: [
                      for (final days in _reminderDaysBeforeOptions)
                        DropdownMenuItem(
                          value: days,
                          child: Text(days == 1 ? '1 dia antes' : '$days dias antes'),
                        ),
                    ],
                    onChanged: (value) {
                      if (value != null) setState(() => _reminderDaysBefore = value);
                    },
                  ),
                const SizedBox(height: 8),
                Text(
                  'O envio do lembrete é feito pelo servidor do PsiOps, não pelo '
                  'aplicativo — esta preferência só define se e com quanta '
                  'antecedência ele deve ser disparado.',
                  style: textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  key: const Key('settings-save-reminder-button'),
                  onPressed: _savingReminder ? null : _saveReminderPreferences,
                  child: _savingReminder
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Salvar preferências de lembrete'),
                ),
                const SizedBox(height: 32),
                const Divider(),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  key: const Key('settings-logout-button'),
                  onPressed: () => widget.onLogout(),
                  icon: const Icon(Icons.logout),
                  label: const Text('Sair da conta'),
                ),
              ],
            ),
          },
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: textTheme.titleMedium?.copyWith(color: colors.primary, fontWeight: FontWeight.w600),
      ),
    );
  }
}
