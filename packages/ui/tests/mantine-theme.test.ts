/**
 * Tema Mantine derivado dos tokens: as cores/sombras/fontes do tema devem
 * apontar para os mesmos valores da fonte única.
 */
import { PSIOPS_PRIMARY_SHADE, psiopsTheme } from "../src/mantine/index.js";
import {
  accent,
  fontStackToCss,
  neutral,
  primary,
  shadows,
  tokens,
  typography,
} from "../src/tokens/index.js";

const SHADE_ORDER = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

describe("psiopsTheme (Mantine)", () => {
  it("mapeia as paletas primary/accent/neutral para tuplas 50→900", () => {
    expect(psiopsTheme.colors?.primary).toEqual(SHADE_ORDER.map((s) => primary[s]));
    expect(psiopsTheme.colors?.accent).toEqual(SHADE_ORDER.map((s) => accent[s]));
    expect(psiopsTheme.colors?.neutral).toEqual(SHADE_ORDER.map((s) => neutral[s]));
  });

  it("usa primary como cor principal, com shade 600 (índice 6)", () => {
    expect(psiopsTheme.primaryColor).toBe("primary");
    expect(psiopsTheme.primaryShade).toBe(PSIOPS_PRIMARY_SHADE);
    expect(psiopsTheme.colors?.primary?.[PSIOPS_PRIMARY_SHADE]).toBe("#6E5E9E");
  });

  it("expõe neutral-0/neutral-950 como white/black", () => {
    expect(psiopsTheme.white).toBe(neutral[0]);
    expect(psiopsTheme.black).toBe(neutral[950]);
  });

  it("deriva tipografia dos tokens (Inter no corpo, DM Sans nos headings)", () => {
    expect(psiopsTheme.fontFamily).toBe(fontStackToCss(typography.body.stack));
    expect(psiopsTheme.headings?.fontFamily).toBe(fontStackToCss(typography.display.stack));
    expect(psiopsTheme.headings?.fontWeight).toBe("600");
  });

  it("mapeia as sombras nomeadas da spec (card/soft/lift → sm/md/lg)", () => {
    expect(psiopsTheme.shadows?.sm).toBe(shadows.card.css);
    expect(psiopsTheme.shadows?.md).toBe(shadows.soft.css);
    expect(psiopsTheme.shadows?.lg).toBe(shadows.lift.css);
  });

  it("expõe os tokens integrais em theme.other.psiops (semânticas/calm)", () => {
    expect(psiopsTheme.other?.psiops).toBe(tokens);
    expect(psiopsTheme.other?.psiops.colors.success.dark).toBe("#3D6B4E");
    expect(psiopsTheme.other?.psiops.colors.calm.deep).toBe("#436E68");
  });
});
