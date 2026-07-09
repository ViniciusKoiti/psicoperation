import 'package:flutter/material.dart';
import 'package:psiops_contracts/api.dart';

import '../../../../app/formatting.dart';
import '../../data/recurrence_utils.dart';
import '../../state/agenda_controller.dart';

/// Resultado de submissão do formulário de agendamento/remarcação —
/// devolvido ao chamador para exibir feedback (ex.: `SnackBar`) sem acoplar
/// o sheet à navegação.
enum AppointmentFormResult { created, rescheduled, cancelledByUser }

/// Formulário de criação de consulta (com recorrência semanal simples
/// opcional) ou de remarcação de uma consulta existente.
///
/// A detecção de conflito roda no client a cada mudança de data/horário/
/// duração (via [AgendaController.hasConflict], que aplica exatamente a
/// mesma regra usada pelos adapters — `AppointmentConflictDetector`),
/// bloqueando o botão de confirmação e exibindo um aviso explícito enquanto
/// houver sobreposição (critério de aceite de PSI-041: detecção "antes da
/// confirmação").
class AppointmentFormSheet extends StatefulWidget {
  const AppointmentFormSheet.create({
    super.key,
    required this.controller,
    required this.patients,
    required this.initialStartsAt,
  }) : rescheduling = null;

  const AppointmentFormSheet.reschedule({
    super.key,
    required this.controller,
    required Appointment appointment,
  }) : rescheduling = appointment,
       patients = const [],
       initialStartsAt = null;

  final AgendaController controller;
  final List<Patient> patients;
  final DateTime? initialStartsAt;
  final Appointment? rescheduling;

  @override
  State<AppointmentFormSheet> createState() => _AppointmentFormSheetState();
}

const List<int> _durationOptions = [30, 50, 60, 90];

class _AppointmentFormSheetState extends State<AppointmentFormSheet> {
  late DateTime _startsAt;
  late int _durationMinutes;
  String? _patientId;
  bool _repeatsWeekly = false;
  DateTime? _repeatUntil;
  bool _submitting = false;
  String? _submitError;

  bool get _isReschedule => widget.rescheduling != null;

  @override
  void initState() {
    super.initState();
    final rescheduling = widget.rescheduling;
    if (rescheduling != null) {
      _startsAt = rescheduling.startsAt;
      _durationMinutes = rescheduling.durationMinutes;
    } else {
      _startsAt = widget.initialStartsAt ?? DateTime.now();
      _durationMinutes = 50;
      _patientId = widget.patients.isNotEmpty ? widget.patients.first.id : null;
    }
  }

