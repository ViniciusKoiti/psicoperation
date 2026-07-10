import { Alert, Button, Card, Stack, Text, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";

import type { OnboardingProfile } from "../../../adapters/settings";
// Reutiliza a validação do onboarding (PSI-031) — mesmo formato de CRP,
// mesma regra de nome de exibição obrigatório — sem duplicar as regras
// aqui (manifesto PSI-039: "reutilize também os helpers de validação... do
// onboarding").
import { hasErrors, type ProfileFormErrors, validateProfileStep } from "../../onboarding/validation";
import { useSectionSave } from "../useSectionSave";

export interface ProfileSectionProps {
  /** Dado já salvo pelo onboarding (ou por uma edição anterior aqui) — mesmo `SettingsAdapter`. */
  initialValue?: OnboardingProfile;
  onSave: (data: OnboardingProfile) => Promise<void>;
}

/** Seção "Perfil profissional": nome de exibição (obrigatório) e CRP (opcional, formato validado). */
export function ProfileSection({ initialValue, onSave }: ProfileSectionProps) {
  const [displayName, setDisplayName] = useState(initialValue?.displayName ?? "");
  const [crp, setCrp] = useState(initialValue?.crp ?? "");
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const { saveState, handleSave } = useSectionSave(onSave);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: OnboardingProfile = { displayName, crp: crp.trim() || undefined };
    const validation = validateProfileStep(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    void handleSave(values);
  }

  return (
    <Card withBorder padding="md" radius="md" data-testid="settings-section-perfil">
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="sm">
          <div>
            <Title order={4}>Perfil profissional</Title>
            <Text c="dimmed" size="sm">
              Como você é identificada no PsiOps e em comunicações com suas pacientes.
            </Text>
          </div>

          <TextInput
            label="Nome de exibição"
            value={displayName}
            error={errors.displayName}
            onChange={(event) => setDisplayName(event.currentTarget.value)}
            required
          />

          <TextInput
            label="CRP"
            description="Opcional — formato UF/número, ex.: 06/12345"
            placeholder="06/12345"
            value={crp}
            error={errors.crp}
            onChange={(event) => setCrp(event.currentTarget.value)}
          />

          {saveState === "success" && (
            <Alert color="green" variant="light" data-testid="settings-perfil-success">
              Perfil atualizado.
            </Alert>
          )}
          {saveState === "error" && (
            <Alert color="red" variant="light" data-testid="settings-perfil-error">
              Não foi possível salvar o perfil agora. Tente novamente.
            </Alert>
          )}

          <Button type="submit" loading={saveState === "saving"} w="fit-content">
            Salvar
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
