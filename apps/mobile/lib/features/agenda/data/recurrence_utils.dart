// Utilidades de recorrência semanal simples (PSI-041): mesmo dia/horário
// toda `interval` semanas, sem regras avançadas (quinzenal/mensal e
// exceções por ocorrência ficam fora de escopo — ver `out_of_scope` do
// manifesto).

import 'package:psiops_contracts/api.dart';

import '../../../app/formatting.dart';

/// Deriva o [WeeklyRecurrenceWeekdayEnum] correspondente ao dia da semana de
/// [startsAt] — o enum do contrato é sempre consistente com o horário da
/// primeira ocorrência.
WeeklyRecurrenceWeekdayEnum weekdayEnumFor(DateTime startsAt) {
  const byIsoWeekday = [
    WeeklyRecurrenceWeekdayEnum.segunda,
    WeeklyRecurrenceWeekdayEnum.terca,
    WeeklyRecurrenceWeekdayEnum.quarta,
    WeeklyRecurrenceWeekdayEnum.quinta,
    WeeklyRecurrenceWeekdayEnum.sexta,
    WeeklyRecurrenceWeekdayEnum.sabado,
    WeeklyRecurrenceWeekdayEnum.domingo,
  ];
  return byIsoWeekday[startsAt.weekday - 1];
}

/// Número máximo de ocorrências materializadas para uma recorrência sem
/// `until` explícito — horizonte finito de exibição (assumption do
/// manifesto PSI-041: a recorrência semanal pode ser materializada pelo
/// adapter mock como ocorrências individuais dentro de um horizonte finito).
const int defaultMaxRecurrenceOccurrences = 52;

/// Horizonte de tempo padrão (a partir da primeira ocorrência) quando a
/// recorrência não define `until`.
const Duration defaultRecurrenceHorizon = Duration(days: 365);

/// Materializa as datas/horários de todas as ocorrências de uma consulta
/// recorrente, a partir de [startsAt] (primeira ocorrência), respeitando
/// `recurrence.interval` (semanas entre ocorrências) e `recurrence.until`
/// (inclusive, comparado por dia civil). Se [recurrence] for `null`, retorna
/// apenas a ocorrência avulsa `[startsAt]`.
List<DateTime> materializeOccurrences(
  DateTime startsAt,
  WeeklyRecurrence? recurrence, {
  Duration horizon = defaultRecurrenceHorizon,
  int maxOccurrences = defaultMaxRecurrenceOccurrences,
}) {
  if (recurrence == null) return [startsAt];

  final untilDate = recurrence.until != null ? dateOnly(recurrence.until!) : null;
  final horizonLimit = startsAt.add(horizon);
  final step = Duration(days: 7 * recurrence.interval);

  final occurrences = <DateTime>[];
  var current = startsAt;
  while (occurrences.length < maxOccurrences) {
    final withinUntil = untilDate == null || !dateOnly(current).isAfter(untilDate);
    final withinHorizon = !current.isAfter(horizonLimit);
    if (!withinUntil || !withinHorizon) break;
    occurrences.add(current);
    current = current.add(step);
  }
  return occurrences;
}
