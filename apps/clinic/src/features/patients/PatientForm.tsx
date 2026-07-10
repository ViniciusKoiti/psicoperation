import { Alert, Button, Group, NumberInput, Stack, Textarea, TextInput } from "@mantine/core";
import { type FormEvent, useState } from "react";

import { formatWhatsAppInput } from "./whatsapp";
import { hasErrors, type PatientFormErrors, type PatientFormValues, validatePatientForm } from "./validation";

export interface PatientFormProps {
  initialValues: PatientFormValues;
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel: string;
  /** Erro vindo da submissão ao adapter (ex.: falha de rede) — distinto dos erros de validação de campo. */
  formError?: string | null;
}

/**
 * Campos do formulário de cadastro/edição de pacientes (PSI-033): apenas
 * dados administrativos e de cobrança (nome, WhatsApp, e-mail, valor da
 * mensalidade em centavos BRL, dia de vencimento, anotações administrativas)
 * — nenhum campo clínico (restrição inviolável, CLAUDE.md). Compartilhado
 * entre cadastro (`/pacientes/novo`) e edição (`/pacientes/:id/editar`) via
 * `PatientFormPage`, que resolve o carregamento/persistência pelo
 * `PatientsAdapter`.
 */
export function PatientForm({ initialValues, onSubmit, onCancel, submitting, submitLabel, formError }: PatientFormProps) {
  const [values, setValues] = useState<PatientFormValues>(initialValues);
  const [errors, setErrors] = useState<PatientFormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validatePatientForm(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    void onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="patient-form">
      <Stack gap="sm">
        {formError && (
          <Alert color="red" variant="light" data-testid="patient-form-error">
            {formError}
          </Alert>
        )}

        <TextInput
          label="Nome"
          value={values.name}
          error={errors.name}
          onChange={(event) => {
            const name = event.currentTarget.value;
            setValues((prev) => ({ ...prev, name }));
          }}
          required
        />

        <TextInput
          label="WhatsApp"
          description="Opcional — usado para lembretes de cobrança."
          placeholder="(11) 99876-5432"
          value={values.whatsapp}
          error={errors.whatsapp}
          onChange={(event) => {
            const whatsapp = formatWhatsAppInput(event.currentTarget.value);
            setValues((prev) => ({ ...prev, whatsapp }));
          }}
        />

        <TextInput
          label="E-mail"
          description="Opcional."
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => {
            const email = event.currentTarget.value;
            setValues((prev) => ({ ...prev, email }));
          }}
        />

        <NumberInput
          label="Valor da mensalidade"
          value={values.monthlyFeeReais}
          error={errors.monthlyFeeReais}
          onChange={(monthlyFeeReais) => setValues((prev) => ({ ...prev, monthlyFeeReais }))}
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          decimalSeparator=","
          thousandSeparator="."
          min={0}
          required
        />

        <NumberInput
          label="Dia de vencimento"
          description="Entre 1 e 28 — limitado para existir em todos os meses."
          value={values.billingDay}
          error={errors.billingDay}
          onChange={(billingDay) => setValues((prev) => ({ ...prev, billingDay }))}
          min={1}
          max={28}
          required
        />

        <Textarea
          label="Anotações administrativas"
          description="Ex.: preferências de contato, combinados de pagamento. Não é um campo clínico."
          value={values.notes}
          error={errors.notes}
          onChange={(event) => {
            const notes = event.currentTarget.value;
            setValues((prev) => ({ ...prev, notes }));
          }}
          autosize
          minRows={2}
        />

        <Group justify="flex-end" mt="md">
          <Button type="button" variant="default" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
