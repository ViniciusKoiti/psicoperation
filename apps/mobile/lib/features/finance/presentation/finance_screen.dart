import 'package:flutter/material.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../dashboard/data/charge_adapter.dart';
import '../../patients/data/patients_adapter.dart';
import '../state/finance_controller.dart';

/// Tela financeira (PSI-043): mensalidades do mês em foco agrupadas por
/// status (em dia/pendente/atrasada), com totais por status e total geral
/// em centavos BRL formatados em pt-BR, navegação entre meses, ação de
/// marcar mensalidade como paga (com confirmação) e ação de gerar as
/// mensalidades do mês para os pacientes ativos (idempotente).
///
/// Cria e gerencia seu próprio [FinanceController] a partir dos adapters
/// injetados — mesmo padrão de camadas de `DashboardScreen`/
/// `PatientDetailScreen` (PSI-041/042).
class FinanceScreen extends StatefulWidget {
  const FinanceScreen({
    super.key,
    required this.chargeAdapter,
    required this.patientsAdapter,
    this.now,
  });

  final ChargeAdapter chargeAdapter;
  final PatientsAdapter patientsAdapter;

  /// Relógio injetável — usado apenas em testes (mesmo padrão de
  /// `DashboardScreen`/`AgendaScreen`).
  final DateTime Function()? now;

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  late final FinanceController _controller = FinanceController(
    widget.chargeAdapter,
    widget.patientsAdapter,
    now: widget.now,
  );

  bool _generating = false;

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

  Future<void> _generateMonth() async {
    setState(() => _generating = true);
    final result = await _controller.generateMonth();
    if (!mounted) return;
    setState(() => _generating = false);

    final messenger = ScaffoldMessenger.of(context);
    // Limpa qualquer aviso anterior antes de mostrar o novo — sem isso, o
    // `ScaffoldMessenger` enfileira o próximo SnackBar até o atual terminar
    // sozinho (padrão do widget), o que deixaria o feedback de uma ação
    // rápida em sequência (ex.: gerar o mês duas vezes seguidas) atrasado.
    messenger.hideCurrentSnackBar();

    if (_controller.actionErrorMessage != null) {
      messenger.showSnackBar(SnackBar(content: Text(_controller.actionErrorMessage!)));
      return;
    }

    final message = result.created == 0
        ? (result.skipped == 0
              ? 'Nenhum paciente ativo para gerar mensalidades.'
              : 'Nenhuma mensalidade nova: as ${result.skipped} já haviam sido geradas.')
        : '${result.created} mensalidade(s) gerada(s)'
              '${result.skipped > 0 ? ' — ${result.skipped} já existente(s), não duplicada(s).' : '.'}';
    messenger.showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _confirmMarkAsPaid(Charge charge) async {
    final method = await showDialog<PaymentMethod>(
      context: context,
      builder: (context) => _MarkAsPaidDialog(
        charge: charge,
        patientName: _controller.patientName(charge.patientId),
      ),
    );
    if (method == null) return;

    final success = await _controller.markAsPaid(charge, method: method);
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    if (success) {
      messenger.showSnackBar(const SnackBar(content: Text('Mensalidade marcada como paga.')));
      return;
    }
    messenger.showSnackBar(
      SnackBar(
        content: Text(
          _controller.actionErrorMessage ?? 'Não foi possível marcar a mensalidade como paga.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Financeiro')),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return switch (_controller.status) {
            FinanceStatus.loading => const Center(
              key: Key('finance-loading'),
              child: CircularProgressIndicator(),
            ),
            FinanceStatus.error => Center(
              child: Text(
                _controller.errorMessage ?? 'Não foi possível carregar o financeiro.',
                key: const Key('finance-error'),
                style: textTheme.bodyLarge?.copyWith(color: colors.error),
              ),
            ),
            FinanceStatus.ready => Column(
              children: [
                _MonthNavigator(controller: _controller),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: FilledButton.icon(
                    key: const Key('finance-generate-button'),
                    onPressed: _generating ? null : _generateMonth,
                    icon: _generating
                        ? const SizedBox(
                            height: 16,
                            width: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.receipt_long_outlined),
                    label: const Text('Gerar mensalidades do mês'),
                  ),
                ),
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _controller.load,
                    child: _controller.isEmpty
                        ? ListView(
                            padding: const EdgeInsets.all(16),
                            children: const [
                              _EmptyStateText(
                                'Nenhuma mensalidade gerada para este mês ainda.',
                                dataKey: Key('finance-empty'),
                              ),
                            ],
                          )
                        : ListView(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            children: [
                              _TotalRow(
                                label: 'Total geral',
                                cents: _controller.totalGeralCents,
                                emphasize: true,
                                dataKey: const Key('finance-total-geral'),
                              ),
                              const Divider(height: 24),
                              _StatusSection(
                                title: 'Atrasada',
                                emptyMessage: 'Nenhuma mensalidade atrasada.',
                                charges: _controller.atrasadaCharges,
                                totalCents: _controller.totalAtrasadaCents,
                                totalKey: const Key('finance-total-atrasada'),
                                emptyKey: const Key('finance-atrasada-empty'),
                                controller: _controller,
                                accentColor: colors.error,
                                allowMarkAsPaid: true,
                                onMarkAsPaid: _confirmMarkAsPaid,
                              ),
                              const SizedBox(height: 24),
                              _StatusSection(
                                title: 'Pendente',
                                emptyMessage: 'Nenhuma mensalidade pendente.',
                                charges: _controller.pendenteCharges,
                                totalCents: _controller.totalPendenteCents,
                                totalKey: const Key('finance-total-pendente'),
                                emptyKey: const Key('finance-pendente-empty'),
                                controller: _controller,
                                accentColor: colors.tertiary,
                                allowMarkAsPaid: true,
                                onMarkAsPaid: _confirmMarkAsPaid,
                              ),
                              const SizedBox(height: 24),
                              _StatusSection(
                                title: 'Em dia',
                                emptyMessage: 'Nenhuma mensalidade em dia.',
                                charges: _controller.emDiaCharges,
                                totalCents: _controller.totalEmDiaCents,
                                totalKey: const Key('finance-total-em-dia'),
                                emptyKey: const Key('finance-em-dia-empty'),
                                controller: _controller,
                                accentColor: colors.primary,
                                allowMarkAsPaid: false,
                                onMarkAsPaid: _confirmMarkAsPaid,
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          };
        },
      ),
    );
  }
}

class _MonthNavigator extends StatelessWidget {
  const _MonthNavigator({required this.controller});

  final FinanceController controller;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            key: const Key('finance-prev-month-button'),
            tooltip: 'Mês anterior',
            icon: const Icon(Icons.chevron_left),
            onPressed: controller.goToPreviousMonth,
          ),
          Text(
            monthLabelPtBr(controller.focusedMonth),
            key: const Key('finance-month-label'),
            style: textTheme.titleMedium,
          ),
          IconButton(
            key: const Key('finance-next-month-button'),
            tooltip: 'Próximo mês',
            icon: const Icon(Icons.chevron_right),
            onPressed: controller.goToNextMonth,
          ),
        ],
      ),
    );
  }
}

