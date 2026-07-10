import { Alert, Badge, Button, Checkbox, Group, Modal, NativeSelect, NumberInput, Stack, Text, TextInput } from "@mantine/core";
import type { AppointmentCreateRequest } from "@psiops/contracts";
import { type FormEvent, useEffect, useState } from "react";

import type { AppointmentSeriesOccurrenceResult } from "../../adapters/appointments";
import { buildIsoDateTime, DEFAULT_APPOINTMENT_DURATION_MINUTES } from "./agenda";

export interface PatientOption {
  value: string;
  label: string;
}

/** Payload de criação avulsa (sem recorrência). */
export interface NewAppointmentSingleSubmit {
  kind: "single";
  payload: AppointmentCreateRequest;
}

/** Payload de criação de série semanal simples. */
export interface NewAppointmentSeriesSubmit {
  kind: "series";
  patientId: string;
  startsAt: string;
  durationMinutes: number;
  weeks?: number;
  until?: string;
}

export type NewAppointmentSubmit = NewAppointmentSingleSubmit | NewAppointmentSeriesSubmit;

export interface NewAppointmentModalProps {
  opened: boolean;
  /** Data (`AAAA-MM-DD`) já escolhida pelo contexto (dia clicado na agenda) — pré-preenche o campo, mas continua editável. */
  initialDate: string;
  patients: readonly PatientOption[];
  onSubmit: (values: NewAppointmentSubmit) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  /** Erro do submit (conflito de horário ou falha do adapter) — distinto da validação de campo. */
  formError?: string | null;
  /** Resultado de uma criação em série já concluída (com conflitos parciais reportados por ocorrência), exibido antes de fechar. */
  seriesResult?: { occurrences: AppointmentSeriesOccurrenceResult[] } | null;
  onCloseSeriesResult?: () => void;
}

interface FieldErrors {
  patientId?: string;
  date?: string;
  time?: string;
  durationMinutes?: string;
  weeks?: string;
  until?: string;
}

/**
 * Modal de criação de consulta (PSI-035): paciente + data/hora + duração,
 * com uma seção opcional de recorrência semanal simples (N semanas OU
 * data-limite — mutuamente exclusivos, ver `computeWeeklySeriesOccurrences`).
 *
 * NÃO faz a validação de sobreposição aqui: quem decide se o horário
 * conflita é `AgendaPage` (precisa buscar as consultas do dia-alvo no
 * adapter antes de decidir — ver `findConflictingAppointment`), que repassa
 * o resultado via `formError`. Este componente só cuida de validação de
 * campo (obrigatoriedade, formato) e da UI, mesmo espírito de `PatientForm`
 * (PSI-033).
 */
