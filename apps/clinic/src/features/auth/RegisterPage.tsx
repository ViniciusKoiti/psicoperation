import { Alert, Anchor, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import type { RegisterRequest } from "@psiops/contracts";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthError } from "../../adapters/auth";
import { useSession } from "../../session/SessionContext";
import { hasErrors, type RegisterFormErrors, validateRegister } from "./validation";

const EMPTY_VALUES: RegisterRequest = { name: "", email: "", password: "" };

/**
 * Rota pública `/registrar`: cria a conta da psicóloga. Conforme o contrato,
 * `/auth/register` já inicia a sessão — sucesso aqui leva direto ao app
 * (sem tela intermediária de confirmação).
 */
export function RegisterPage() {
  const { register } = useSession();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterRequest>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateRegister(values);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSubmitting(true);
    try {
      await register(values);
      navigate("/", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof AuthError && error.status === 409
          ? "Este e-mail já está cadastrado."
          : "Não foi possível criar sua conta agora. Tente novamente em instantes.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Center mih="100vh" p="md">
      <Paper
        withBorder
        shadow="sm"
        p="xl"
        radius="md"
        maw={360}
        w="100%"
        component="form"
        onSubmit={handleSubmit}
        noValidate
      >
        <Stack gap="sm">
          <Title order={2}>Criar conta</Title>
          <Text c="dimmed" size="sm">
            Leva menos de um minuto para começar a organizar suas mensalidades.
          </Text>

          {formError && (
            <Alert color="red" variant="light" data-testid="register-error">
              {formError}
            </Alert>
          )}

          <TextInput
            label="Nome completo"
            autoComplete="name"
            value={values.name}
            error={fieldErrors.name}
            onChange={(event) => {
              // Captura o valor sincronamente: `event.currentTarget` some depois
              // que o handler retorna, então não pode ser lido dentro do updater.
              const name = event.currentTarget.value;
              setValues((prev) => ({ ...prev, name }));
            }}
            required
          />

          <TextInput
            label="E-mail"
            type="email"
            autoComplete="email"
            value={values.email}
            error={fieldErrors.email}
            onChange={(event) => {
              const email = event.currentTarget.value;
              setValues((prev) => ({ ...prev, email }));
            }}
            required
          />

          <PasswordInput
            label="Senha"
            autoComplete="new-password"
            value={values.password}
            error={fieldErrors.password}
            onChange={(event) => {
              const password = event.currentTarget.value;
              setValues((prev) => ({ ...prev, password }));
            }}
            required
          />

          <Button type="submit" loading={submitting} fullWidth>
            Criar conta
          </Button>

          <Text size="sm" ta="center">
            Já tem conta?{" "}
            <Anchor component={Link} to="/login">
              Entrar
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
