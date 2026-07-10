import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';
import '../../../app/router.dart';
import '../data/patients_adapter.dart';
import '../state/patients_list_controller.dart';

/// Lista de pacientes (PSI-042): pacientes ativos por padrão, com busca
/// reativa por nome e alternância para o filtro de arquivados. Toque num
/// item abre o detalhe; o botão flutuante abre o cadastro.
///
/// Navega diretamente via `go_router` (mesmo padrão de `LoginScreen`/
/// `RegisterScreen`, PSI-040) em vez de receber callbacks do router, porque
/// a navegação lista → detalhe → edição/cadastro é inteiramente interna à
/// feature de pacientes.
class PatientsListScreen extends StatefulWidget {
  const PatientsListScreen({super.key, required this.adapter});

  final PatientsAdapter adapter;

  @override
  State<PatientsListScreen> createState() => _PatientsListScreenState();
}

class _PatientsListScreenState extends State<PatientsListScreen> {
  late final PatientsListController _controller = PatientsListController(widget.adapter);
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _controller.load();
  }

  @override
  void dispose() {
    _controller.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openCreate() async {
    await context.pushNamed(Routes.patientCreate);
    if (!mounted) return;
    await _controller.load();
  }

  Future<void> _openDetail(Patient patient) async {
    await context.pushNamed(
      Routes.patientDetail,
      pathParameters: {'patientId': patient.id},
    );
    if (!mounted) return;
    await _controller.load();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Pacientes')),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: TextField(
                  key: const Key('patients-search-field'),
                  controller: _searchController,
                  onChanged: _controller.setQuery,
                  decoration: InputDecoration(
                    hintText: 'Buscar paciente pelo nome',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isEmpty
                        ? null
                        : IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              _controller.setQuery('');
                            },
                          ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: SegmentedButton<bool>(
                  key: const Key('patients-status-filter'),
                  segments: const [
                    ButtonSegment(value: false, label: Text('Ativos')),
                    ButtonSegment(value: true, label: Text('Arquivados')),
                  ],
                  selected: {_controller.showArchived},
                  onSelectionChanged: (selection) {
                    if (selection.first) {
                      _controller.showArchivedPatients();
                    } else {
                      _controller.showActivePatients();
                    }
                  },
                ),
              ),
              Expanded(
                child: switch (_controller.status) {
                  PatientsListStatus.loading => const Center(
                    key: Key('patients-loading'),
                    child: CircularProgressIndicator(),
                  ),
                  PatientsListStatus.error => Center(
                    child: Text(
                      _controller.errorMessage ?? 'Não foi possível carregar os pacientes.',
                      key: const Key('patients-error'),
                      style: TextStyle(color: colors.error),
                    ),
                  ),
                  PatientsListStatus.ready => _buildList(context),
                },
              ),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('patients-add-button'),
        onPressed: _openCreate,
        icon: const Icon(Icons.person_add_alt),
        label: const Text('Novo paciente'),
      ),
    );
  }

  Widget _buildList(BuildContext context) {
    final patients = _controller.patients;
    if (patients.isEmpty) {
      final message = _controller.showArchived
          ? 'Nenhum paciente arquivado encontrado.'
          : (_controller.query.trim().isEmpty
                ? 'Nenhum paciente cadastrado ainda.'
                : 'Nenhum paciente encontrado para essa busca.');
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            message,
            key: const Key('patients-empty'),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }
    return ListView.builder(
      key: const Key('patients-list'),
      padding: const EdgeInsets.all(16),
      itemCount: patients.length,
      itemBuilder: (context, index) {
        final patient = patients[index];
        return Card(
          key: Key('patients-item-${patient.id}'),
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            title: Text(patient.name),
            subtitle: Text(
              '${formatCentsBRL(patient.monthlyFee)} • vencimento dia ${patient.billingDay}',
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _openDetail(patient),
          ),
        );
      },
    );
  }
}
