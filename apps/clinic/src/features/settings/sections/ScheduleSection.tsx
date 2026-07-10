import { ActionIcon, Alert, Button, Card, Checkbox, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";

import type { OnboardingSchedule, OnboardingTimeWindow } from "../../../adapters/settings";
// Reutiliza a validação e as opções de dia da semana do onboarding
// (PSI-031) — mesmas regras de "ao menos um dia" e "janela com início
// anterior ao término".
import { hasErrors, type ScheduleFormErrors, validateScheduleStep, WEEKDAY_OPTIONS } from "../../onboarding/validation";
import { useSectionSave } from "../useSectionSave";

export interface ScheduleSectionProps {
  initialValue?: OnboardingSchedule;
  onSave: (data: OnboardingSchedule) => Promise<void>;
}

const EMPTY_WINDOW: OnboardingTimeWindow = { start: "", end: "" };

/** Seção "Atendimento": dias da semana e janelas de horário. */
export function ScheduleSection({ initialValue, onSave }: ScheduleSectionProps) {
  const [days, setDays] = useState<string[]>(initialValue?.days ?? []);
  const [timeWindows, setTimeWindows] = useState<OnboardingTimeWindow[]>(
    initialValue?.timeWindows && initialValue.timeWindows.length > 0 ? initialValue.timeWindows : [{ ...EMPTY_WINDOW }],
  );
  const [errors, setErrors] = useState<ScheduleFormErrors>({});
  const { saveState, handleSave } = useSectionSave(onSave);

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

    void handleSave(values);
  }

  return (
    <Card withBorder padding="md" radius="md" data-testid="settings-section-horarios">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="sm">
          <div>
            <Title order={4}>Dias e horários de atendimento</Title>
            <Text c="dimmed" size="sm">
              Usado para sugerir horários ao agendar consultas.
            </Text>
          </div>

          <Checkbox.Group label="Dias de atendimento" value={days} onChange={setDays} error={errors.days}>
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

          {saveState === "success" && (
            <Alert color="green" variant="light" data-testid="settings-horarios-success">
              Dias e horários atualizados.
            </Alert>
          )}
          {saveState === "error" && (
            <Alert color="red" variant="light" data-testid="settings-horarios-error">
              Não foi possível salvar os horários agora. Tente novamente.
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
