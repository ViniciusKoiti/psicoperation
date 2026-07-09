import { Button, Group } from "@mantine/core";

export interface StepActionsProps {
  onBack?: () => void;
  onSkip: () => void;
  submitting?: boolean;
  /** Rótulo do botão de avançar/concluir (padrão: "Avançar"). */
  submitLabel?: string;
}

/**
 * Rodapé comum aos quatro passos do wizard de onboarding: "Voltar" (oculto
 * no primeiro passo), "Pular este passo" e o botão de avançar/concluir
 * (submit do formulário do passo, então fica fora de um `<button type="button">`
 * só para o submit — os demais são `type="button"`).
 */
export function StepActions({ onBack, onSkip, submitting, submitLabel = "Avançar" }: StepActionsProps) {
  return (
    <Group justify="space-between" mt="lg">
      <Group gap="sm">
        {onBack && (
          <Button type="button" variant="default" onClick={onBack} disabled={submitting}>
            Voltar
          </Button>
        )}
        <Button type="button" variant="subtle" color="gray" onClick={onSkip} disabled={submitting}>
          Pular este passo
        </Button>
      </Group>
      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </Group>
  );
}
