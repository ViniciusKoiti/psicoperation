import { Alert, Button, Group, Modal, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import type { Appointment } from "@psiops/contracts";
import { type FormEvent, useEffect, useState } from "react";

import { buildIsoDateTime, toLocalDateInputValue, toLocalTimeInputValue } from "./agenda";

export interface RescheduleAppointmentValues {
  startsAt: string;
  durationMinutes: number;
}

export interface RescheduleAppointmentModalProps {
  opened: boolean;
  appointment: Appointment | null;
  patientName?: string;
  onSubmit: (values: RescheduleAppointmentValues) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  /** Erro do submit (conflito de horário ou falha do adapter). */
  formError?: string | null;
}

interface FieldErrors {
  date?: string;
  time?: string;
  durationMinutes?: string;
}

/**
 * Modal de remarcação (PSI-035): só data/hora/duração — o paciente e o
 * identificador da consulta não mudam ("preservar o vínculo", critério de
 * aceite do manifesto). A validação de sobreposição acontece em
 * `AgendaPage` (precisa buscar as consultas do novo dia-alvo), repassada
 * via `formError` — mesmo padrão de `NewAppointmentModal`.
 */
export function RescheduleAppointmentModal({
  opened,
  appointment,
  patientName,
  onSubmit,
  onClose,
  submitting,
  formError,
}: RescheduleAppointmentModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>(50);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!opened || !appointment) return;
    setDate(toLocalDateInputValue(appointment.startsAt));
    setTime(toLocalTimeInputValue(appointment.startsAt));
    setDurationMinutes(appointment.durationMinutes);
    setErrors({});
  }, [opened, appointment]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!date) next.date = "Informe a data.";
    if (!time) next.time = "Informe o horário.";
    if (!durationMinutes || Number(durationMinutes) <= 0) next.durationMinutes = "Informe uma duração válida.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    void onSubmit({ startsAt: buildIsoDateTime(date, time), durationMinutes: Number(durationMinutes) });
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Remarcar consulta"
      centered
      transitionProps={{ duration: 0 }}
      data-testid="reschedule-appointment-modal"
    >
      <form onSubmit={handleSubmit} noValidate data-testid="reschedule-appointment-form">
        <Stack gap="sm">
          {patientName && (
            <Text size="sm" c="dimmed">
              Paciente: <strong>{patientName}</strong>
            </Text>
          )}

          {formError && (
            <Alert color="red" variant="light" data-testid="reschedule-appointment-error">
              {formError}
            </Alert>
          )}

          <Group grow>
            <TextInput
              label="Nova data"
              type="date"
              value={date}
              error={errors.date}
              onChange={(event) => setDate(event.currentTarget.value)}
              required
            />
            <TextInput
              label="Novo horário"
              type="time"
              value={time}
              error={errors.time}
              onChange={(event) => setTime(event.currentTarget.value)}
              required
            />
          </Group>

          <NumberInput
            label="Duração (minutos)"
            value={durationMinutes}
            error={errors.durationMinutes}
            onChange={setDurationMinutes}
            min={5}
            step={5}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Remarcar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
