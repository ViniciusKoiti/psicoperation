import { useState } from "react";

/**
 * Estado de salvamento de uma seção da tela de configurações (PSI-039).
 * Cada seção (perfil, valor de sessão, horários, lembretes) salva de forma
 * independente — este hook só rastreia o ciclo de vida local de UMA seção,
 * nunca compartilhado entre seções, para que uma seção com erro não afete o
 * feedback das demais (acceptance criteria: "cada seção salva de forma
 * independente, com notificação de sucesso/erro").
 */
export type SectionSaveState = "idle" | "saving" | "success" | "error";

/**
 * Envolve uma função de persistência (tipicamente um método do
 * `SettingsAdapter`, ex.: `saveOnboardingProfile`) com o estado de
 * salvamento da seção. Retorna `true`/`false` para que o chamador só
 * atualize estado local dependente de sucesso (ex.: "valor salvo
 * atualmente" na seção financeira) quando a persistência realmente
 * funcionou.
 */
export function useSectionSave<T>(save: (data: T) => Promise<void>) {
  const [saveState, setSaveState] = useState<SectionSaveState>("idle");

  async function handleSave(data: T): Promise<boolean> {
    setSaveState("saving");
    try {
      await save(data);
      setSaveState("success");
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  }

  return { saveState, handleSave };
}
