/**
 * Preset Tailwind derivado dos tokens: cores, sombras e fontes do preset
 * devem apontar para os mesmos valores da fonte única.
 */
import { psiopsPreset } from "../src/tailwind/index.js";
import {
  accent,
  calm,
  neutral,
  primary,
  semantic,
  shadows,
  typography,
} from "../src/tokens/index.js";

const toStringKeys = (scale: Record<string | number, string>) =>
  Object.fromEntries(Object.entries(scale).map(([k, v]) => [String(k), v]));

describe("psiopsPreset (Tailwind)", () => {
  const { colors, boxShadow, fontFamily } = psiopsPreset.theme.extend;

  it("expõe as paletas completas sob o prefixo psi-", () => {
    expect(colors["psi-primary"]).toEqual(toStringKeys(primary));
    expect(colors["psi-accent"]).toEqual(toStringKeys(accent));
    expect(colors["psi-neutral"]).toEqual(toStringKeys(neutral));
    expect(colors["psi-success"]).toEqual(toStringKeys(semantic.success));
    expect(colors["psi-warning"]).toEqual(toStringKeys(semantic.warning));
    expect(colors["psi-error"]).toEqual(toStringKeys(semantic.error));
    expect(colors["psi-info"]).toEqual(toStringKeys(semantic.info));
    expect(colors["psi-calm"]).toEqual(toStringKeys(calm));
  });

  it("inclui neutral-0 e neutral-950 (escala de 12 tons)", () => {
    expect(colors["psi-neutral"]?.["0"]).toBe("#FFFFFF");
    expect(colors["psi-neutral"]?.["950"]).toBe("#181614");
  });

  it("deriva shadow-soft/lift/card dos tokens", () => {
    expect(boxShadow).toEqual({
      soft: shadows.soft.css,
      lift: shadows.lift.css,
      card: shadows.card.css,
    });
  });

  it("deriva font-display/body/serif das pilhas dos tokens", () => {
    expect(fontFamily.display).toEqual(typography.display.stack);
    expect(fontFamily.body).toEqual(typography.body.stack);
    expect(fontFamily.serif).toEqual(typography.serif.stack);
  });

  it("é um objeto serializável (consumível por tailwind.config sem runtime)", () => {
    expect(() => JSON.stringify(psiopsPreset)).not.toThrow();
  });
});
