import { Alert, Button, Card, Checkbox, NumberInput, Stack, Text, Title } from "@mantine/core";
import type { ReminderChannel } from "@psiops/contracts";
import { type FormEvent, useState } from "react";

import type { OnboardingReminderPreferences } from "../../../adapters/settings";
import {
  hasErrors,
  type ReminderPreferencesFormErrors,
  validateReminderPreferencesStep,
} from "../../onboarding/validation";
import { useSectionSave } from "../useSectionSave";

export interface ReminderSectionProps {
  initialValue?: OnboardingReminderPreferences;
  onSave: (data: OnboardingReminderPreferences) => Promise<void>;
}

const DEFAULT_LEAD_TIME_HOURS = 24;

/**
 * Seção "Lembretes": canal padrão (só e-mail nesta fase — WhatsApp é
 * pós-MVP, PSI-038, exibido desabilitado como "em breve", mesmo tratamento
 * do passo de onboarding) e antecedência em horas.
 */
export function ReminderSection({ initialValue, onSave }: ReminderSectionProps) {
  const [emailEnabled, setEmailEnabled] = useState(initialValue ? initialValue.channels.includes("email") : true);
  const [leadTimeHours, setLeadTimeHours] = useState<number | string>(
    initialValue?.leadTimeHours ?? DEFAULT_LEAD_TIME_HOURS,
  );
  const [errors, setErrors] = useState<ReminderPreferencesFormErrors>({});
  const { saveState, handleSave } = useSectionSave(onSave);

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

    void handleSave(values);
  }

  return (
    <Card withBorder padding="md" radius="md" data-testid="settings-section-lembretes">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="sm">
          <div>
            <Title order={4}>Lembretes</Title>
            <Text c="dimmed" size="sm">
              Como e com quanto tempo de antecedência lembrar suas pacientes.
            </Text>
          </div>

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

          {saveState === "success" && (
            <Alert color="green" variant="light" data-testid="settings-lembretes-success">
              Preferências de lembrete atualizadas.
            </Alert>
          )}
          {saveState === "error" && (
            <Alert color="red" variant="light" data-testid="settings-lembretes-error">
              Não foi possível salvar as preferências agora. Tente novamente.
            </Alert>
          )}

          <Button type="submit" loading={saveState === "saving"} w="fit-content">
            Salvar
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
