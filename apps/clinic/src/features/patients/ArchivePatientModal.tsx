import { Button, Group, Modal, Text } from "@mantine/core";

export interface ArchivePatientModalProps {
  opened: boolean;
  patientName: string;
  onConfirm: () => void;
  onCancel: () => void;
  submitting?: boolean;
}

/**
 * Modal de confirmação de arquivamento (PSI-033): explicita a consequência
 * antes de agir — o paciente sai da lista ativa, mas o histórico é
 * preservado, e a ação é reversível (desarquivar na aba "Arquivados").
 * Nunca exclui dados: `PatientsAdapter.archivePatient` só troca `status`
 * para `"inativo"` (ver `PatientsAdapter.ts`).
 */
export function ArchivePatientModal({ opened, patientName, onConfirm, onCancel, submitting }: ArchivePatientModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      title="Arquivar paciente"
      centered
      // Duração zero: evita depender de `transitionend` (não disparado pelo
      // jsdom), que deixaria o modal preso em estado de saída nos testes.
      transitionProps={{ duration: 0 }}
      data-testid="archive-patient-modal"
    >
      <Text size="sm" mb="md">
        Tem certeza que deseja arquivar <strong>{patientName}</strong>? Ela sai da lista de pacientes ativos e não
        gera novas mensalidades, mas o histórico é preservado e a ação pode ser revertida a qualquer momento na aba
        &quot;Arquivados&quot;.
      </Text>
      <Group justify="flex-end">
        <Button type="button" variant="default" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="button" color="red" onClick={onConfirm} loading={submitting} data-testid="confirm-archive-patient">
          Arquivar
        </Button>
      </Group>
    </Modal>
  );
}
