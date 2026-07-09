import { Button, Center, Group, Loader, Paper, Stack, Stepper, Text, Title } from "@mantine/core";
import type { OnboardingStatus } from "@psiops/contracts";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import {
  ONBOARDING_STEP_KEYS,
  type OnboardingProfile,
  type OnboardingReminderPreferences,
  type OnboardingSchedule,
  type OnboardingStepData,
  type OnboardingStepKey,
  type SettingsAdapter,
  settingsAdapter as defaultSettingsAdapter,
} from "../../adapters/settings";
import { ProfileStep } from "./steps/ProfileStep";
import { ReminderPreferencesStep } from "./steps/ReminderPreferencesStep";
import { ScheduleStep } from "./steps/ScheduleStep";
import { SessionFeeStep } from "./steps/SessionFeeStep";

export interface OnboardingPageProps {
  /** Injetável para testes; produção usa o `settingsAdapter` composto em `src/adapters/settings`. */
  adapter?: SettingsAdapter;
}

const LAST_STEP_INDEX = ONBOARDING_STEP_KEYS.length - 1;

function clampStepIndex(index: number): number {
  if (index < 0) return 0;
  if (index > LAST_STEP_INDEX) return LAST_STEP_INDEX;
  return index;
}

/**
 * Primeiro índice de passo ainda não concluído; `-1` (todos concluídos) é
 * normalizado para o último passo (só ocorre em uma inconsistência entre
 * `completed` e `steps`, já que o caminho normal de "tudo concluído"
 * redireciona ao dashboard antes de chegar aqui).
 */
function firstPendingStepIndex(status: OnboardingStatus): number {
  const pending = status.steps.findIndex((step) => !step.done);
  return clampStepIndex(pending === -1 ? LAST_STEP_INDEX : pending);
}

/**
 * Onboarding pós-registro (PSI-031): wizard de 4 passos sequenciais
 * (perfil profissional, valor padrão de sessão, dias/horários de
 * atendimento, preferências de lembrete), persistidos via `SettingsAdapter`
 * (`MockSettingsAdapter` em memória por padrão em dev/test).
 *
 * Interrompível: cada passo pode ser pulado individualmente, e o fluxo
 * inteiro pode ser pulado de uma vez ("Concluir depois"). O progresso
 * (`OnboardingStatus.steps`) é a fonte da verdade para onde retomar — ao
 * montar, o wizard abre no primeiro passo ainda não concluído. Uma vez
 * `completed`, a usuária nunca mais vê este fluxo (redireciona ao
 * dashboard).
 */
export function OnboardingPage({ adapter = defaultSettingsAdapter }: OnboardingPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [data, setData] = useState<OnboardingStepData>({});
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([adapter.getOnboardingStatus(), adapter.getOnboardingData()]).then(([loadedStatus, loadedData]) => {
      if (!active) return;
      setStatus(loadedStatus);
      setData(loadedData);
      setActiveStep(firstPendingStepIndex(loadedStatus));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [adapter]);

  if (loading) {
    return (
      <Center mih="60vh">
        <Loader data-testid="onboarding-loading" />
      </Center>
    );
  }

  // Usuária que já concluiu o onboarding não vê o fluxo novamente.
  if (status?.completed) {
    return <Navigate to="/" replace />;
  }

  function applyNextStatus(nextStatus: OnboardingStatus) {
    setStatus(nextStatus);
    if (nextStatus.completed) {
      navigate("/", { replace: true });
      return;
    }
    setActiveStep(firstPendingStepIndex(nextStatus));
  }

  async function withSubmitting(action: () => Promise<OnboardingStatus>) {
    setSubmitting(true);
    try {
      const nextStatus = await action();
      applyNextStatus(nextStatus);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkipStep(stepKey: OnboardingStepKey) {
    return withSubmitting(() => adapter.completeOnboardingStep({ stepKey }));
  }

  async function handleSkipAll() {
    setSubmitting(true);
    try {
      let nextStatus: OnboardingStatus | null = null;
      for (const stepKey of ONBOARDING_STEP_KEYS) {
        nextStatus = await adapter.completeOnboardingStep({ stepKey });
      }
      if (nextStatus) applyNextStatus(nextStatus);
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveProfile(values: OnboardingProfile) {
    return withSubmitting(async () => {
      const nextStatus = await adapter.saveOnboardingProfile(values);
      setData((prev) => ({ ...prev, perfil: values }));
      return nextStatus;
    });
  }

  function handleSaveSessionFee(feeCents: number) {
    return withSubmitting(async () => {
      const nextStatus = await adapter.saveOnboardingSessionFee(feeCents);
      setData((prev) => ({ ...prev, "valor-sessao": feeCents }));
      return nextStatus;
    });
  }

  function handleSaveSchedule(values: OnboardingSchedule) {
    return withSubmitting(async () => {
      const nextStatus = await adapter.saveOnboardingSchedule(values);
      setData((prev) => ({ ...prev, horarios: values }));
      return nextStatus;
    });
  }

  function handleSaveReminderPreferences(values: OnboardingReminderPreferences) {
    return withSubmitting(async () => {
      const nextStatus = await adapter.saveOnboardingReminderPreferences(values);
      setData((prev) => ({ ...prev, lembretes: values }));
      return nextStatus;
    });
  }

  function goBack() {
    setActiveStep((current) => clampStepIndex(current - 1));
  }

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" radius="md" maw={640} w="100%" data-testid="onboarding-page">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Stack gap={4}>
              <Title order={2}>Vamos configurar sua conta</Title>
              <Text c="dimmed" size="sm">
                Leva poucos minutos — você pode pular qualquer passo e completar depois.
              </Text>
            </Stack>
            <Button type="button" variant="subtle" color="gray" size="xs" onClick={() => void handleSkipAll()} disabled={submitting}>
              Concluir depois
            </Button>
          </Group>

          <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
            <Stepper.Step label="Perfil" description="Dados profissionais">
              <ProfileStep
                initialValue={data.perfil}
                onSkip={() => void handleSkipStep("perfil")}
                onSubmit={handleSaveProfile}
                submitting={submitting}
              />
            </Stepper.Step>

            <Stepper.Step label="Valor da sessão" description="Padrão em R$">
              <SessionFeeStep
                initialValueCents={data["valor-sessao"]}
                onBack={goBack}
                onSkip={() => void handleSkipStep("valor-sessao")}
                onSubmit={handleSaveSessionFee}
                submitting={submitting}
              />
            </Stepper.Step>

            <Stepper.Step label="Horários" description="Dias e janelas">
              <ScheduleStep
                initialValue={data.horarios}
                onBack={goBack}
                onSkip={() => void handleSkipStep("horarios")}
                onSubmit={handleSaveSchedule}
                submitting={submitting}
              />
            </Stepper.Step>

            <Stepper.Step label="Lembretes" description="Canais e antecedência">
              <ReminderPreferencesStep
                initialValue={data.lembretes}
                onBack={goBack}
                onSkip={() => void handleSkipStep("lembretes")}
                onSubmit={handleSaveReminderPreferences}
                submitting={submitting}
              />
            </Stepper.Step>
          </Stepper>
        </Stack>
      </Paper>
    </Center>
  );
}
