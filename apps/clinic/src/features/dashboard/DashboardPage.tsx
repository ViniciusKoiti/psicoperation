import { Card, Loader, Stack, Text, Title } from "@mantine/core";
import type { Patient } from "@psiops/contracts";
import { useEffect, useState } from "react";

import { patientsAdapter } from "../../adapters/patients";
import { EmptyState } from "../../components/EmptyState";

/**
 * Placeholder da feature de dashboard: demonstra o fluxo adapter → feature →
 * UI ponta a ponta usando `PatientsAdapter` (mock) e o tipo `Patient` de
 * `@psiops/contracts`. Sem cálculos financeiros nem dado clínico — a feature
 * de domínio completa (carteira de pacientes, mensalidades) é escopo de
 * tarefas futuras.
 */
export function DashboardPage() {
  const [patients, setPatients] = useState<Patient[] | null>(null);

  useEffect(() => {
    let active = true;
    patientsAdapter.listPatients().then((page) => {
      if (active) {
        setPatients(page.items);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Stack gap="md">
      <Title order={2}>Dashboard</Title>
      {patients === null ? (
        <Loader size="sm" data-testid="dashboard-loading" />
      ) : patients.length === 0 ? (
        <EmptyState
          title="Nenhuma paciente cadastrada"
          description="Placeholder — o cadastro de pacientes chega em tarefa futura."
        />
      ) : (
        <Stack gap="xs">
          {patients.map((patient) => (
            <Card key={patient.id} withBorder padding="sm" radius="md">
              <Text fw={600}>{patient.name}</Text>
              <Text c="dimmed" size="sm">
                Status: {patient.status}
              </Text>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
