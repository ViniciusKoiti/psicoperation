import { Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Componente compartilhado de exemplo: placeholder genérico para listas e
 * seções sem dados ainda. Usado hoje pelo dashboard placeholder; features de
 * domínio futuras (carteira de pacientes, mensalidades, cobranças) podem
 * reutilizá-lo em vez de duplicar o padrão de "estado vazio".
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Stack align="center" gap="xs" py="xl" data-testid="empty-state">
      <Title order={4}>{title}</Title>
      {description ? (
        <Text c="dimmed" size="sm" ta="center">
          {description}
        </Text>
      ) : null}
      {action}
    </Stack>
  );
}
