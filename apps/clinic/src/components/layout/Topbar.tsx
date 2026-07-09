import { Button, Group, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";

import { useSession } from "../../session/SessionContext";

/**
 * Topbar do shell de layout: marca do produto + sessão da usuária (nome +
 * sair). Só é renderizada dentro de `ProtectedLayout` (atrás de `AuthGuard`),
 * então `user` está sempre presente aqui em uso normal.
 */
export function Topbar() {
  const { user, logout } = useSession();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Group h="100%" px="md" justify="space-between">
      <Text fw={700} size="lg">
        PsiOps
      </Text>
      <Group gap="sm">
        <Text c="dimmed" size="sm" data-testid="topbar-user-name">
          {user?.name ?? "Consultório"}
        </Text>
        <Button variant="subtle" size="xs" onClick={handleLogout}>
          Sair
        </Button>
      </Group>
    </Group>
  );
}
