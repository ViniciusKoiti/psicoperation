import { Alert, Button, Card, NumberInput, Stack, Text, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";

// Reutiliza a conversão/formatação de dinheiro do onboarding (PSI-031):
// dinheiro sempre em centavos inteiros BRL na camada de dados; a
// formatação em reais é responsabilidade exclusiva desta camada de
// apresentação (regra inviolável do CLAUDE.md).
import { centsToReais, formatCentsAsBRL, reaisToCents } from "../../onboarding/money";
import { hasErrors, type SessionFeeFormErrors, validateSessionFeeStep } from "../../onboarding/validation";
import { useSectionSave } from "../useSectionSave";

export interface SessionFeeSectionProps {
  /** Valor inicial em centavos BRL — mesmo dado lido/gravado pelo onboarding. */
  initialValueCents?: number;
  /** `feeCents` já convertido para centavos inteiros BRL. */
  onSave: (feeCents: number) => Promise<void>;
}

/**
 * Seção "Financeiro": valor padrão de sessão. Alterar aqui só vale para usos
 * futuros (novos pacientes/gerações) — não repactua valores já combinados
 * por paciente nem mensalidades já geradas (assumption do manifesto
 * PSI-039; risco documentado: "a UI deve deixar claro o alcance da
 * mudança").
 */
export function SessionFeeSection({ initialValueCents, onSave }: SessionFeeSectionProps) {
  const [reais, setReais] = useState<number | string>(
    initialValueCents !== undefined ? centsToReais(initialValueCents) : "",
  );
  const [savedCents, setSavedCents] = useState<number | undefined>(initialValueCents);
  const [errors, setErrors] = useState<SessionFeeFormErrors>({});
  const { saveState, handleSave } = useSectionSave(onSave);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // O `onChange` do `NumberInput` pode entregar `number` ou `string`
    // dependendo de como o valor foi digitado — normalizamos para número
    // antes de converter para centavos (mesmo tratamento do onboarding).
    const numericReais = typeof reais === "number" ? reais : reais === "" ? undefined : Number(reais);
    const feeCents =
      numericReais !== undefined && !Number.isNaN(numericReais) ? reaisToCents(numericReais) : undefined;
    const validation = validateSessionFeeStep(feeCents);
    setErrors(validation);
    if (hasErrors(validation) || feeCents === undefined) return;

    const ok = await handleSave(feeCents);
    if (ok) setSavedCents(feeCents);
  }

  return (
    <Card withBorder padding="md" radius="md" data-testid="settings-section-valor-sessao">
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <Stack gap="sm">
          <div>
            <Title order={4}>Valor padrão de sessão</Title>
            <Text c="dimmed" size="sm">
              Usado como sugestão ao cadastrar novas pacientes — pode ser ajustado por paciente. Alterar este
              valor não repactua sessões já combinadas nem mensalidades já geradas.
            </Text>
          </div>

          <NumberInput
            label="Valor da sessão"
            description={savedCents !== undefined ? `Valor salvo atualmente: ${formatCentsAsBRL(savedCents)}` : undefined}
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

          {saveState === "success" && (
            <Alert color="green" variant="light" data-testid="settings-valor-sessao-success">
              Valor padrão de sessão atualizado para {savedCents !== undefined ? formatCentsAsBRL(savedCents) : ""}.
            </Alert>
          )}
          {saveState === "error" && (
            <Alert color="red" variant="light" data-testid="settings-valor-sessao-error">
              Não foi possível salvar o valor padrão agora. Tente novamente.
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
