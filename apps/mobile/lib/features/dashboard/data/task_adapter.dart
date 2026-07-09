import 'package:psiops_contracts/api.dart';

/// Porta de leitura das tarefas administrativas para o dashboard do dia.
///
/// [Task] (`packages/contracts/gen/dart`) é um registro administrativo
/// simples (título, `dueDate`, `completedAt`) — nenhuma tarefa contém dado
/// clínico (assumption do manifesto PSI-041). Criação/conclusão de tarefas
/// não fazem parte do critério de aceite desta tarefa (apenas exibição das
/// tarefas do dia); ficam para uma iteração futura se necessário.
abstract interface class TaskAdapter {
  /// Lista as tarefas da psicóloga autenticada.
  Future<List<Task>> listTasks();
}

/// Erro genérico ao carregar tarefas (rede, servidor, resposta inesperada).
class TaskAdapterException implements Exception {
  const TaskAdapterException(this.message);

  final String message;

  @override
  String toString() => 'TaskAdapterException: $message';
}

/// Adapter em memória usado no ambiente `AppEnvironment.dev` (e em testes).
///
/// Seed com uma tarefa de hoje concluída, uma de hoje pendente e uma futura
/// (fora do dia) — exercita o filtro "tarefas do dia" do dashboard.
final class InMemoryTaskAdapter implements TaskAdapter {
  InMemoryTaskAdapter({DateTime Function()? now, bool seedSampleData = true})
    : _now = now ?? DateTime.now {
    if (seedSampleData) _seedDefaults();
  }

  final DateTime Function() _now;
  final List<Task> _tasks = [];

  void _seedDefaults() {
    final today = _now();
    final todayDate = DateTime(today.year, today.month, today.day);

    _tasks.addAll([
      Task(
        id: 'task-mock-1',
        title: 'Confirmar consultas de amanhã por WhatsApp',
        dueDate: todayDate,
        createdAt: today,
      ),
      Task(
        id: 'task-mock-2',
        title: 'Enviar recibo de Beatriz Andrade',
        dueDate: todayDate,
        completedAt: today,
        createdAt: today,
      ),
      Task(
        id: 'task-mock-3',
        title: 'Revisar agenda da próxima semana',
        dueDate: todayDate.add(const Duration(days: 3)),
        createdAt: today,
      ),
    ]);
  }

  @override
  Future<List<Task>> listTasks() async {
    await Future<void>.delayed(const Duration(milliseconds: 10));
    return List.unmodifiable(_tasks);
  }
}
