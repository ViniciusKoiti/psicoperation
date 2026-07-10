import { Button, Card, Group, Modal, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSession } from "../../../session/SessionContext";

/**
 * Seção "Sessão": encerra a sessão da conta autenticada (PSI-030,
 * `SessionManager.logout`/`useSession().logout`) com um passo de
 * confirmação antes de agir — diferente do botão "Sair" da `Topbar`, que
 * desloga direto (permanece assim; não é escopo desta tarefa alterá-lo).
 * Confirmado, encerra a sessão (token em memória limpo) e redireciona a
 * `/login`, mesmo destino do `AuthGuard` para usuárias sem sessão.
 */
export function AccountSection() {
  const { logout } = useSession();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirmLogout() {
    logout();
    setConfirmOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <Card withBorder padding="md" radius="md" data-testid="settings-section-sessao">
      <Stack gap="sm">
        <div>
          <Title order={4}>Sessão</Title>
          <Text c="dimmed" size="sm">
            Encerrar a sessão atual neste dispositivo.
          </Text>
        </div>

        <Button
          type="button"
          color="red"
          variant="light"
          onClick={() => setConfirmOpen(true)}
          w="fit-content"
          data-testid="settings-logout-button"
        >
          Sair da conta
        </Button>
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sair da conta"
        centered
        // Duração zero: evita depender de `transitionend` (não disparado pelo
        // jsdom), que deixaria o modal preso em estado de saída nos testes
        // (mesmo padrão de `ArchivePatientModal`).
        transitionProps={{ duration: 0 }}
        data-testid="settings-logout-modal"
      >
        <Text size="sm" mb="md">
          Tem certeza que deseja sair da sua conta? Você precisará entrar novamente para acessar o PsiOps.
        </Text>
        <Group justify="flex-end">
          <Button type="button" variant="default" onClick={() => setConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" color="red" onClick={handleConfirmLogout} data-testid="settings-logout-confirm">
            Sair
          </Button>
        </Group>
      </Modal>
    </Card>
  );
}
