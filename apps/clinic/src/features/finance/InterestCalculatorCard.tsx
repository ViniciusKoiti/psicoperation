import { Card, Divider, Group, NumberInput, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import { calculateOverdueAmount } from "./interest";
import { formatCentsAsBRL, reaisToCents } from "./money";

/**
 * Calculadora de juros simples (PSI-037), ferramenta de CONSULTA — não
 * altera cobrança alguma (fora de escopo do manifesto). Mesmos campos e
 * mesma fórmula do card "Juros calculados automaticamente" da landing
 * (`project/PsiOps Landing.html`, seção Solução — ver a doc de
 * `calculateOverdueAmount`, `./interest.ts`, para a paridade exata). Os
 * valores iniciais SÃO o exemplo do próprio card da landing, só para dar um
 * ponto de partida plausível — qualquer valor pode ser digitado.
 */
export function InterestCalculatorCard() {
  const [amountReais, setAmountReais] = useState<number | string>(350);
  const [overdueDays, setOverdueDays] = useState<number | string>(4);
  const [monthlyRatePercent, setMonthlyRatePercent] = useState<number | string>(1);
  const [finePercent, setFinePercent] = useState<number | string>(2);

  const amountCents = reaisToCents(Number(amountReais) || 0);
  const result = calculateOverdueAmount({
    amountCents,
    overdueDays: Number(overdueDays) || 0,
    monthlyRatePercent: Number(monthlyRatePercent) || 0,
    finePercent: Number(finePercent) || 0,
  });

  return (
    <Card withBorder padding="lg" radius="md" data-testid="interest-calculator">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={3}>Calculadora de juros simples</Title>
          <Text c="dimmed" size="sm">
            Consulte o valor atualizado de uma mensalidade em atraso — não altera a cobrança.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <NumberInput
            label="Valor original"
            value={amountReais}
            onChange={setAmountReais}
            prefix="R$ "
            decimalScale={2}
            fixedDecimalScale
            decimalSeparator=","
            thousandSeparator="."
            min={0}
          />
          <NumberInput label="Dias de atraso" value={overdueDays} onChange={setOverdueDays} min={0} />
          <NumberInput
            label="Juros (% ao mês)"
            value={monthlyRatePercent}
            onChange={setMonthlyRatePercent}
            min={0}
            decimalScale={2}
            suffix="%"
          />
          <NumberInput label="Multa (%)" value={finePercent} onChange={setFinePercent} min={0} decimalScale={2} suffix="%" />
        </SimpleGrid>

        <Divider />

        <Stack gap={6} data-testid="interest-calculator-result">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Valor original
            </Text>
            <Text size="sm">{formatCentsAsBRL(amountCents)}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Juros ({Number(monthlyRatePercent) || 0}% a.m.)
            </Text>
            <Text size="sm" data-testid="interest-calculator-interest">
              {formatCentsAsBRL(result.interestCents)}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Multa ({Number(finePercent) || 0}%)
            </Text>
            <Text size="sm" data-testid="interest-calculator-fine">
              {formatCentsAsBRL(result.fineCents)}
            </Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={600}>Total atualizado</Text>
            <Text fw={700} size="lg" data-testid="interest-calculator-total">
              {formatCentsAsBRL(result.totalCents)}
            </Text>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}
