import { Alert, Button, Center, Loader, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { patientsAdapter as defaultPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { PatientForm } from "./PatientForm";
import { EMPTY_PATIENT_FORM_VALUES, patientToFormValues, type PatientFormValues, toPatientPayload } from "./validation";

export interface PatientFormPageProps {
  /** Injetável para testes; produção usa o `patientsAdapter` composto em `src/adapters/patients`. */
  adapter?: PatientsAdapter;
}

/**
 * Rota `/pacientes/novo` (cadastro) e `/pacientes/:patientId/editar` (edição).
 * Mesmo componente para os dois modos: em edição, carrega o paciente via
 * `PatientsAdapter.getPatient` antes de exibir o formulário preenchido;
 * `status` não é editável aqui — arquivamento/desarquivamento acontecem na
 * lista (`PatientsListPage`), via `archivePatient`/`unarchivePatient`.
 */
export function PatientFormPage({ adapter = defaultPatientsAdapter }: PatientFormPageProps) {
  const { patientId } = useParams<{ patientId?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(patientId);

  const [initialValues, setInitialValues] = useState<PatientFormValues | null>(
    isEditMode ? null : EMPTY_PATIENT_FORM_VALUES,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    adapter.getPatient(patientId).then(
      (patient) => {
        if (!active) return;
        setInitialValues(patientToFormValues(patient));
      },
      () => {
        if (!active) return;
        setLoadError("Não foi possível carregar os dados deste paciente.");
      },
    );
    return () => {
      active = false;
    };
  }, [adapter, patientId]);

  async function handleSubmit(values: PatientFormValues) {
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = toPatientPayload(values);
      if (patientId) {
        await adapter.updatePatient(patientId, payload);
      } else {
        await adapter.createPatient(payload);
      }
      navigate("/pacientes", { replace: true });
    } catch {
      setFormError("Não foi possível salvar o paciente agora. Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate("/pacientes");
  }

  if (loadError) {
    return (
      <Stack gap="md" data-testid="patient-form-load-error">
        <Alert color="red" variant="light">
          {loadError}
        </Alert>
        <Button component={Link} to="/pacientes" variant="default" w="fit-content">
          Voltar para a lista
        </Button>
      </Stack>
    );
  }

  if (initialValues === null) {
    return (
      <Center mih={200}>
        <Loader data-testid="patient-form-loading" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Title order={2}>{isEditMode ? "Editar paciente" : "Nova paciente"}</Title>
      <PatientForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
        submitLabel={isEditMode ? "Salvar alterações" : "Cadastrar paciente"}
        formError={formError}
      />
    </Stack>
  );
}
