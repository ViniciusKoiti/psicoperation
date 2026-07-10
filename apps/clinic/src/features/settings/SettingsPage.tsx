import { Alert, Button, Center, Loader, Stack, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";

import {
  type OnboardingStepData,
  type SettingsAdapter,
  settingsAdapter as defaultSettingsAdapter,
} from "../../adapters/settings";
import { AccountSection } from "./sections/AccountSection";
import { ProfileSection } from "./sections/ProfileSection";
import { ReminderSection } from "./sections/ReminderSection";
import { ScheduleSection } from "./sections/ScheduleSection";
import { SessionFeeSection } from "./sections/SessionFeeSection";

export interface SettingsPageProps {
  /** Injetável para testes; produção usa o `settingsAdapter` composto em `src/adapters/settings` — o MESMO usado pelo onboarding (PSI-031), sem duplicar interface nem instância. */
  adapter?: SettingsAdapter;
}

type LoadState = "loading" | "loaded" | "error";

/**
 * Rota `/configuracoes` (PSI-039): página permanente para revisar e editar
 * tudo o que o onboarding (PSI-031) definiu, em seções independentes —
 * perfil profissional, valor padrão de sessão, atendimento, lembretes — mais
 * uma seção de sessão (logout com confirmação).
 *
 * Reutiliza o `SettingsAdapter` do onboarding SEM redefinir a interface: os
 * mesmos métodos de extensão local (`getOnboardingData`/`saveOnboarding*`)
 * usados pelo wizard alimentam esta tela, garantindo que um dado editado
 * aqui é o mesmo lido pelo onboarding (e por qualquer outra tela que
 * consuma o adapter). Cada seção chama seu próprio `saveOnboarding*`, então
 * salvar uma seção nunca sobrescreve o dado de outra (ver
 * `MockSettingsAdapter`: cada método só grava sua própria chave em
 * `stepData`).
 *
 * Diferente do onboarding (wizard interrompível, um passo por vez), aqui
 * todas as seções ficam visíveis ao mesmo tempo — não há noção de "passo
 * pendente" nem redirecionamento ao completar; a psicóloga só está revendo/
 * ajustando dados já existentes (ou ainda não preenchidos, se pulou o
 * onboarding).
 */
export function SettingsPage({ adapter = defaultSettingsAdapter }: SettingsPageProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [data, setData] = useState<OnboardingStepData>({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadState("loading");
    adapter.getOnboardingData().then(
      (loaded) => {
        if (!active) return;
        setData(loaded);
        setLoadState("loaded");
      },
      () => {
        if (!active) return;
        setLoadState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [adapter, reloadToken]);

  function reload() {
    setReloadToken((token) => token + 1);
  }

  return (
    <Stack gap="xl" data-testid="settings-page">
      <div>
        <Title order={2}>Configurações</Title>
        <Text c="dimmed" size="sm">
          Revise e edite o que foi definido na configuração inicial da sua conta. Cada seção é salva
          separadamente.
        </Text>
      </div>

      {loadState === "loading" && (
        <Center mih={200}>
          <Loader data-testid="settings-loading" />
        </Center>
      )}

      {loadState === "error" && (
        <Alert color="red" variant="light" data-testid="settings-load-error">
          <Stack gap="sm">
            <Text size="sm">Não foi possível carregar suas configurações agora.</Text>
            <Button variant="light" color="red" size="xs" onClick={reload} w="fit-content">
              Tentar novamente
            </Button>
          </Stack>
        </Alert>
      )}

      {loadState === "loaded" && (
        <>
          <ProfileSection
            initialValue={data.perfil}
            onSave={async (values) => {
              await adapter.saveOnboardingProfile(values);
              setData((prev) => ({ ...prev, perfil: values }));
            }}
          />

          <SessionFeeSection
            initialValueCents={data["valor-sessao"]}
            onSave={async (feeCents) => {
              await adapter.saveOnboardingSessionFee(feeCents);
              setData((prev) => ({ ...prev, "valor-sessao": feeCents }));
            }}
          />

          <ScheduleSection
            initialValue={data.horarios}
            onSave={async (values) => {
              await adapter.saveOnboardingSchedule(values);
              setData((prev) => ({ ...prev, horarios: values }));
            }}
          />

          <ReminderSection
            initialValue={data.lembretes}
            onSave={async (values) => {
              await adapter.saveOnboardingReminderPreferences(values);
              setData((prev) => ({ ...prev, lembretes: values }));
            }}
          />

          <AccountSection />
        </>
      )}
    </Stack>
  );
}
