import { Alert, Button, Group, Modal, Text } from "@mantine/core";

export interface CancelAppointmentModalProps {
  opened: boolean;
  patientName: string;
  dateTimeLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting?: boolean;
  formError?: string | null;
}

/**
 * Modal de confirmação de cancelamento de consulta (PSI-035) — critério de
 * aceite do manifesto ("cancelar pede confirmação"). Mesmo padrão de
 * `ArchivePatientModal` (PSI-033): explicita a consequência antes de agir. A
 * consulta NUNCA é removida — `AgendaAdapter.cancelAppointment` só marca
 * `status: "cancelada"`, preservando o histórico (PSI-034).
 */
export function CancelAppointmentModal({
  opened,
  patientName,
  dateTimeLabel,
  onConfirm,
  onCancel,
  submitting,
  formError,
}: CancelAppointmentModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Cancelar consulta"
      centered
      transitionProps={{ duration: 0 }}
      data-testid="cancel-appointment-modal"
    >
      {formError && (
        <Alert color="red" variant="light" mb="md" data-testid="cancel-appointment-error">
          {formError}
        </Alert>
      )}
      <Text size="sm" mb="md">
        Tem certeza que deseja cancelar a consulta de <strong>{patientName}</strong> em {dateTimeLabel}? A consulta
        permanece no histórico, marcada como cancelada.
      </Text>
      <Group justify="flex-end">
        <Button type="button" variant="default" onClick={onCancel} disabled={submitting}>
          Voltar
        </Button>
        <Button type="button" color="red" onClick={onConfirm} loading={submitting} data-testid="confirm-cancel-appointment">
          Cancelar consulta
        </Button>
      </Group>
    </Modal>
  );
}
