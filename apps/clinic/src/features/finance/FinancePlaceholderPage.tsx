import { Stack, Text, Title } from "@mantine/core";

/**
 * Rota `/financeiro`: placeholder até a tela completa de financeiro
 * (mensalidades, cobranças, pagamentos — PSI-037) ser implementada.
 * Existe só para o atalho "Financeiro" do dashboard (PSI-032, ver
 * `DashboardPage.tsx`) ter para onde navegar — o manifesto PSI-032
 * explicitamente permite rotas placeholder para atalhos cujas tarefas de
 * destino ainda não existem ("rotas podem ser placeholders até as tarefas
 * correspondentes"), mesmo espírito de `/onboarding` antes da PSI-031 e
 * `/agenda` antes da PSI-035.
 */
export function FinancePlaceholderPage() {
  return (
    <Stack gap="xs" data-testid="finance-placeholder-page">
      <Title order={2}>Financeiro</Title>
      <Text c="dimmed" size="sm">
        A tela completa de financeiro (mensalidades, cobranças e pagamentos) ainda está em construção.
      </Text>
    </Stack>
  );
}
