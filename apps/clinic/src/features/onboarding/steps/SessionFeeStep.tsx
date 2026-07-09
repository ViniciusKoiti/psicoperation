import { NumberInput, Stack, Text, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";

import { centsToReais, reaisToCents } from "../money";
import { type SessionFeeFormErrors, hasErrors, validateSessionFeeStep } from "../validation";
import { StepActions } from "./StepActions";

export interface SessionFeeStepProps {
  /** Valor inicial em centavos BRL. */
  initialValueCents?: number;
  onBack?: () => void;
  onSkip: () => void;
  /** `feeCents` já convertido para centavos inteiros BRL. */
  onSubmit: (feeCents: number) => void | Promise<void>;
  submitting?: boolean;
}

/**
 * Passo 2: valor padrão de sessão. O `NumberInput` opera em reais
 * (formatado como moeda brasileira); a conversão para centavos inteiros
 * BRL — a única representação de dinheiro persistida — acontece só no
 * limite de submissão (`reaisToCents`).
 */
export function SessionFeeStep({ initialValueCents, onBack, onSkip, onSubmit, submitting }: SessionFeeStepProps) {
  const [reais, setReais] = useState<number | string>(
    initialValueCents !== undefined ? centsToReais(initialValueCents) : "",
  );
  const [errors, setErrors] = useState<SessionFeeFormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // O `onChange` do `NumberInput` pode entregar `number` ou `string`
    // (react-number-format) dependendo de como o valor foi digitado —
    // normalizamos para número antes de converter para centavos.
    const numericReais = typeof reais === "number" ? reais : reais === "" ? undefined : Number(reais);
    const feeCents =
      numericReais !== undefined && !Number.isNaN(numericReais) ? reaisToCents(numericReais) : undefined;
    const validation = validateSessionFeeStep(feeCents);
    setErrors(validation);
    if (hasErrors(validation) || feeCents === undefined) return;

    void onSubmit(feeCents);
  }

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="onboarding-step-valor-sessao">
      <Stack gap="sm">
        <Title order={3}>Valor padrão de sessão</Title>
        <Text c="dimmed" size="sm">
          Usado como sugestão ao cadastrar novas pacientes — pode ser ajustado por paciente depois.
        </Text>

        <NumberInput
          label="Valor da sessão"
          value={reais}
          onChange={setReais}
          error={errors.sessionFee}
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          decimalSeparator=","
          thousandSeparator="."
          min={0}
          required
        />

        <StepActions onBack={onBack} onSkip={onSkip} submitting={submitting} />
      </Stack>
    </form>
  );
}