  bool get _hasConflict => widget.controller.hasConflict(
    startsAt: _startsAt,
    durationMinutes: _durationMinutes,
    excludeAppointmentId: widget.rescheduling?.id,
  );

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startsAt,
      firstDate: DateTime(_startsAt.year - 1),
      lastDate: DateTime(_startsAt.year + 2),
    );
    if (picked == null) return;
    setState(() {
      _startsAt = DateTime(
        picked.year,
        picked.month,
        picked.day,
        _startsAt.hour,
        _startsAt.minute,
      );
    });
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_startsAt),
    );
    if (picked == null) return;
    setState(() {
      _startsAt = DateTime(
        _startsAt.year,
        _startsAt.month,
        _startsAt.day,
        picked.hour,
        picked.minute,
      );
    });
  }

  Future<void> _pickRepeatUntil() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _repeatUntil ?? _startsAt.add(const Duration(days: 90)),
      firstDate: _startsAt,
      lastDate: DateTime(_startsAt.year + 2),
    );
    if (picked == null) return;
    setState(() => _repeatUntil = dateOnly(picked));
  }

  Future<void> _submit() async {
    if (_hasConflict) return;
    if (!_isReschedule && (_patientId == null || _patientId!.isEmpty)) return;

    setState(() {
      _submitting = true;
      _submitError = null;
    });

    bool success;
    if (_isReschedule) {
      success = await widget.controller.reschedule(
        appointmentId: widget.rescheduling!.id,
        newStartsAt: _startsAt,
        newDurationMinutes: _durationMinutes,
      );
    } else {
      final recurrence = _repeatsWeekly
          ? WeeklyRecurrence(weekday: weekdayEnumFor(_startsAt), until: _repeatUntil)
          : null;
      success = await widget.controller.createAppointment(
        patientId: _patientId!,
        startsAt: _startsAt,
        durationMinutes: _durationMinutes,
        recurrence: recurrence,
      );
    }

    if (!mounted) return;
    if (success) {
      Navigator.of(
        context,
      ).pop(_isReschedule ? AppointmentFormResult.rescheduled : AppointmentFormResult.created);
      return;
    }
    setState(() {
      _submitting = false;
      _submitError = widget.controller.actionErrorMessage;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final conflict = _hasConflict;
    final canSubmit = !_submitting && !conflict && (_isReschedule || _patientId != null);

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _isReschedule ? 'Remarcar consulta' : 'Nova consulta',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            if (!_isReschedule) ...[
              DropdownButtonFormField<String>(
                key: const Key('agenda-form-patient-field'),
                value: _patientId,
                decoration: const InputDecoration(labelText: 'Paciente'),
                items: [
                  for (final patient in widget.patients)
                    DropdownMenuItem(value: patient.id, child: Text(patient.name)),
                ],
                onChanged: (value) => setState(() => _patientId = value),
              ),
              const SizedBox(height: 12),
            ],
            ListTile(
              key: const Key('agenda-form-date-field'),
              contentPadding: EdgeInsets.zero,
              title: const Text('Data'),
              subtitle: Text(formatDatePtBr(_startsAt)),
              trailing: TextButton(onPressed: _pickDate, child: const Text('Alterar')),
            ),
            ListTile(
              key: const Key('agenda-form-time-field'),
              contentPadding: EdgeInsets.zero,
              title: const Text('Horário'),
              subtitle: Text(formatTimePtBr(_startsAt)),
              trailing: TextButton(onPressed: _pickTime, child: const Text('Alterar')),
            ),
            DropdownButtonFormField<int>(
              key: const Key('agenda-form-duration-field'),
              value: _durationMinutes,
              decoration: const InputDecoration(labelText: 'Duração (minutos)'),
              items: [
                for (final minutes in _durationOptions)
                  DropdownMenuItem(value: minutes, child: Text('$minutes min')),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _durationMinutes = value);
              },
            ),
            if (!_isReschedule) ...[
              const SizedBox(height: 8),
              CheckboxListTile(
                key: const Key('agenda-form-recurrence-checkbox'),
                contentPadding: EdgeInsets.zero,
                value: _repeatsWeekly,
                title: const Text('Repetir semanalmente'),
                subtitle: Text(
                  'Mesmo dia/horário toda semana (${weekdayLabelLong(_startsAt)}, '
                  '${formatTimePtBr(_startsAt)}).',
                ),
                onChanged: (value) => setState(() => _repeatsWeekly = value ?? false),
              ),
              if (_repeatsWeekly)
                ListTile(
                  key: const Key('agenda-form-recurrence-until-field'),
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Repetir até (opcional)'),
                  subtitle: Text(
                    _repeatUntil == null ? 'Sem data final' : formatDatePtBr(_repeatUntil!),
                  ),
                  trailing: TextButton(
                    onPressed: _pickRepeatUntil,
                    child: const Text('Definir'),
                  ),
                ),
            ],
            if (conflict) ...[
              const SizedBox(height: 12),
              Container(
                key: const Key('agenda-form-conflict-message'),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colors.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Este horário conflita com outra consulta já agendada. '
                  'Escolha outro dia/horário para continuar.',
                  style: TextStyle(color: colors.onErrorContainer),
                ),
              ),
            ],
            if (_submitError != null) ...[
              const SizedBox(height: 12),
              Text(
                _submitError!,
                key: const Key('agenda-form-submit-error'),
                style: TextStyle(color: colors.error),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              key: const Key('agenda-form-submit-button'),
              onPressed: canSubmit ? _submit : null,
              child: _submitting
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_isReschedule ? 'Confirmar remarcação' : 'Confirmar agendamento'),
            ),
          ],
        ),
      ),
    );
  }
}
