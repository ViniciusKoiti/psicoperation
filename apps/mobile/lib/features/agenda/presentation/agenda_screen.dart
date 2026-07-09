import 'dart:async';

import 'package:flutter/material.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../data/appointment_adapter.dart';
import '../data/patient_lookup_adapter.dart';
import '../state/agenda_controller.dart';
import 'widgets/appointment_form_sheet.dart';

/// Agenda de consultas (PSI-041): visões diária e semanal, com criação,
/// remarcação e cancelamento de consulta, e recorrência semanal simples.
///
/// Cria e gerencia seu próprio [AgendaController] a partir dos adapters
/// injetados — mesmo padrão de camadas de `HomeScreen`/`HomeController`.
class AgendaScreen extends StatefulWidget {
  const AgendaScreen({
    super.key,
    required this.appointmentAdapter,
    required this.patientLookupAdapter,
    this.now,
  });

  final AppointmentAdapter appointmentAdapter;
  final PatientLookupAdapter patientLookupAdapter;

  /// Relógio injetável — usado apenas em testes para alinhar "hoje" com o
  /// instante de referência usado pelos adapters mock (produção usa
  /// `DateTime.now` via [AgendaController]).
  final DateTime Function()? now;

  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen> {
  late final AgendaController _controller = AgendaController(
    widget.appointmentAdapter,
    widget.patientLookupAdapter,
    now: widget.now,
  );

  List<Patient> _patients = [];

  @override
  void initState() {
    super.initState();
    _controller.load();
    unawaited(_loadPatients());
  }

  Future<void> _loadPatients() async {
    final patients = await widget.patientLookupAdapter.listPatients();
    if (!mounted) return;
    setState(() => _patients = patients);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _openCreateForm() async {
    // Horário padrão de uma nova consulta: dia em foco às 09:00. A checagem
    // de conflito acontece dentro do sheet a cada mudança de data/horário.
    final defaultStartsAt = DateTime(
      _controller.focusedDay.year,
      _controller.focusedDay.month,
      _controller.focusedDay.day,
      9,
    );
    final result = await showModalBottomSheet<AppointmentFormResult>(
      context: context,
      isScrollControlled: true,
      builder: (context) => AppointmentFormSheet.create(
        controller: _controller,
        patients: _patients,
        initialStartsAt: defaultStartsAt,
      ),
    );
    if (!mounted || result == null) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Consulta agendada.')));
  }

  Future<void> _openRescheduleForm(Appointment appointment) async {
    final result = await showModalBottomSheet<AppointmentFormResult>(
      context: context,
      isScrollControlled: true,
      builder: (context) =>
          AppointmentFormSheet.reschedule(controller: _controller, appointment: appointment),
    );
    if (!mounted || result == null) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Consulta remarcada.')));
  }

  Future<void> _confirmCancel(Appointment appointment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar consulta?'),
        content: Text(
          'A consulta de ${_controller.patientName(appointment.patientId)} em '
          '${formatDateTimePtBr(appointment.startsAt)} será cancelada. '
          'Esta ação não pode ser desfeita.'
          '${appointment.recurrence != null ? ' Apenas esta ocorrência será cancelada; as demais da série semanal permanecem.' : ''}',
        ),
        actions: [
          TextButton(
            key: const Key('agenda-cancel-dismiss-button'),
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            key: const Key('agenda-cancel-confirm-button'),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Cancelar consulta'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final success = await _controller.cancel(appointment.id);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          success ? 'Consulta cancelada.' : (_controller.actionErrorMessage ?? 'Não foi possível cancelar.'),
        ),
      ),
    );
  }

  Future<void> _openActions(Appointment appointment) async {
    final action = await showModalBottomSheet<_AppointmentAction>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              key: const Key('agenda-action-reschedule-button'),
              leading: const Icon(Icons.edit_calendar_outlined),
              title: const Text('Remarcar'),
              onTap: () => Navigator.of(context).pop(_AppointmentAction.reschedule),
            ),
            ListTile(
              key: const Key('agenda-action-cancel-button'),
              leading: const Icon(Icons.event_busy_outlined),
              title: const Text('Cancelar'),
              onTap: () => Navigator.of(context).pop(_AppointmentAction.cancel),
            ),
          ],
        ),
      ),
    );
    if (!mounted || action == null) return;
    switch (action) {
      case _AppointmentAction.reschedule:
        await _openRescheduleForm(appointment);
      case _AppointmentAction.cancel:
        await _confirmCancel(appointment);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda'),
        actions: [
          TextButton(
            key: const Key('agenda-today-button'),
            onPressed: () {
              _controller.goToToday();
            },
            child: const Text('Hoje'),
          ),
        ],
      ),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: SegmentedButton<AgendaViewMode>(
                  segments: const [
                    ButtonSegment(
                      value: AgendaViewMode.day,
                      label: Text('Dia'),
                      icon: Icon(Icons.calendar_view_day),
                    ),
                    ButtonSegment(
                      value: AgendaViewMode.week,
                      label: Text('Semana'),
                      icon: Icon(Icons.calendar_view_week),
                    ),
                  ],
                  selected: {_controller.viewMode},
                  onSelectionChanged: (selection) {
                    if (selection.first == AgendaViewMode.day) {
                      _controller.showDayView();
                    } else {
                      _controller.showWeekView();
                    }
                  },
                ),
              ),
              Expanded(
                child: switch (_controller.status) {
                  AgendaLoadStatus.loading => const Center(
                    key: Key('agenda-loading'),
                    child: CircularProgressIndicator(),
                  ),
                  AgendaLoadStatus.error => Center(
                    child: Text(
                      _controller.errorMessage ?? 'Não foi possível carregar a agenda.',
                      key: const Key('agenda-error'),
                      style: textTheme.bodyLarge?.copyWith(color: colors.error),
                    ),
                  ),
                  AgendaLoadStatus.ready => _controller.viewMode == AgendaViewMode.day
                      ? _DayView(controller: _controller, onOpenActions: _openActions)
                      : _WeekView(controller: _controller, onOpenActions: _openActions),
                },
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('agenda-fab'),
        onPressed: _openCreateForm,
        icon: const Icon(Icons.add),
        label: const Text('Nova consulta'),
      ),
    );
  }
}

