import { Alert, Button, Group, Modal, NativeSelect, NumberInput, Radio, Stack, Text, Textarea, TextInput } from "@mantine/core";
import type { ReminderCreateRequest } from "@psiops/contracts";
import { type FormEvent, useEffect, useState } from "react";

import { buildPaymentReminderRequest, buildSessionReminderRequest, type ReminderLinkType } from "./reminders";

/** Consulta futura elegível a lembrete de sessão, já resolvida com o nome da paciente (montada por `RemindersPage`). */
export interface AppointmentReminderOption {
  appointmentId: string;
  patientId: string;
  /** Rótulo pronto para exibição no select — ex.: "Marina Alves — 13/07/2026 14:00". */
  label: string;
  startsAt: string;
}

/** Cobrança em aberto elegível a lembrete de pagamento, já resolvida com o nome da paciente (montada por `RemindersPage`). */
export interface ChargeReminderOption {
  chargeId: string;
  patientId: string;
  /** Rótulo pronto para exibição no select — ex.: "Marina Alves — Julho/2026 — R$ 250,00". */
  label: string;
  competence: string;
  amount: number;
  dueDate: string;
}

export interface NewReminderModalProps {
  opened: boolean;
  appointmentOptions: readonly AppointmentReminderOption[];
  chargeOptions: readonly ChargeReminderOption[];
  /** Antecedência padrão (horas) sugerida no formulário — assumption do manifesto: preferências do onboarding (PSI-031) servem de valor inicial. */
  defaultLeadTimeHours: number;
  onSubmit: (payload: ReminderCreateRequest) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  formError?: string | null;
}

interface FieldErrors {
  target?: string;
  leadTimeHours?: string;
}

/**
 * Modal de criação de lembrete (PSI-038): escolhe o tipo de vínculo
 * (sessão/consulta ou pagamento/mensalidade — critério de aceite:
 * "vinculável a consulta ou a mensalidade"), a entidade específica, e a
 * antecedência (horas antes do horário da consulta ou da meia-noite do
 * vencimento — `computeScheduledFor`/`chargeReferenceInstant`,
 * `./reminders.ts`). Canal fixo em "email" (único do MVP, contrato
 * `ReminderChannel`). Assunto/corpo são montados automaticamente por
 * template administrativo (`buildSessionReminderRequest`/
 * `buildPaymentReminderRequest`) — não editáveis livremente, para garantir
 * que nunca carreguem conteúdo clínico (CLAUDE.md); um preview somente-
 * leitura mostra o texto que será enviado.
 */
