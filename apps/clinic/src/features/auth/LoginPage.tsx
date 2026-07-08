import { Button, Center, Paper, Stack, Text, Title } from "@mantine/core";

/**
 * Rota pública `/login` — placeholder estrutural. Autenticação real
 * (formulário, sessão, tokens) é fora de escopo desta tarefa (PSI-012) e
 * chega em uma tarefa futura dedicada.
 */
export function LoginPage() {
  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" radius="md" maw={360} w="100%">
        <Stack gap="sm">
          <Title order={2}>Entrar</Title>
          <Text c="dimmed" size="sm">
            Tela de login placeholder — autenticação real chega em uma tarefa futura.
          </Text>
          <Button disabled>Entrar (em breve)</Button>
        </Stack>
      </Paper>
    </Center>
  );
}