export function NewAppointmentModal({
  opened,
  initialDate,
  patients,
  onSubmit,
  onClose,
  submitting,
  formError,
  seriesResult,
  onCloseSeriesResult,
}: NewAppointmentModalProps) {
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number | string>(DEFAULT_APPOINTMENT_DURATION_MINUTES);
  const [recurring, setRecurring] = useState(false);
  const [stopCriterion, setStopCriterion] = useState<"weeks" | "until">("weeks");
  const [weeks, setWeeks] = useState<number | string>(4);
  const [until, setUntil] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  // Reabre "limpo" a cada vez que o modal é aberto, com a data do contexto.
  useEffect(() => {
    if (!opened) return;
    setPatientId("");
    setDate(initialDate);
    setTime("");
    setDurationMinutes(DEFAULT_APPOINTMENT_DURATION_MINUTES);
    setRecurring(false);
    setStopCriterion("weeks");
    setWeeks(4);
    setUntil("");
    setErrors({});
  }, [opened, initialDate]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!patientId) next.patientId = "Selecione a paciente.";
    if (!date) next.date = "Informe a data.";
    if (!time) next.time = "Informe o horário.";
    if (!durationMinutes || Number(durationMinutes) <= 0) next.durationMinutes = "Informe uma duração válida.";
    if (recurring) {
      if (stopCriterion === "weeks" && (!weeks || Number(weeks) < 1)) {
        next.weeks = "Informe ao menos 1 semana.";
      }
      if (stopCriterion === "until" && !until) {
        next.until = "Informe a data-limite.";
      }
      if (stopCriterion === "until" && until && date && until < date) {
        next.until = "A data-limite não pode ser antes da primeira ocorrência.";
      }
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;
    if (!patientId) return;

    const startsAt = buildIsoDateTime(date, time);
    const duration = Number(durationMinutes);

    if (!recurring) {
      void onSubmit({ kind: "single", payload: { patientId, startsAt, durationMinutes: duration } });
      return;
    }

    if (stopCriterion === "weeks") {
      void onSubmit({ kind: "series", patientId, startsAt, durationMinutes: duration, weeks: Number(weeks) });
    } else {
      void onSubmit({ kind: "series", patientId, startsAt, durationMinutes: duration, until });
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nova consulta"
      centered
      transitionProps={{ duration: 0 }}
      data-testid="new-appointment-modal"
    >
      {seriesResult ? (
        <SeriesResultSummary result={seriesResult} onClose={onCloseSeriesResult ?? onClose} />
      ) : (
        <form onSubmit={handleSubmit} noValidate data-testid="new-appointment-form">
          <Stack gap="sm">
            {formError && (
              <Alert color="red" variant="light" data-testid="new-appointment-error">
                {formError}
              </Alert>
            )}

            <NativeSelect
              label="Paciente"
              data={[{ value: "", label: "Selecione a paciente" }, ...patients]}
              value={patientId}
              onChange={(event) => setPatientId(event.currentTarget.value)}
              error={errors.patientId}
              required
            />

            <Group grow>
              <TextInput
                label="Data"
                type="date"
                value={date}
                error={errors.date}
                onChange={(event) => setDate(event.currentTarget.value)}
                required
              />
              <TextInput
                label="Horário"
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

            <Checkbox
              label="Repetir semanalmente"
              description="Cria uma consulta no mesmo dia da semana e horário, por várias semanas."
              checked={recurring}
              onChange={(event) => setRecurring(event.currentTarget.checked)}
            />

            {recurring && (
              <Stack gap="xs" pl="md" data-testid="recurrence-fields">
                <NativeSelect
                  label="Repetir até"
                  data={[
                    { value: "weeks", label: "Um número de semanas" },
                    { value: "until", label: "Uma data-limite" },
                  ]}
                  value={stopCriterion}
                  onChange={(event) => setStopCriterion(event.currentTarget.value === "until" ? "until" : "weeks")}
                />
                {stopCriterion === "weeks" ? (
                  <NumberInput
                    label="Número de semanas"
                    description="Incluindo a primeira consulta."
                    value={weeks}
                    error={errors.weeks}
                    onChange={setWeeks}
                    min={1}
                  />
                ) : (
                  <TextInput
                    label="Data-limite"
                    type="date"
                    value={until}
                    error={errors.until}
                    onChange={(event) => setUntil(event.currentTarget.value)}
                  />
                )}
              </Stack>
            )}

            <Group justify="flex-end" mt="md">
              <Button type="button" variant="default" onClick={onClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                {recurring ? "Criar série" : "Agendar consulta"}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

function SeriesResultSummary({
  result,
  onClose,
}: {
  result: { occurrences: AppointmentSeriesOccurrenceResult[] };
  onClose: () => void;
}) {
  const createdCount = result.occurrences.filter((o) => o.outcome === "created").length;
  const conflictCount = result.occurrences.length - createdCount;
  const formatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <Stack gap="sm" data-testid="series-result-summary">
      <Text size="sm">
        {createdCount} de {result.occurrences.length} consulta(s) da série {createdCount === 1 ? "foi criada" : "foram criadas"}
        {conflictCount > 0 ? `; ${conflictCount} ficou(aram) de fora por conflito de horário.` : "."}
      </Text>
      <Stack gap={4}>
        {result.occurrences.map((occurrence) => (
          <Group key={occurrence.startsAt} justify="space-between" data-testid="series-result-occurrence">
            <Text size="sm">{formatter.format(new Date(occurrence.startsAt))}</Text>
            <Badge color={occurrence.outcome === "created" ? "primary" : "red"} variant="light">
              {occurrence.outcome === "created" ? "Criada" : "Conflito"}
            </Badge>
          </Group>
        ))}
      </Stack>
      <Group justify="flex-end">
        <Button onClick={onClose}>Concluir</Button>
      </Group>
    </Stack>
  );
}
