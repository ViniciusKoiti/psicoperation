import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Pagination,
  SegmentedControl,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import type { Patient, PatientStatus } from "@psiops/contracts";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { DEFAULT_PATIENTS_PAGE_SIZE, patientsAdapter as defaultPatientsAdapter, type PatientsAdapter } from "../../adapters/patients";
import { EmptyState } from "../../components/EmptyState";
import { ArchivePatientModal } from "./ArchivePatientModal";
import { formatCentsAsBRL } from "./money";

export interface PatientsListPageProps {
  /** Injetável para testes; produção usa o `patientsAdapter` composto em `src/adapters/patients`. */
  adapter?: PatientsAdapter;
  /** Atraso do debounce da busca por nome, em ms (padrão: 300). Injetável só para acelerar testes. */
  searchDebounceMs?: number;
}

type LoadState = "loading" | "loaded" | "error";

interface PageMetaSummary {
  totalElements: number;
  totalPages: number;
}

/**
 * Lista de pacientes (PSI-033): busca por nome (com debounce) e paginação são
 * inteiramente resolvidas pelo `PatientsAdapter` (`listPatients`) — o mesmo
 * call site funciona sem mudança quando `HttpPatientsAdapter` entrar em uso
 * real (ver `src/adapters/patients/PatientsAdapter.ts`).
 *
 * Duas abas (`SegmentedControl`): "Ativos" (padrão) e "Arquivados". Arquivar
 * abre `ArchivePatientModal` (confirmação explícita, reversível); desarquivar
 * age direto (reverte uma ação já confirmada, sem nova confirmação).
 *
 * Estados tratados: carregando (skeleton), vazio sem pacientes, vazio por
 * busca sem resultados, e erro com ação de tentar novamente.
 *
 * Busca, aba e página ficam espelhadas na URL (`useSearchParams`) — isso é o
 * que permite ao detalhe do paciente (PSI-034, `/pacientes/:id`) "voltar
 * para a lista" preservando o que a usuária tinha filtrado: o nome do
 * paciente na tabela vira um link para o detalhe que carrega a URL atual da
 * lista em `location.state.back`.
 */
