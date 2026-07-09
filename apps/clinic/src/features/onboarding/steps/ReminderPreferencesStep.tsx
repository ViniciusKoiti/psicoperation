import { Checkbox, NumberInput, Stack, Text, Title } from "@mantine/core";
import type { ReminderChannel } from "@psiops/contracts";
import { type FormEvent, useState } from "react";

import type { OnboardingReminderPreferences } from "../../../adapters/settings";
import { hasErrors, type ReminderPreferencesFormErrors, validateReminderPreferencesStep } from "../validation";
import { StepActions } from "./StepActions";

export interface ReminderPreferencesStepProps {
  initialValue?: OnboardingReminderPreferences;
  onBack?: () => void;
  onSkip: () => void;
  onSubmit: (data: OnboardingReminderPreferences) => void | Promise<void>;
  submitting?: boolean;
}

const DEFAULT_LEAD_TIME_HOURS = 24;

/**
 * Passo 4: preferências de lembrete. No MVP, o único canal disponível é
 * `email` (`ReminderChannel` do contrato — WhatsApp é pós-MVP, PSI-038);
 * escolha desta tarefa para o open_question do manifesto ("apenas email ou
 * já exibir canais futuros desabilitados?"): exibimos WhatsApp desabilitado
 * com indicação "em breve", para deixar claro que o canal existe no roadmap
 * sem sugerir que já funciona.
 */
export function ReminderPreferencesStep({
  initialValue,
  onBack,
  onSkip,
  onSubmit,
  submitting,
}: ReminderPreferencesStepProps) {
  const [emailEnabled, setEmailEnabled] = useState(initialValue ? initialValue.channels.includes("email") : true);
  const [leadTimeHours, setLeadTimeHours] = useState<number | string>(
    initialValue?.leadTimeHours ?? DEFAULT_LEAD_TIME_HOURS,
  );
  const [errors, setErrors] = useState<ReminderPreferencesFormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const channels: ReminderChannel[] = emailEnabled ? ["email"] : [];
    const values: OnboardingReminderPreferences = {
      channels,
      leadTimeHours: typeof leadTimeHours === "number" ? leadTimeHours : Number.NaN,
    };
    const validation = validateReminderPreferencesStep(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    void onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="onboarding-step-lembretes">
      <Stack gap="sm">
        <Title order={3}>Preferências de lembrete</Title>
        <Text c="dimmed" size="sm">
          Como e com quanto tempo de antecedência lembrar suas pacientes.
        </Text>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Canais
          </Text>
          <Checkbox
            label="E-mail"
            checked={emailEnabled}
            onChange={(event) => setEmailEnabled(event.currentTarget.checked)}
          />
          <Checkbox label="WhatsApp (em breve)" checked={false} disabled readOnly />
          {errors.channels && (
            <Text size="xs" c="red">
              {errors.channels}
            </Text>
          )}
        </Stack>

        <NumberInput
          label="Antecedência padrão"
          description="Em horas antes da consulta ou do vencimento"
          suffix=" horas"
          value={leadTimeHours}
          onChange={setLeadTimeHours}
          error={errors.leadTimeHours}
          min={1}
          step={1}
          required
        />

        <StepActions onBack={onBack} onSkip={onSkip} submitting={submitting} submitLabel="Concluir" />
      </Stack>
    </form>
  );
}
