import { ActionIcon, Button, Checkbox, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";

import type { OnboardingSchedule, OnboardingTimeWindow } from "../../../adapters/settings";
import { hasErrors, type ScheduleFormErrors, validateScheduleStep, WEEKDAY_OPTIONS } from "../validation";
import { StepActions } from "./StepActions";

export interface ScheduleStepProps {
  initialValue?: OnboardingSchedule;
  onBack?: () => void;
  onSkip: () => void;
  onSubmit: (data: OnboardingSchedule) => void | Promise<void>;
  submitting?: boolean;
}

const EMPTY_WINDOW: OnboardingTimeWindow = { start: "", end: "" };

/** Passo 3: dias da semana + janelas de horário de atendimento. */
export function ScheduleStep({ initialValue, onBack, onSkip, onSubmit, submitting }: ScheduleStepProps) {
  const [days, setDays] = useState<string[]>(initialValue?.days ?? []);
  const [timeWindows, setTimeWindows] = useState<OnboardingTimeWindow[]>(
    initialValue?.timeWindows && initialValue.timeWindows.length > 0 ? initialValue.timeWindows : [{ ...EMPTY_WINDOW }],
  );
  const [errors, setErrors] = useState<ScheduleFormErrors>({});

  function updateWindow(index: number, patch: Partial<OnboardingTimeWindow>) {
    setTimeWindows((prev) => prev.map((window, i) => (i === index ? { ...window, ...patch } : window)));
  }

  function addWindow() {
    setTimeWindows((prev) => [...prev, { ...EMPTY_WINDOW }]);
  }

  function removeWindow(index: number) {
    setTimeWindows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: OnboardingSchedule = {
      days: days as OnboardingSchedule["days"],
      timeWindows,
    };
    const validation = validateScheduleStep(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    void onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="onboarding-step-horarios">
      <Stack gap="sm">
        <Title order={3}>Dias e horários de atendimento</Title>
        <Text c="dimmed" size="sm">
          Usado para sugerir horários ao agendar consultas.
        </Text>

        <Checkbox.Group
          label="Dias de atendimento"
          value={days}
          onChange={setDays}
          error={errors.days}
        >
          <Group gap="sm" mt="xs">
            {WEEKDAY_OPTIONS.map((option) => (
              <Checkbox key={option.value} value={option.value} label={option.label} />
            ))}
          </Group>
        </Checkbox.Group>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Janelas de horário
          </Text>
          {errors.timeWindows && (
            <Text size="xs" c="red">
              {errors.timeWindows}
            </Text>
          )}
          {timeWindows.map((window, index) => (
            <Group key={index} gap="xs" wrap="nowrap">
              <TextInput
                type="time"
                aria-label={`Início da janela ${index + 1}`}
                value={window.start}
                onChange={(event) => updateWindow(index, { start: event.currentTarget.value })}
              />
              <Text size="sm">até</Text>
              <TextInput
                type="time"
                aria-label={`Término da janela ${index + 1}`}
                value={window.end}
                onChange={(event) => updateWindow(index, { end: event.currentTarget.value })}
              />
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={`Remover janela ${index + 1}`}
                onClick={() => removeWindow(index)}
                disabled={timeWindows.length === 1}
              >
                ×
              </ActionIcon>
            </Group>
          ))}
          <Button type="button" variant="light" size="xs" onClick={addWindow} w="fit-content">
            Adicionar janela
          </Button>
        </Stack>

        <StepActions onBack={onBack} onSkip={onSkip} submitting={submitting} />
      </Stack>
    </form>
  );
}
