import 'package:flutter/material.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../agenda/data/appointment_adapter.dart';
import '../../dashboard/data/charge_adapter.dart';
import '../data/patients_adapter.dart';
import '../state/patient_detail_controller.dart';
import 'patient_form_screen.dart';
import 'patient_validators.dart';

/// Detalhe de um paciente (PSI-042): dados cadastrais, histórico de
/// consultas, histórico de registros administrativos (NUNCA dado clínico) e
/// situação financeira (mensalidades por status, em centavos BRL formatados
/// em pt-BR).
///
/// Cria e gerencia seu próprio [PatientDetailController] a partir dos
/// adapters injetados — mesmo padrão de camadas de `DashboardScreen`/
/// `AgendaScreen` (PSI-041).
class PatientDetailScreen extends StatefulWidget {
  const PatientDetailScreen({
    super.key,
    required this.adapter,
    required this.appointmentAdapter,
    required this.chargeAdapter,
    required this.patientId,
    this.now,
  });

  final PatientsAdapter adapter;
  final AppointmentAdapter appointmentAdapter;
  final ChargeAdapter chargeAdapter;
  final String patientId;

  /// Relógio injetável — usado apenas em testes (mesmo padrão de
  /// `AgendaScreen`/`DashboardScreen`).
  final DateTime Function()? now;

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  late final PatientDetailController _controller = PatientDetailController(
    widget.adapter,
    widget.appointmentAdapter,
    widget.chargeAdapter,
    widget.patientId,
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

  Future<void> _openEdit() async {
    final patient = _controller.patient;
    if (patient == null) return;
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => PatientFormScreen.edit(adapter: widget.adapter, patient: patient),
      ),
    );
    if (!mounted) return;
    await _controller.load();
  }

  Future<void> _confirmArchive() async {
    final patient = _controller.patient;
    if (patient == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Arquivar paciente?'),
        content: Text(
          '${patient.name} sairá da lista de pacientes ativos. O histórico de '
          'consultas, registros administrativos e mensalidades é mantido — '
          'esta ação não exclui nenhum dado.',
        ),
        actions: [
          TextButton(
            key: const Key('patient-archive-dismiss-button'),
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            key: const Key('patient-archive-confirm-button'),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Arquivar'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final success = await _controller.archive();
    if (!mounted) return;
    if (success) {
      await _controller.load();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Paciente arquivado.')));
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_controller.actionErrorMessage ?? 'Não foi possível arquivar o paciente.'),
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
        final patient = _controller.patient;
        return Scaffold(
          appBar: AppBar(
            title: Text(patient?.name ?? 'Paciente'),
            actions: [
              if (patient != null) ...[
                IconButton(
                  key: const Key('patient-detail-edit-button'),
                  tooltip: 'Editar',
                  icon: const Icon(Icons.edit_outlined),
                  onPressed: _openEdit,
                ),
                if (patient.status == PatientStatus.ativo)
                  IconButton(
                    key: const Key('patient-detail-archive-button'),
                    tooltip: 'Arquivar',
                    icon: const Icon(Icons.archive_outlined),
                    onPressed: _confirmArchive,
                  ),
              ],
            ],
          ),
          body: switch (_controller.status) {
            PatientDetailStatus.loading => const Center(
              key: Key('patient-detail-loading'),
              child: CircularProgressIndicator(),
            ),
            PatientDetailStatus.error => Center(
              child: Text(
                _controller.errorMessage ?? 'Não foi possível carregar o paciente.',
                key: const Key('patient-detail-error'),
                style: textTheme.bodyLarge?.copyWith(color: colors.error),
              ),
            ),
            PatientDetailStatus.ready => _PatientDetailBody(controller: _controller),
          },
        );
      },
    );
  }
}

class _PatientDetailBody extends StatelessWidget {
  const _PatientDetailBody({required this.controller});

  final PatientDetailController controller;

  @override
  Widget build(BuildContext context) {
    final patient = controller.patient!;

    return RefreshIndicator(
      onRefresh: controller.load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (patient.status == PatientStatus.inativo)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _StatusBanner(
                key: const Key('patient-detail-archived-banner'),
                text: 'Paciente arquivado — não recebe novas mensalidades.',
              ),
            ),
          const _SectionHeader('Dados cadastrais'),
          _CadastralInfo(patient: patient),
          const SizedBox(height: 24),
          const _SectionHeader('Histórico de consultas'),
          _AppointmentHistorySection(appointments: controller.appointmentHistory),
          const SizedBox(height: 24),
          const _SectionHeader('Registros administrativos'),
          _AdministrativeRecordsSection(records: controller.administrativeRecords),
          const SizedBox(height: 24),
          const _SectionHeader('Situação financeira'),
          _FinancialSection(charges: controller.charges),
        ],
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
        style: textTheme.titleMedium?.copyWith(color: colors.primary, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colors.tertiaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: TextStyle(color: colors.onTertiaryContainer)),
    );
  }
}

