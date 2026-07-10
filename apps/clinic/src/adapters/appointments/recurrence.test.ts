import { describe, expect, it } from "vitest";

import { computeWeeklySeriesOccurrences } from "./recurrence";

describe("computeWeeklySeriesOccurrences", () => {
  it("gera N ocorrências semanais a partir da primeira, com `weeks`", () => {
    const occurrences = computeWeeklySeriesOccurrences("2026-07-13T14:00:00Z", { weeks: 3 });

    expect(occurrences).toEqual(["2026-07-13T14:00:00.000Z", "2026-07-20T14:00:00.000Z", "2026-07-27T14:00:00.000Z"]);
  });

  it("gera ocorrências até a data-limite (inclusive) com `until`", () => {
    const occurrences = computeWeeklySeriesOccurrences("2026-07-13T14:00:00Z", { until: "2026-07-27" });

    expect(occurrences).toEqual(["2026-07-13T14:00:00.000Z", "2026-07-20T14:00:00.000Z", "2026-07-27T14:00:00.000Z"]);
  });

  it("`until` no mesmo dia da primeira ocorrência gera só uma ocorrência", () => {
    const occurrences = computeWeeklySeriesOccurrences("2026-07-13T14:00:00Z", { until: "2026-07-13" });

    expect(occurrences).toEqual(["2026-07-13T14:00:00.000Z"]);
  });

  it("`until` anterior à primeira ocorrência não gera nenhuma ocorrência", () => {
    const occurrences = computeWeeklySeriesOccurrences("2026-07-13T14:00:00Z", { until: "2026-07-01" });

    expect(occurrences).toEqual([]);
  });

  it("`weeks` menor que 1 é tratado como 1 (pelo menos a primeira ocorrência)", () => {
    const occurrences = computeWeeklySeriesOccurrences("2026-07-13T14:00:00Z", { weeks: 0 });

    expect(occurrences).toEqual(["2026-07-13T14:00:00.000Z"]);
  });

  it("mantém sempre o mesmo horário (só a data avança)", () => {
    const occurrences = computeWeeklySeriesOccurrences("2026-07-13T09:30:00Z", { weeks: 2 });

    expect(occurrences.every((iso) => iso.endsWith("T09:30:00.000Z"))).toBe(true);
  });
});
