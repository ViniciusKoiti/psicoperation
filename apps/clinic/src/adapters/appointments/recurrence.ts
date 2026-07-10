const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Critério de parada de uma série semanal simples (PSI-035): exatamente um
 * dos dois — `weeks` conta ocorrências (incluindo a primeira); `until` é uma
 * data-limite (`IsoDate`, inclusive). A união discriminada impede, em tempo
 * de compilação, informar os dois ao mesmo tempo. Recorrências complexas
 * (quinzenal, mensal, exceções por ocorrência) são fora de escopo — o
 * contrato de `WeeklyRecurrence` (`@psiops/contracts`) até tem `interval`,
 * mas esta tarefa só materializa séries semanais (`interval` 1 implícito).
 */
export type WeeklySeriesBounds = { weeks: number; until?: never } | { until: string; weeks?: never };

/**
 * Calcula as datas/horas (`IsoDateTime`) de cada ocorrência de uma série
 * semanal simples a partir da primeira ocorrência (`startsAt`): mesmo dia da
 * semana e horário, a cada 7 dias exatos (`WEEK_MS`, aritmética em
 * milissegundos — não em dia-do-mês local) até o critério de parada.
 *
 * Usar diferença fixa em milissegundos (em vez de `setDate`/fuso local)
 * evita o deslocamento de horário de verão citado no risco do manifesto:
 * como o Brasil não observa horário de verão desde 2019 e as datas do
 * domínio são armazenadas em `IsoDateTime` UTC, 7 dias corridos são sempre
 * 7 dias corridos, sem ambiguidade.
 *
 * `until` é comparado pelo fim do dia (23:59:59.999) em UTC para incluir a
 * ocorrência que cai exatamente na data-limite, independentemente do
 * horário da consulta.
 */
export function computeWeeklySeriesOccurrences(startsAt: string, bounds: WeeklySeriesBounds): string[] {
  const firstMs = Date.parse(startsAt);
  if (Number.isNaN(firstMs)) return [];

  if (bounds.weeks !== undefined) {
    const count = Math.max(1, Math.trunc(bounds.weeks));
    return Array.from({ length: count }, (_, index) => new Date(firstMs + index * WEEK_MS).toISOString());
  }

  if (bounds.until !== undefined) {
    const untilMs = Date.parse(`${bounds.until}T23:59:59.999Z`);
    const occurrences: string[] = [];
    for (let cursor = firstMs; cursor <= untilMs; cursor += WEEK_MS) {
      occurrences.push(new Date(cursor).toISOString());
    }
    return occurrences;
  }

  return [new Date(firstMs).toISOString()];
}
