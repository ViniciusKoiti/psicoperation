import { Alert, Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import type { Task } from "@psiops/contracts";
import { type FormEvent, useEffect, useState } from "react";

export interface EditTaskSubmit {
  title: string;
  dueDate?: string;
}

export interface EditTaskModalProps {
  opened: boolean;
  task: Task | null;
  onSubmit: (values: EditTaskSubmit) => void | Promise<void>;
  onClose: () => void;
  submitting?: boolean;
  formError?: string | null;
}

/**
 * Modal de edição posterior de título/vencimento (critério de aceite do
 * manifesto: "criação rápida... com... edição posterior de título/vencimento").
 * A criação em si acontece pela criação rápida (campo único na `TasksPage`,
 * Enter cria); este modal só edita uma tarefa já existente — não conclui nem
 * reabre (essas ações têm um clique próprio no checkbox da listagem, ver
 * `TasksPage.tsx`). Mesmo espírito de `RegisterPaymentModal`
 * (`src/features/finance/RegisterPaymentModal.tsx`, PSI-037): só validação
 * de campo aqui; erros de submissão chegam via `formError`.
 */
export function EditTaskModal({ opened, task, onSubmit, onClose, submitting, formError }: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !task) return;
    setTitle(task.title);
    setDueDate(task.dueDate ?? "");
    setTitleError(null);
  }, [opened, task]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) return;

    if (title.trim().length === 0) {
      setTitleError("Informe um título para a tarefa.");
      return;
    }
    setTitleError(null);

    void onSubmit({ title: title.trim(), ...(dueDate ? { dueDate } : {}) });
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Editar tarefa"
      centered
      transitionProps={{ duration: 0 }}
      data-testid="edit-task-modal"
    >
      {task && (
        <form onSubmit={handleSubmit} noValidate data-testid="edit-task-form">
          <Stack gap="sm">
            {formError && (
              <Alert color="red" variant="light" data-testid="edit-task-error">
                {formError}
              </Alert>
            )}

            <TextInput
              label="Título"
              value={title}
              error={titleError}
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
            />

            <TextInput
              label="Vencimento"
              description="Opcional."
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.currentTarget.value)}
            />

            <Group justify="flex-end" mt="md">
              <Button type="button" variant="default" onClick={onClose} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting} data-testid="confirm-edit-task">
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