export function NewReminderModal({
  opened,
  appointmentOptions,
  chargeOptions,
  defaultLeadTimeHours,
  onSubmit,
  onClose,
  submitting,
  formError,
}: NewReminderModalProps) {
  const [linkType, setLinkType] = useState<ReminderLinkType>("sessao");
  const [targetId, setTargetId] = useState("");
  const [leadTimeHours, setLeadTimeHours] = useState<number | string>(defaultLeadTimeHours);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!opened) return;
    setLinkType("sessao");
    setTargetId("");
    setLeadTimeHours(defaultLeadTimeHours);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `defaultLeadTimeHours` só é lido na abertura; recomputá-lo a cada render não deve reabrir o formulário.
  }, [opened]);

  const options = linkType === "sessao" ? appointmentOptions : chargeOptions;
  const selectedAppointment = linkType === "sessao" ? appointmentOptions.find((option) => option.appointmentId === targetId) : undefined;
  const selectedCharge = linkType === "pagamento" ? chargeOptions.find((option) => option.chargeId === targetId) : undefined;

  function preview(): { subject: string; body: string } | null {
    const hours = typeof leadTimeHours === "number" ? leadTimeHours : Number(leadTimeHours);
    if (!Number.isFinite(hours) || hours <= 0) return null;
    if (selectedAppointment) {
      return buildSessionReminderRequest(selectedAppointment.patientId, selectedAppointment.appointmentId, selectedAppointment.startsAt, hours);
    }
    if (selectedCharge) {
      return buildPaymentReminderRequest(
        selectedCharge.patientId,
        selectedCharge.chargeId,
        selectedCharge.competence,
        selectedCharge.amount,
        selectedCharge.dueDate,
        hours,
      );
    }
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!targetId) {
      nextErrors.target = linkType === "sessao" ? "Selecione a consulta." : "Selecione a mensalidade.";
    }
    const hours = typeof leadTimeHours === "number" ? leadTimeHours : Number(leadTimeHours);
    if (!Number.isFinite(hours) || hours <= 0) {
      nextErrors.leadTimeHours = "Informe uma antecedência válida (em horas).";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    let payload: ReminderCreateRequest | null = null;
    if (selectedAppointment) {
      payload = buildSessionReminderRequest(selectedAppointment.patientId, selectedAppointment.appointmentId, selectedAppointment.startsAt, hours);
    } else if (selectedCharge) {
      payload = buildPaymentReminderRequest(
        selectedCharge.patientId,
        selectedCharge.chargeId,
        selectedCharge.competence,
        selectedCharge.amount,
        selectedCharge.dueDate,
        hours,
      );
    }
    if (!payload) return;

    void onSubmit(payload);
  }

  const previewContent = preview();

  return (
    <Modal opened={opened} onClose={onClose} title="Novo lembrete" centered transitionProps={{ duration: 0 }} data-testid="new-reminder-modal">
      <form onSubmit={handleSubmit} noValidate data-testid="new-reminder-form">
        <Stack gap="sm">
          {formError && (
            <Alert color="red" variant="light" data-testid="new-reminder-error">
              {formError}
            </Alert>
          )}

          <Radio.Group
            label="Vínculo"
            value={linkType}
            onChange={(value) => {
              setLinkType(value === "pagamento" ? "pagamento" : "sessao");
              setTargetId("");
            }}
          >
            <Group mt="xs" gap="lg">
              <Radio value="sessao" label="Lembrete de sessão (consulta)" data-testid="reminder-link-sessao" />
              <Radio value="pagamento" label="Lembrete de pagamento (mensalidade)" data-testid="reminder-link-pagamento" />
            </Group>
          </Radio.Group>

          <NativeSelect
            label={linkType === "sessao" ? "Consulta" : "Mensalidade"}
            data={[
              { value: "", label: linkType === "sessao" ? "Selecione a consulta" : "Selecione a mensalidade" },
              ...options.map((option) => ({
                value: linkType === "sessao" ? (option as AppointmentReminderOption).appointmentId : (option as ChargeReminderOption).chargeId,
                label: option.label,
              })),
            ]}
            value={targetId}
            onChange={(event) => setTargetId(event.currentTarget.value)}
            error={errors.target}
            data-testid="reminder-target-select"
            required
          />

          <TextInput label="Canal" value="E-mail" disabled description="Único canal disponível nesta fase." />

          <NumberInput
            label="Antecedência"
            description="Horas antes da consulta (ou da meia-noite do vencimento)."
            suffix=" horas"
            value={leadTimeHours}
            onChange={setLeadTimeHours}
            error={errors.leadTimeHours}
            min={1}
            step={1}
            required
          />

          {previewContent && (
            <Textarea
              label="Pré-visualização do e-mail"
              description="Texto administrativo gerado automaticamente — sem edição livre."
              value={`${previewContent.subject}\n\n${previewContent.body}`}
              readOnly
              autosize
              minRows={2}
              data-testid="reminder-preview"
            />
          )}

          {options.length === 0 && (
            <Text size="sm" c="dimmed" data-testid="reminder-no-targets">
              {linkType === "sessao" ? "Nenhuma consulta futura disponível para vincular." : "Nenhuma mensalidade em aberto disponível para vincular."}
            </Text>
          )}

          <Group justify="flex-end" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} disabled={options.length === 0} data-testid="confirm-new-reminder">
              Agendar lembrete
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