enum _AppointmentAction { reschedule, cancel }

class _DayView extends StatelessWidget {
  const _DayView({required this.controller, required this.onOpenActions});

  final AgendaController controller;
  final void Function(Appointment appointment) onOpenActions;

  @override
  Widget build(BuildContext context) {
    final day = controller.focusedDay;
    final isToday = isSameDate(day, controller.today);
    final appointments = controller.appointmentsOn(day);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                key: const Key('agenda-previous-day-button'),
                icon: const Icon(Icons.chevron_left),
                onPressed: controller.goToPreviousDay,
              ),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${weekdayLabelLong(day)}${isToday ? ' • Hoje' : ''}',
                      key: const Key('agenda-focused-day-label'),
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(
                        context,
                      ).textTheme.titleMedium?.copyWith(color: Theme.of(context).colorScheme.primary),
                    ),
                    Text(formatDatePtBr(day), textAlign: TextAlign.center),
                  ],
                ),
              ),
              IconButton(
                key: const Key('agenda-next-day-button'),
                icon: const Icon(Icons.chevron_right),
                onPressed: controller.goToNextDay,
              ),
            ],
          ),
        ),
        Expanded(child: _AppointmentList(appointments: appointments, controller: controller, onOpenActions: onOpenActions)),
      ],
    );
  }
}

class _WeekView extends StatelessWidget {
  const _WeekView({required this.controller, required this.onOpenActions});

  final AgendaController controller;
  final void Function(Appointment appointment) onOpenActions;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final selectedDay = controller.focusedDay;
    final appointments = controller.appointmentsOn(selectedDay);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                key: const Key('agenda-previous-week-button'),
                icon: const Icon(Icons.chevron_left),
                onPressed: controller.goToPreviousWeek,
              ),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    for (final day in controller.weekDays)
                      Expanded(
                        child: _WeekDayChip(
                          day: day,
                          isToday: isSameDate(day, controller.today),
                          isSelected: isSameDate(day, selectedDay),
                          hasAppointments: controller.appointmentsOn(day).isNotEmpty,
                          onTap: () {
                            if (day.isBefore(selectedDay)) {
                              for (var i = selectedDay.difference(day).inDays; i > 0; i--) {
                                controller.goToPreviousDay();
                              }
                            } else if (day.isAfter(selectedDay)) {
                              for (var i = day.difference(selectedDay).inDays; i > 0; i--) {
                                controller.goToNextDay();
                              }
                            }
                          },
                        ),
                      ),
                  ],
                ),
              ),
              IconButton(
                key: const Key('agenda-next-week-button'),
                icon: const Icon(Icons.chevron_right),
                onPressed: controller.goToNextWeek,
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            '${weekdayLabelLong(selectedDay)}, ${formatDatePtBr(selectedDay)}',
            style: TextStyle(color: colors.onSurfaceVariant),
          ),
        ),
        Expanded(child: _AppointmentList(appointments: appointments, controller: controller, onOpenActions: onOpenActions)),
      ],
    );
  }
}

class _WeekDayChip extends StatelessWidget {
  const _WeekDayChip({
    required this.day,
    required this.isToday,
    required this.isSelected,
    required this.hasAppointments,
    required this.onTap,
  });

  final DateTime day;
  final bool isToday;
  final bool isSelected;
  final bool hasAppointments;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return InkWell(
      key: Key('agenda-week-day-${formatDatePtBr(day).replaceAll('/', '-')}'),
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
        decoration: BoxDecoration(
          color: isSelected ? colors.primaryContainer : null,
          border: isToday && !isSelected ? Border.all(color: colors.primary) : null,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(weekdayLabelShort(day)),
            Text(
              '${day.day}',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isSelected ? colors.onPrimaryContainer : null,
              ),
            ),
            if (hasAppointments)
              Container(
                margin: const EdgeInsets.only(top: 2),
                width: 4,
                height: 4,
                decoration: BoxDecoration(color: colors.secondary, shape: BoxShape.circle),
              ),
          ],
        ),
      ),
    );
  }
}

class _AppointmentList extends StatelessWidget {
  const _AppointmentList({
    required this.appointments,
    required this.controller,
    required this.onOpenActions,
  });

  final List<Appointment> appointments;
  final AgendaController controller;
  final void Function(Appointment appointment) onOpenActions;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    if (appointments.isEmpty) {
      return Center(
        child: Text(
          'Nenhuma consulta neste dia.',
          key: const Key('agenda-appointments-empty'),
          style: TextStyle(color: colors.onSurfaceVariant),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final appointment in appointments)
          Card(
            key: Key('agenda-appointment-${appointment.id}'),
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: ListTile(
              leading: Text(
                formatTimePtBr(appointment.startsAt),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(color: colors.primary),
              ),
              title: Text(controller.patientName(appointment.patientId)),
              subtitle: Text(
                '${appointment.durationMinutes} min'
                '${appointment.recurrence != null ? ' • repete semanalmente' : ''}',
              ),
              trailing: Text(appointmentStatusLabel(appointment.status)),
              onTap: () => onOpenActions(appointment),
            ),
          ),
      ],
    );
  }
}
