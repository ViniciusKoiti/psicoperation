import 'package:flutter/material.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../agenda/data/appointment_adapter.dart';
import '../../patients/data/patients_adapter.dart';
import '../data/charge_adapter.dart';
import '../data/task_adapter.dart';
import '../state/dashboard_controller.dart';

/// Dashboard do dia (PSI-041): tela de abertura que consolida, num único
/// lugar, as próximas consultas de hoje, as pendências financeiras
/// (mensalidades pendentes/atrasadas) e as tarefas do dia.
///
/// Cria e gerencia seu próprio [DashboardController] a partir dos adapters
/// injetados — mesmo padrão de camadas de `HomeScreen`/`HomeController`
/// (PSI-013/PSI-040): apresentação, estado e dados separados.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.appointmentAdapter,
    required this.chargeAdapter,
    required this.taskAdapter,
    required this.patientsAdapter,
    this.onOpenAgenda,
    this.now,
  });

  final AppointmentAdapter appointmentAdapter;
  final ChargeAdapter chargeAdapter;
  final TaskAdapter taskAdapter;
  final PatientsAdapter patientsAdapter;

  /// Acionado pelo botão "Ver agenda completa" — a navegação em si é
  /// responsabilidade de quem monta a tela (mantém este widget agnóstico ao
  /// `go_router`).
  final VoidCallback? onOpenAgenda;

  /// Relógio injetável — usado apenas em testes para alinhar "hoje" com o
  /// instante de referência usado pelos adapters mock (produção usa
  /// `DateTime.now` via [DashboardController]).
  final DateTime Function()? now;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final DashboardController _controller = DashboardController(
    widget.appointmentAdapter,
    widget.chargeAdapter,
    widget.taskAdapter,
    widget.patientsAdapter,
    now: widget.now,
  );

  @override
  void initState() {
    super.initState();
    _controller.load();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hoje'),
        actions: [
          if (widget.onOpenAgenda != null)
            TextButton(
              key: const Key('dashboard-open-agenda-button'),
              onPressed: widget.onOpenAgenda,
              child: const Text('Ver agenda'),
            ),
        ],
      ),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return switch (_controller.status) {
            DashboardStatus.loading => const Center(
              key: Key('dashboard-loading'),
              child: CircularProgressIndicator(),
            ),
            DashboardStatus.error => Center(
              child: Text(
                _controller.errorMessage ?? 'Não foi possível carregar o dashboard.',
                key: const Key('dashboard-error'),
                style: textTheme.bodyLarge?.copyWith(color: colors.error),
              ),
            ),
            DashboardStatus.ready => RefreshIndicator(
              onRefresh: _controller.load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    formatDatePtBr(_controller.today),
                    style: textTheme.titleMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _SectionHeader('Consultas de hoje'),
                  _AppointmentsSection(controller: _controller),
                  const SizedBox(height: 24),
                  _SectionHeader('Pendências financeiras'),
                  _ChargesSection(controller: _controller),
                  const SizedBox(height: 24),
                  _SectionHeader('Tarefas de hoje'),
                  _TasksSection(controller: _controller),
                ],
              ),
            ),
          };
        },
      ),
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
        style: textTheme.titleMedium?.copyWith(
          color: colors.primary,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _EmptyStateText extends StatelessWidget {
  const _EmptyStateText(this.message, {required this.dataKey});

  final String message;
  final Key dataKey;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Padding(
      key: dataKey,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Text(message, style: TextStyle(color: colors.onSurfaceVariant)),
    );
  }
}

class _AppointmentsSection extends StatelessWidget {
  const _AppointmentsSection({required this.controller});

  final DashboardController controller;

  @override
  Widget build(BuildContext context) {
    final appointments = controller.todayAppointments;
    if (appointments.isEmpty) {
      return const _EmptyStateText(
        'Nenhuma consulta agendada para hoje.',
        dataKey: Key('dashboard-appointments-empty'),
      );
    }
    return Column(
      children: [
        for (final appointment in appointments)
          _AppointmentTile(
            key: Key('dashboard-appointment-${appointment.id}'),
            appointment: appointment,
            patientName: controller.patientName(appointment.patientId),
          ),
      ],
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  const _AppointmentTile({
    super.key,
    required this.appointment,
    required this.patientName,
  });

  final Appointment appointment;
  final String patientName;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: Text(
          formatTimePtBr(appointment.startsAt),
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(color: colors.primary),
        ),
        title: Text(patientName),
        trailing: _StatusPill(appointmentStatusLabel(appointment.status)),
      ),
    );
  }
}

class _ChargesSection extends StatelessWidget {
  const _ChargesSection({required this.controller});

  final DashboardController controller;

  @override
  Widget build(BuildContext context) {
    final charges = controller.pendingCharges;
    if (charges.isEmpty) {
      return const _EmptyStateText(
        'Nenhuma pendência financeira.',
        dataKey: Key('dashboard-charges-empty'),
      );
    }
    return Column(
      children: [
        for (final charge in charges)
          _ChargeTile(
            key: Key('dashboard-charge-${charge.id}'),
            charge: charge,
            patientName: controller.patientName(charge.patientId),
          ),
      ],
    );
  }
}

class _ChargeTile extends StatelessWidget {
  const _ChargeTile({super.key, required this.charge, required this.patientName});

  final Charge charge;
  final String patientName;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final overdue = charge.status == ChargeStatus.atrasada;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        title: Text(patientName),
        subtitle: Text('Vencimento ${formatDatePtBr(charge.dueDate)}'),
        trailing: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              formatCentsBRL(charge.amount),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            _StatusPill(
              chargeStatusLabel(charge.status),
              color: overdue ? colors.error : colors.tertiary,
            ),
          ],
        ),
      ),
    );
  }
}

class _TasksSection extends StatelessWidget {
  const _TasksSection({required this.controller});

  final DashboardController controller;

  @override
  Widget build(BuildContext context) {
    final tasks = controller.todayTasks;
    if (tasks.isEmpty) {
      return const _EmptyStateText(
        'Nenhuma tarefa para hoje.',
        dataKey: Key('dashboard-tasks-empty'),
      );
    }
    return Column(
      children: [
        for (final task in tasks)
          _TaskTile(key: Key('dashboard-task-${task.id}'), task: task),
      ],
    );
  }
}

class _TaskTile extends StatelessWidget {
  const _TaskTile({super.key, required this.task});

  final Task task;

  @override
  Widget build(BuildContext context) {
    final done = task.completedAt != null;
    final colors = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: Icon(
          done ? Icons.check_circle : Icons.radio_button_unchecked,
          color: done ? colors.tertiary : colors.onSurfaceVariant,
        ),
        title: Text(
          task.title,
          style: TextStyle(
            decoration: done ? TextDecoration.lineThrough : null,
            color: done ? colors.onSurfaceVariant : null,
          ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill(this.label, {this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final pillColor = color ?? colors.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: pillColor.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: pillColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