class _EmptySection extends StatelessWidget {
  const _EmptySection(this.message, {required this.dataKey});

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

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.label, this.value, {this.valueKey});

  final String label;
  final String value;
  final Key? valueKey;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(label, style: TextStyle(color: colors.onSurfaceVariant)),
          ),
          Expanded(child: Text(value, key: valueKey)),
        ],
      ),
    );
  }
}

class _CadastralInfo extends StatelessWidget {
  const _CadastralInfo({required this.patient});

  final Patient patient;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _InfoRow(
              'Situação',
              patientStatusLabel(patient.status),
              valueKey: const Key('patient-detail-status'),
            ),
            _InfoRow(
              'WhatsApp',
              patient.whatsapp == null ? 'Não informado' : formatWhatsappForDisplay(patient.whatsapp!),
            ),
            _InfoRow('E-mail', patient.email ?? 'Não informado'),
            _InfoRow(
              'Mensalidade',
              formatCentsBRL(patient.monthlyFee),
              valueKey: const Key('patient-detail-monthly-fee'),
            ),
            _InfoRow('Vencimento', 'Dia ${patient.billingDay}'),
            _InfoRow(
              'Anotações administrativas',
              (patient.notes == null || patient.notes!.trim().isEmpty)
                  ? 'Nenhuma anotação.'
                  : patient.notes!,
            ),
          ],
        ),
      ),
    );
  }
}

class _AppointmentHistorySection extends StatelessWidget {
  const _AppointmentHistorySection({required this.appointments});

  final List<Appointment> appointments;

  @override
  Widget build(BuildContext context) {
    if (appointments.isEmpty) {
      return const _EmptySection(
        'Nenhuma consulta registrada para este paciente.',
        dataKey: Key('patient-detail-appointments-empty'),
      );
    }
    return Column(
      children: [
        for (final appointment in appointments)
          Card(
            key: Key('patient-detail-appointment-${appointment.id}'),
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: ListTile(
              title: Text(formatDateTimePtBr(appointment.startsAt)),
              trailing: Text(appointmentStatusLabel(appointment.status)),
            ),
          ),
      ],
    );
  }
}

class _AdministrativeRecordsSection extends StatelessWidget {
  const _AdministrativeRecordsSection({required this.records});

  final List<AttendanceRecord> records;

  @override
  Widget build(BuildContext context) {
    if (records.isEmpty) {
      return const _EmptySection(
        'Nenhum registro administrativo para este paciente.',
        dataKey: Key('patient-detail-records-empty'),
      );
    }
    return Column(
      children: [
        for (var i = 0; i < records.length; i++)
          Card(
            key: Key('patient-detail-record-$i'),
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: ListTile(
              title: Text(attendanceStatusLabel(records[i].attendance)),
              subtitle: records[i].administrativeNotes == null
                  ? null
                  : Text(records[i].administrativeNotes!),
              trailing: records[i].recordedAt == null
                  ? null
                  : Text(formatDatePtBr(records[i].recordedAt!)),
            ),
          ),
      ],
    );
  }
}

class _FinancialSection extends StatelessWidget {
  const _FinancialSection({required this.charges});

  final List<Charge> charges;

  @override
  Widget build(BuildContext context) {
    if (charges.isEmpty) {
      return const _EmptySection(
        'Nenhuma mensalidade registrada para este paciente.',
        dataKey: Key('patient-detail-charges-empty'),
      );
    }
    return Column(
      children: [
        for (final charge in charges)
          Card(
            key: Key('patient-detail-charge-${charge.id}'),
            margin: const EdgeInsets.symmetric(vertical: 4),
            child: ListTile(
              title: Text('Competência ${charge.competence}'),
              subtitle: Text('Vencimento ${formatDatePtBr(charge.dueDate)}'),
              trailing: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(formatCentsBRL(charge.amount)),
                  const SizedBox(height: 4),
                  Text(chargeStatusLabel(charge.status)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
