import { Group, Text } from "@mantine/core";

/**
 * Topbar do shell de layout: marca do produto + espaço reservado para o
 * menu de conta/usuária, que chega junto da autenticação real.
 */
export function Topbar() {
  return (
    <Group h="100%" px="md" justify="space-between">
      <Text fw={700} size="lg">
        PsiOps
      </Text>
      {/* Placeholder: menu de conta/usuária chega com a autenticação real. */}
      <Text c="dimmed" size="sm">
        Consultório
      </Text>
    </Group>
  );
}