export function PatientsListPage({ adapter = defaultPatientsAdapter, searchDebounceMs = 300 }: PatientsListPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [debouncedSearch] = useDebouncedValue(search, searchDebounceMs);
  const [status, setStatus] = useState<PatientStatus>(() =>
    searchParams.get("status") === "inativo" ? "inativo" : "ativo",
  );
  const [page, setPage] = useState(() => Math.max(0, Number.parseInt(searchParams.get("page") ?? "0", 10) || 0));
  const [state, setState] = useState<LoadState>("loading");
  const [items, setItems] = useState<Patient[]>([]);
  const [meta, setMeta] = useState<PageMetaSummary | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [archiveTarget, setArchiveTarget] = useState<Patient | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Busca ou aba diferentes invalidam a página atual.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, status]);

  // Espelha busca/aba/página na URL (substitui a entrada de histórico, não
  // cria uma nova a cada tecla) — ver docstring da função.
  useEffect(() => {
    const next: Record<string, string> = { status, page: String(page) };
    if (debouncedSearch) next.q = debouncedSearch;
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, status, page, setSearchParams]);

  useEffect(() => {
    let active = true;
    setState("loading");
    adapter
      .listPatients({ page, size: DEFAULT_PATIENTS_PAGE_SIZE, status, search: debouncedSearch || undefined })
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setMeta({ totalElements: result.meta.totalElements, totalPages: result.meta.totalPages });
        setState("loaded");
      })
      .catch(() => {
        if (!active) return;
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [adapter, page, status, debouncedSearch, reloadToken]);

  function handleRetry() {
    setReloadToken((token) => token + 1);
  }

  function handleArchiveClick(patient: Patient) {
    setActionError(null);
    setArchiveTarget(patient);
  }

  async function handleConfirmArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await adapter.archivePatient(archiveTarget.id);
      setArchiveTarget(null);
      setReloadToken((token) => token + 1);
    } catch {
      setActionError("Não foi possível arquivar o paciente agora. Tente novamente.");
    } finally {
      setArchiving(false);
    }
  }

  async function handleUnarchive(patient: Patient) {
    setActionError(null);
    try {
      await adapter.unarchivePatient(patient.id);
      setReloadToken((token) => token + 1);
    } catch {
      setActionError("Não foi possível desarquivar o paciente agora. Tente novamente.");
    }
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2}>Pacientes</Title>
          <Text c="dimmed" size="sm">
            Carteira de pacientes: cadastro, mensalidade e arquivamento.
          </Text>
        </Stack>
        <Button component={Link} to="/pacientes/novo">
          Cadastrar paciente
        </Button>
      </Group>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <SegmentedControl
          value={status}
          onChange={(value) => setStatus(value as PatientStatus)}
          data={[
            { value: "ativo", label: "Ativos" },
            { value: "inativo", label: "Arquivados" },
          ]}
        />
        <TextInput
          placeholder="Buscar por nome"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          w={280}
          aria-label="Buscar paciente por nome"
        />
      </Group>

      {actionError && (
        <Alert color="red" variant="light" data-testid="patients-action-error">
          {actionError}
        </Alert>
      )}

      {state === "loading" && (
        <Stack gap="xs" data-testid="patients-loading">
          <Skeleton height={40} radius="sm" />
          <Skeleton height={40} radius="sm" />
          <Skeleton height={40} radius="sm" />
        </Stack>
      )}

      {state === "error" && (
        <Alert color="red" variant="light" data-testid="patients-error">
          <Stack gap="sm">
            <Text size="sm">Não foi possível carregar a lista de pacientes.</Text>
            <Button variant="light" color="red" onClick={handleRetry} w="fit-content">
              Tentar novamente
            </Button>
          </Stack>
        </Alert>
      )}

      {state === "loaded" && items.length === 0 && debouncedSearch === "" && (
        <EmptyState
          title={status === "ativo" ? "Nenhum paciente cadastrado" : "Nenhum paciente arquivado"}
          description={
            status === "ativo"
              ? "Cadastre a primeira paciente para começar a organizar mensalidades."
              : "Pacientes arquivados aparecem aqui — o histórico é preservado."
          }
          action={
            status === "ativo" ? (
              <Button component={Link} to="/pacientes/novo">
                Cadastrar paciente
              </Button>
            ) : undefined
          }
        />
      )}

      {state === "loaded" && items.length === 0 && debouncedSearch !== "" && (
        <EmptyState
          title="Nenhum paciente encontrado"
          description={`Não encontramos pacientes para "${debouncedSearch}".`}
        />
      )}

      {state === "loaded" && items.length > 0 && (
        <>
          <Table striped highlightOnHover data-testid="patients-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nome</Table.Th>
                <Table.Th>WhatsApp</Table.Th>
                <Table.Th>Mensalidade</Table.Th>
                <Table.Th>Vencimento</Table.Th>
                <Table.Th>Ações</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((patient) => (
                <Table.Tr key={patient.id}>
                  <Table.Td>
                    <Anchor
                      component={Link}
                      to={`/pacientes/${patient.id}`}
                      state={{ back: searchParams.toString() ? `/pacientes?${searchParams.toString()}` : "/pacientes" }}
                    >
                      {patient.name}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{patient.whatsapp ?? "—"}</Table.Td>
                  <Table.Td>{formatCentsAsBRL(patient.monthlyFee)}</Table.Td>
                  <Table.Td>Dia {patient.billingDay}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button component={Link} to={`/pacientes/${patient.id}/editar`} variant="subtle" size="xs">
                        Editar
                      </Button>
                      {patient.status === "ativo" ? (
                        <Button variant="subtle" color="red" size="xs" onClick={() => handleArchiveClick(patient)}>
                          Arquivar
                        </Button>
                      ) : (
                        <Button variant="subtle" size="xs" onClick={() => void handleUnarchive(patient)}>
                          Desarquivar
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {meta && meta.totalPages > 1 && (
            <Center>
              <Pagination value={page + 1} onChange={(value) => setPage(value - 1)} total={meta.totalPages} />
            </Center>
          )}
        </>
      )}

      <ArchivePatientModal
        opened={archiveTarget !== null}
        patientName={archiveTarget?.name ?? ""}
        onConfirm={() => void handleConfirmArchive()}
        onCancel={() => setArchiveTarget(null)}
        submitting={archiving}
      />
    </Stack>
  );
}
