import { Stack, Text, TextInput, Title } from "@mantine/core";
import { type FormEvent, useState } from "react";

import type { OnboardingProfile } from "../../../adapters/settings";
import { hasErrors, type ProfileFormErrors, validateProfileStep } from "../validation";
import { StepActions } from "./StepActions";

export interface ProfileStepProps {
  initialValue?: OnboardingProfile;
  onBack?: () => void;
  onSkip: () => void;
  onSubmit: (data: OnboardingProfile) => void | Promise<void>;
  submitting?: boolean;
}

/** Passo 1: perfil profissional (nome de exibição obrigatório, CRP opcional com formato validado). */
export function ProfileStep({ initialValue, onBack, onSkip, onSubmit, submitting }: ProfileStepProps) {
  const [displayName, setDisplayName] = useState(initialValue?.displayName ?? "");
  const [crp, setCrp] = useState(initialValue?.crp ?? "");
  const [errors, setErrors] = useState<ProfileFormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: OnboardingProfile = { displayName, crp: crp.trim() || undefined };
    const validation = validateProfileStep(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    void onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="onboarding-step-perfil">
      <Stack gap="sm">
        <Title order={3}>Perfil profissional</Title>
        <Text c="dimmed" size="sm">
          Como você quer ser identificada no PsiOps.
        </Text>

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

        <StepActions onBack={onBack} onSkip={onSkip} submitting={submitting} />
      </Stack>
    </form>
  );
}
