import { Alert, Button, Group, Modal, Radio, Stack, Text, Textarea } from "@mantine/core";
import type { Appointment, AttendanceRecord, AttendanceStatus } from "@psiops/contracts";
import { type FormEvent, useEffect, useState } from "react";

import { ATTENDANCE_STATUS_LABEL } from "../patients/patientDetail";

/**
 * Payload que `AttendanceRecordModal` devolve ao submeter — a página
 * chamadora (`AgendaPage`, PSI-035, ou `PatientDetailPage`, PSI-034) decide
 * o que fazer com cada `kind`, sem este componente conhecer `AgendaAdapter`:
 *
 * - `"presence"`: presença ou falta — a página chama
 *   `AgendaAdapter.recordAttendance` diretamente.
 * - `"reschedule"`: a psicóloga escolheu registrar uma REMARCAÇÃO — este
 *   modal NUNCA remarca sozinho (critério de aceite: "conduz ao fluxo de
 *   remarcação da PSI-035"). A página fecha este modal e abre
 *   `RescheduleAppointmentModal` (o mesmo componente da PSI-035),
 *   repassando `administrativeNotes` para vincular a anotação ao registro
 *   de presença lançado depois que a remarcação for confirmada.
 */
export type AttendanceRecordSubmitValues =
  | { kind: "presence"; attendance: "compareceu" | "faltou"; administrativeNotes?: string }
  | { kind: "reschedule"; administrativeNotes?: string };

export interface AttendanceRecordModalProps {
  opened: boolean;
  appointment: Appointment | null;
  patientName?: string;
  /** Registro já existente desta consulta, para EDIÇÃO (pré-preenche presença e anotação). Ausente = criação. */
  existingRecord?: AttendanceRecord;
  /**
   * `false` quando a consulta ainda não ocorreu (horário no futuro):
   * "compareceu"/"faltou" ficam desabilitados — só remarcação é permitida
   * (assumption do manifesto PSI-036: desfecho de consulta futura tem
   * semântica ambígua).
   */
  allowPresence: boolean;
  onSubmit: (values: AttendanceRecordSubmitValues) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  formError?: string | null;
}

const NOTES_MAX_LENGTH = 2000;

/**
 * Modal de registro do desfecho ADMINISTRATIVO de uma consulta (PSI-036):
 * presença, falta ou remarcação, mais uma anotação administrativa curta
 * opcional. Compartilhado entre a agenda (PSI-035, `AgendaPage`) e o
 * histórico do detalhe do paciente (PSI-034, `PatientDetailPage`) — mesmo
 * componente, sem duplicar formulário nem validação.
 *
 * RESTRIÇÃO DE PRODUTO INEGOCIÁVEL (CLAUDE.md): NENHUM campo, rótulo ou
 * placeholder de natureza clínica. O único campo de texto livre é
 * explicitamente rotulado "Anotação administrativa", com texto auxiliar
 * orientando a NÃO inserir conteúdo clínico — a mesma convenção já usada em
 * `PatientForm` (PSI-033) para `patient.notes`.
 */
export function AttendanceRecordModal({
  opened,
  appointment,
  patientName,
  existingRecord,
  allowPresence,
  onSubmit,
  onClose,
  submitting,
  formError,
}: AttendanceRecordModalProps) {
  const [attendance, setAttendance] = useState<AttendanceStatus>("compareceu");
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!opened) return;
    const initialAttendance = existingRecord?.attendance ?? (allowPresence ? "compareceu" : "remarcada");
    setAttendance(initialAttendance);
    setNotes(existingRecord?.administrativeNotes ?? "");
    setNotesError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal ABRE, não a cada re-render com o mesmo `existingRecord`.
  }, [opened, appointment?.id]);

  const isEditing = existingRecord !== undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (notes.length > NOTES_MAX_LENGTH) {
      setNotesError(`A anotação pode ter no máximo ${NOTES_MAX_LENGTH} caracteres.`);
      return;
    }
    setNotesError(undefined);
    const administrativeNotes = notes.trim() ? notes.trim() : undefined;

    if (attendance === "remarcada") {
      void onSubmit({ kind: "reschedule", administrativeNotes });
      return;
    }
    void onSubmit({ kind: "presence", attendance, administrativeNotes });
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? "Editar registro administrativo" : "Registrar desfecho da consulta"}
      centered
      transitionProps={{ duration: 0 }}
      data-testid="attendance-record-modal"
    >
      <form onSubmit={handleSubmit} noValidate data-testid="attendance-record-form">
        <Stack gap="sm">
          {patientName && (
            <Text size="sm" c="dimmed">
              Paciente: <strong>{patientName}</strong>
            </Text>
          )}

          {formError && (
            <Alert color="red" variant="light" data-testid="attendance-record-error">
              {formError}
            </Alert>
          )}

          <Radio.Group
            label="Desfecho da consulta"
            value={attendance}
            onChange={(value) => setAttendance(value as AttendanceStatus)}
          >
            <Stack gap={4} mt="xs">
              <Radio
                value="compareceu"
                label={ATTENDANCE_STATUS_LABEL.compareceu}
                disabled={!allowPresence}
                data-testid="attendance-option-compareceu"
              />
              <Radio
                value="faltou"
                label={ATTENDANCE_STATUS_LABEL.faltou}
                disabled={!allowPresence}
                data-testid="attendance-option-faltou"
              />
              <Radio
                value="remarcada"
                label="Remarcar consulta"
                data-testid="attendance-option-remarcada"
              />
            </Stack>
          </Radio.Group>

          {!allowPresence && (
            <Text size="xs" c="dimmed" data-testid="attendance-future-notice">
              Esta consulta ainda não ocorreu — só é possível registrar remarcação. Presença ou falta ficam
              disponíveis depois do horário da consulta.
            </Text>
          )}

          <Textarea
            label="Anotação administrativa (opcional)"
            description="Só informações administrativas — ex.: pagamento combinado, motivo da remarcação. Não inclua conteúdo clínico, diagnóstico ou evolução do paciente."
            value={notes}
            error={notesError}
            onChange={(event) => setNotes(event.currentTarget.value)}
            maxLength={NOTES_MAX_LENGTH}
            autosize
            minRows={2}
            data-testid="attendance-notes-input"
          />

          <Group justify="flex-end" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {attendance === "remarcada" ? "Continuar para remarcação" : "Registrar"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
