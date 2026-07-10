import { Alert, Button, Group, Modal, NativeSelect, Stack, Text, TextInput } from "@mantine/core";
import type { Charge, PaymentMethod, RegisterPaymentRequest } from "@psiops/contracts";
import { type FormEvent, useEffect, useState } from "react";

import { formatCentsAsBRL } from "./money";

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "cartao", label: "Cartão" },
  { value: "outro", label: "Outro" },
];

export interface RegisterPaymentModalProps {
  opened: boolean;
  charge: Charge | null;
  patientName: string;
  onSubmit: (payload: RegisterPaymentRequest) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  formError?: string | null;
  /** Injetável para testes; padrão é "hoje" em `AAAA-MM-DD` (data local). */
  today?: () => string;
}

/**
 * Modal de "marcar como paga" (PSI-037): pré-preenche valor com
 * `charge.amount` e data com hoje — a psicóloga confirma ou ajusta (ex.:
 * pagamento parcial, pagamento em data anterior) antes de registrar via
 * `ChargesAdapter.registerChargePayment`. Só a validação de campo
 * (obrigatoriedade) acontece aqui; erros de submissão (rede, 409 já paga)
 * chegam via `formError`, mesmo espírito de `NewAppointmentModal` (PSI-035).
 */
export function RegisterPaymentModal({
  opened,
  charge,
  patientName,
  onSubmit,
  onClose,
  submitting,
  formError,
  today = () => new Date().toISOString().slice(0, 10),
}: RegisterPaymentModalProps) {
  const [paidAmountReais, setPaidAmountReais] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !charge) return;
    setPaidAmountReais((charge.amount / 100).toFixed(2).replace(".", ","));
    setPaidDate(today());
    setMethod("pix");
    setNote("");
    setAmountError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `today` só é lido na abertura; recomputá-lo a cada render não deve reabrir o formulário.
  }, [opened, charge]);

  function parseAmountReais(raw: string): number | null {
    const normalized = raw.replace(/\./g, "").replace(",", ".").trim();
    if (normalized === "") return null;
    const value = Number(normalized);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!charge) return;

    const reais = parseAmountReais(paidAmountReais);
    if (reais === null) {
      setAmountError("Informe um valor pago válido.");
      return;
    }
    setAmountError(null);

    const payload: RegisterPaymentRequest = {
      paidAmount: Math.round(reais * 100),
      paidAt: new Date(`${paidDate}T12:00:00`).toISOString(),
      method,
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    void onSubmit(payload);
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Marcar mensalidade como paga"
      centered
      transitionProps={{ duration: 0 }}
      data-testid="register-payment-modal"
    >
      {charge && (
        <form onSubmit={handleSubmit} noValidate data-testid="register-payment-form">
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              {patientName} — mensalidade de {formatCentsAsBRL(charge.amount)}
            </Text>

            {formError && (
              <Alert color="red" variant="light" data-testid="register-payment-error">
                {formError}
              </Alert>
            )}

            <TextInput
              label="Valor pago (R$)"
              value={paidAmountReais}
              error={amountError}
              onChange={(event) => setPaidAmountReais(event.currentTarget.value)}
              required
            />

            <TextInput
              label="Data do pagamento"
              type="date"
              value={paidDate}
              onChange={(event) => setPaidDate(event.currentTarget.value)}
              required
            />

            <NativeSelect
              label="Meio de pagamento"
              data={PAYMENT_METHOD_OPTIONS}
              value={method}
              onChange={(event) => setMethod(event.currentTarget.value as PaymentMethod)}
            />

            <TextInput
              label="Observação"
              description="Opcional."
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
            />

            <Group justify="flex-end" mt="md">
              <Button type="button" variant="default" onClick={onClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting} data-testid="confirm-register-payment">
                Marcar como paga
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