class _TotalRow extends StatelessWidget {
  const _TotalRow({
    required this.label,
    required this.cents,
    required this.dataKey,
    this.emphasize = false,
  });

  final String label;
  final int cents;
  final Key dataKey;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final style = emphasize ? textTheme.headlineSmall : textTheme.titleMedium;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(child: Text(label, style: style)),
        Text(formatCentsBRL(cents), key: dataKey, style: style),
      ],
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

class _StatusSection extends StatelessWidget {
  const _StatusSection({
    required this.title,
    required this.emptyMessage,
    required this.charges,
    required this.totalCents,
    required this.totalKey,
    required this.emptyKey,
    required this.controller,
    required this.accentColor,
    required this.allowMarkAsPaid,
    required this.onMarkAsPaid,
  });

  final String title;
  final String emptyMessage;
  final List<Charge> charges;
  final int totalCents;
  final Key totalKey;
  final Key emptyKey;
  final FinanceController controller;
  final Color accentColor;
  final bool allowMarkAsPaid;
  final void Function(Charge charge) onMarkAsPaid;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: textTheme.titleMedium?.copyWith(
                color: accentColor,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              formatCentsBRL(totalCents),
              key: totalKey,
              style: textTheme.titleMedium?.copyWith(color: accentColor),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (charges.isEmpty)
          _EmptyStateText(emptyMessage, dataKey: emptyKey)
        else
          Column(
            children: [
              for (final charge in charges)
                _ChargeTile(
                  key: Key('finance-charge-${charge.id}'),
                  charge: charge,
                  patientName: controller.patientName(charge.patientId),
                  allowMarkAsPaid: allowMarkAsPaid,
                  onMarkAsPaid: () => onMarkAsPaid(charge),
                ),
            ],
          ),
      ],
    );
  }
}

class _ChargeTile extends StatelessWidget {
  const _ChargeTile({
    super.key,
    required this.charge,
    required this.patientName,
    required this.allowMarkAsPaid,
    required this.onMarkAsPaid,
  });

  final Charge charge;
  final String patientName;
  final bool allowMarkAsPaid;
  final VoidCallback onMarkAsPaid;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        title: Text(patientName),
        subtitle: Text('Vencimento ${formatDatePtBr(charge.dueDate)}'),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(formatCentsBRL(charge.amount)),
            if (allowMarkAsPaid)
              IconButton(
                key: Key('finance-mark-paid-${charge.id}'),
                tooltip: 'Marcar como paga',
                icon: const Icon(Icons.check_circle_outline),
                onPressed: onMarkAsPaid,
              ),
          ],
        ),
      ),
    );
  }
}

class _MarkAsPaidDialog extends StatefulWidget {
  const _MarkAsPaidDialog({required this.charge, required this.patientName});

  final Charge charge;
  final String patientName;

  @override
  State<_MarkAsPaidDialog> createState() => _MarkAsPaidDialogState();
}

class _MarkAsPaidDialogState extends State<_MarkAsPaidDialog> {
  PaymentMethod _method = PaymentMethod.pix;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Marcar mensalidade como paga?'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${widget.patientName} — ${formatCentsBRL(widget.charge.amount)}\n'
            'Vencimento ${formatDatePtBr(widget.charge.dueDate)}',
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<PaymentMethod>(
            key: const Key('finance-mark-paid-method-field'),
            value: _method,
            decoration: const InputDecoration(labelText: 'Meio de pagamento'),
            items: [
              for (final method in PaymentMethod.values)
                DropdownMenuItem(value: method, child: Text(paymentMethodLabel(method))),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _method = value);
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          key: const Key('finance-mark-paid-dismiss-button'),
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Voltar'),
        ),
        FilledButton(
          key: const Key('finance-mark-paid-confirm-button'),
          onPressed: () => Navigator.of(context).pop(_method),
          child: const Text('Confirmar pagamento'),
        ),
      ],
    );
  }
}
