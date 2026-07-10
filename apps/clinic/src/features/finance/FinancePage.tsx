import { Alert, Badge, Button, Card, Group, Skeleton, Stack, Table, Text, Title } from "@mantine/core";
import type { Charge, ChargeStatus, RegisterPaymentRequest } from "@psiops/contracts";
import { useEffect, useState } from "react";

import { chargesAdapter as defaultChargesAdapter, type ChargesAdapter, type GenerateMonthlyChargesResult } from "../../adapters/charges";
import { patientsAdapter as defaultPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { EmptyState } from "../../components/EmptyState";
import {
  buildChargeDraftsForMonth,
  CHARGE_STATUS_LABEL,
  CHARGE_STATUS_ORDER,
  formatCompetence,
  formatGenerateSummary,
  formatIsoDateLabel,
  groupChargesByStatus,
  shiftCompetence,
  sumChargeAmounts,
  toCompetence,
} from "./finance";
import { InterestCalculatorCard } from "./InterestCalculatorCard";
import { formatCentsAsBRL } from "./money";
import { RegisterPaymentModal } from "./RegisterPaymentModal";

export interface FinancePageProps {
  /** Injetável para testes; produção usa o `chargesAdapter` composto em `src/adapters/charges`. */
  chargesAdapter?: ChargesAdapter;
  /** Injetável para testes; produção usa o `patientsAdapter` composto em `src/adapters/patients`. */
  patientsAdapter?: PatientsAdapter;
  /** Relógio injetável — determinismo do mês inicial nos testes (mesmo padrão de `AgendaPage`/`DashboardPage`). */
  today?: () => Date;
}

type LoadState = "loading" | "loaded" | "error";

const ACTIVE_PATIENTS_PAGE_SIZE = 500;

/**
 * Rota `/financeiro` (PSI-037): núcleo financeiro do app, centrado em
 * mensalidades. SUBSTITUI `FinancePlaceholderPage` (PSI-032).
 *
 * Visão mensal: cobranças da COMPETÊNCIA selecionada
 * (`chargesAdapter.listCharges({ competence })`), agrupadas por
 * `ChargeStatus` (em dia/pendente/atrasada — `groupChargesByStatus`), com
 * total por grupo e total geral, sempre formatados a partir de centavos
 * inteiros (`formatCentsAsBRL`). Navegação entre meses desloca a
 * competência (`shiftCompetence`) sem alterar o ano-base além do necessário.
 *
 * Gerar mensalidades do mês: busca os pacientes ativos
 * (`patientsAdapter.listPatients({ status: "ativo" })`), monta um rascunho
 * por paciente (`buildChargeDraftsForMonth`, usa `monthlyFee`/`billingDay`)
 * e chama `chargesAdapter.generateMonthlyCharges` — IDEMPOTENTE por
 * paciente+competência (ver a doc de `ChargesAdapter`); o resumo
 * (criadas/já existentes) fica visível até a próxima ação.
 *
 * Marcar como paga: abre `RegisterPaymentModal` pré-preenchido, registra via
 * `chargesAdapter.registerChargePayment` e mostra uma faixa "Desfazer" logo
 * acima da lista (`chargesAdapter.undoChargePayment`) até a próxima ação ou
 * navegação de mês.
 */
export function FinancePage({
  chargesAdapter = defaultChargesAdapter,
  patientsAdapter = defaultPatientsAdapter,
  today = () => new Date(),
}: FinancePageProps) {
  const [competence, setCompetence] = useState<string>(() => toCompetence(today()));

  const [chargesState, setChargesState] = useState<LoadState>("loading");
  const [charges, setCharges] = useState<Charge[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  const [patientsById, setPatientsById] = useState<Record<string, string>>({});

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSummary, setGenerateSummary] = useState<GenerateMonthlyChargesResult | null>(null);

  const [paymentTarget, setPaymentTarget] = useState<Charge | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [lastPaidCharge, setLastPaidCharge] = useState<Charge | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      patientsAdapter.listPatients({ status: "ativo", size: ACTIVE_PATIENTS_PAGE_SIZE }),
      patientsAdapter.listPatients({ status: "inativo", size: ACTIVE_PATIENTS_PAGE_SIZE }),
    ]).then(
      ([activePage, inactivePage]) => {
        if (!active) return;
        const byId: Record<string, string> = {};
        for (const p of [...activePage.items, ...inactivePage.items]) byId[p.id] = p.name;
        setPatientsById(byId);
      },
      () => {
        // Falha ao carregar nomes não bloqueia a lista de cobranças — nomes
        // caem no fallback do id (ver `patientLabel`).
      },
    );
    return () => {
      active = false;
    };
  }, [patientsAdapter]);

  useEffect(() => {
    let active = true;
    setChargesState("loading");
    chargesAdapter.listCharges({ competence }).then(
      (items) => {
        if (!active) return;
        setCharges(items);
        setChargesState("loaded");
      },
      () => {
        if (!active) return;
        setChargesState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [chargesAdapter, competence, reloadToken]);

  function patientLabel(patientId: string): string {
    return patientsById[patientId] ?? `Paciente ${patientId}`;
  }

  function reload() {
    setReloadToken((token) => token + 1);
  }

  function resetBanners() {
    setGenerateSummary(null);
    setGenerateError(null);
    setLastPaidCharge(null);
    setUndoError(null);
  }

  function goPrevMonth() {
    resetBanners();
    setCompetence((current) => shiftCompetence(current, -1));
  }

  function goNextMonth() {
    resetBanners();
    setCompetence((current) => shiftCompetence(current, 1));
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setGenerateSummary(null);
    try {
      const activePatients = await patientsAdapter.listPatients({ status: "ativo", size: ACTIVE_PATIENTS_PAGE_SIZE });
      const drafts = buildChargeDraftsForMonth(activePatients.items, competence);
      const result = await chargesAdapter.generateMonthlyCharges(drafts);
      setGenerateSummary(result);
      reload();
    } catch {
      setGenerateError("Não foi possível gerar as mensalidades do mês agora. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  }

  function openPaymentModal(charge: Charge) {
    setPaymentError(null);
    setPaymentTarget(charge);
  }

  function closePaymentModal() {
    setPaymentTarget(null);
    setPaymentError(null);
  }

  async function handleSubmitPayment(payload: RegisterPaymentRequest) {
    if (!paymentTarget) return;
    setPaymentSubmitting(true);
    setPaymentError(null);
    try {
      await chargesAdapter.registerChargePayment(paymentTarget.id, payload);
      setLastPaidCharge(paymentTarget);
      setUndoError(null);
      setPaymentTarget(null);
      reload();
    } catch {
      setPaymentError("Não foi possível registrar o pagamento agora. Tente novamente.");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function handleUndo() {
    if (!lastPaidCharge) return;
    setUndoError(null);
    try {
      await chargesAdapter.undoChargePayment(lastPaidCharge.id);
      setLastPaidCharge(null);
      reload();
    } catch {
      setUndoError("Não foi possível desfazer o pagamento agora. Tente novamente.");
    }
  }

  const groups = groupChargesByStatus(charges);
  const grandTotal = sumChargeAmounts(charges);

  return (
    <Stack gap="xl" data-testid="finance-page">
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Stack gap={4}>
          <Title order={2}>Financeiro</Title>
          <Text c="dimmed" size="sm">
            Mensalidades do mês, geração a partir da carteira de pacientes e calculadora de juros.
          </Text>
        </Stack>
        <Button onClick={() => void handleGenerate()} loading={generating} data-testid="finance-generate-button">
          Gerar mensalidades do mês
        </Button>
      </Group>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="xs">
          <Button variant="default" size="xs" onClick={goPrevMonth} aria-label="Mês anterior" data-testid="finance-prev-month">
            ‹ Mês anterior
          </Button>
          <Text fw={600} data-testid="finance-month-label">
            {formatCompetence(competence)}
          </Text>
          <Button variant="default" size="xs" onClick={goNextMonth} aria-label="Próximo mês" data-testid="finance-next-month">
            Próximo mês ›
          </Button>
        </Group>
      </Group>

      {generateError && (
        <Alert color="red" variant="light" data-testid="finance-generate-error">
          <Stack gap="sm">
            <Text size="sm">{generateError}</Text>
            <Button variant="light" color="red" size="xs" onClick={() => void handleGenerate()} w="fit-content">
              Tentar novamente
            </Button>
          </Stack>
        </Alert>
      )}

      {generateSummary && (
        <Alert color="primary" variant="light" data-testid="finance-generate-summary">
          {formatGenerateSummary(generateSummary)}
        </Alert>
      )}

      {lastPaidCharge && (
        <Alert color="green" variant="light" data-testid="finance-payment-undo-banner">
          <Group justify="space-between" wrap="wrap">
            <Text size="sm">Mensalidade de {patientLabel(lastPaidCharge.patientId)} marcada como paga.</Text>
            <Button variant="subtle" size="xs" onClick={() => void handleUndo()} data-testid="finance-undo-payment">
              Desfazer
            </Button>
          </Group>
          {undoError && (
            <Text size="xs" c="red" mt={4}>
              {undoError}
            </Text>
          )}
        </Alert>
      )}

      {chargesState === "loading" && (
        <Stack gap="xs" data-testid="finance-loading">
          <Skeleton height={60} radius="sm" />
          <Skeleton height={60} radius="sm" />
          <Skeleton height={60} radius="sm" />
        </Stack>
      )}

      {chargesState === "error" && (
        <Alert color="red" variant="light" data-testid="finance-error">
          <Stack gap="sm">
            <Text size="sm">Não foi possível carregar as mensalidades deste mês.</Text>
            <Button variant="light" color="red" size="xs" onClick={reload} w="fit-content">
              Tentar novamente
            </Button>
          </Stack>
        </Alert>
      )}

      {chargesState === "loaded" && charges.length === 0 && (
        <EmptyState
          title="Nenhuma mensalidade neste mês"
          description="Gere as mensalidades do mês a partir dos pacientes ativos, ou navegue até um mês com mensalidades já geradas."
          action={
            <Button onClick={() => void handleGenerate()} loading={generating} size="xs">
              Gerar mensalidades do mês
            </Button>
          }
        />
      )}

      {chargesState === "loaded" && charges.length > 0 && (
        <>
          <Card withBorder padding="md" radius="md" data-testid="finance-totals">
            <Group justify="space-between" wrap="wrap" gap="md">
              {CHARGE_STATUS_ORDER.map((status) => (
                <Stack key={status} gap={0} data-testid={`finance-total-${status}`}>
                  <Text size="xs" c="dimmed">
                    {CHARGE_STATUS_LABEL[status]}
                  </Text>
                  <Text fw={600}>{formatCentsAsBRL(sumChargeAmounts(groups[status]))}</Text>
                </Stack>
              ))}
              <Stack gap={0} data-testid="finance-total-geral">
                <Text size="xs" c="dimmed">
                  Total geral
                </Text>
                <Text fw={700} size="lg">
                  {formatCentsAsBRL(grandTotal)}
                </Text>
              </Stack>
            </Group>
          </Card>

          <Stack gap="lg" data-testid="finance-charges-groups">
            {CHARGE_STATUS_ORDER.map((status) => (
              <ChargeStatusGroup
                key={status}
                status={status}
                charges={groups[status]}
                patientLabel={patientLabel}
                onMarkAsPaid={openPaymentModal}
              />
            ))}
          </Stack>
        </>
      )}

      <InterestCalculatorCard />

      <RegisterPaymentModal
        opened={paymentTarget !== null}
        charge={paymentTarget}
        patientName={paymentTarget ? patientLabel(paymentTarget.patientId) : ""}
        onSubmit={handleSubmitPayment}
        onClose={closePaymentModal}
        submitting={paymentSubmitting}
        formError={paymentError}
      />
    </Stack>
  );
}

interface ChargeStatusGroupProps {
  status: ChargeStatus;
  charges: Charge[];
  patientLabel: (patientId: string) => string;
  onMarkAsPaid: (charge: Charge) => void;
}

function ChargeStatusGroup({ status, charges, patientLabel, onMarkAsPaid }: ChargeStatusGroupProps) {
  return (
    <Stack gap="xs" data-testid={`finance-charge-group-${status}`}>
      <Group justify="space-between">
        <Text fw={600}>{CHARGE_STATUS_LABEL[status]}</Text>
        <Text c="dimmed" size="sm" data-testid={`finance-charge-group-${status}-total`}>
          {charges.length === 0 ? "Nenhuma mensalidade" : formatCentsAsBRL(sumChargeAmounts(charges))}
        </Text>
      </Group>
      {charges.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nenhuma mensalidade nesta situação.
        </Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Paciente</Table.Th>
              <Table.Th>Vencimento</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Situação</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {charges.map((charge) => (
              <Table.Tr key={charge.id} data-testid="finance-charge-row" data-charge-id={charge.id}>
                <Table.Td>{patientLabel(charge.patientId)}</Table.Td>
                <Table.Td>{formatIsoDateLabel(charge.dueDate)}</Table.Td>
                <Table.Td>{formatCentsAsBRL(charge.amount)}</Table.Td>
                <Table.Td>
                  <Badge size="xs" variant="light" color={status === "atrasada" ? "red" : status === "pendente" ? "yellow" : "green"}>
                    {CHARGE_STATUS_LABEL[status]}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {status !== "em_dia" && (
                    <Button variant="subtle" size="compact-xs" onClick={() => onMarkAsPaid(charge)} data-testid={`finance-mark-paid-${charge.id}`}>
                      Marcar como paga
                    </Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
