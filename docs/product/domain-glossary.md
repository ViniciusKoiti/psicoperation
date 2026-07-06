# PsiOps — Glossário do domínio

Vocabulário canônico do projeto. Código, contratos, banco e UI devem usar estes termos.
Nomes de código (inglês) entre parênteses quando divergirem do termo de negócio (pt-BR).

## Pessoas e contas

- **Psicóloga (User)** — a usuária do sistema; profissional autônoma dona da conta.
  Todo dado do domínio clínico-administrativo pertence a exatamente uma psicóloga
  (multi-tenant por `userId`).
- **Paciente (Patient)** — pessoa atendida pela psicóloga. No PsiOps carrega apenas
  dados cadastrais e de cobrança; **nunca** dados clínicos.
- **Lead** — pessoa interessada que se inscreveu na lista de espera pela landing
  (nome, WhatsApp, e-mail).

## Agenda e atendimento

- **Consulta / Agendamento (Appointment)** — compromisso com paciente em data/hora,
  com duração e status (`agendada`, `realizada`, `cancelada`, `remarcada`).
- **Recorrência semanal (weekly recurrence)** — padrão comum do domínio: o paciente tem
  horário fixo semanal. O MVP suporta apenas recorrência semanal simples.
- **Conflito de horário (schedule conflict)** — sobreposição de duas consultas da mesma
  psicóloga; deve ser bloqueado na API e sinalizado no client.
- **Registro administrativo (SessionRecord)** — anotação **não clínica** vinculada a uma
  consulta: compareceu, faltou, foi remarcada, observações administrativas.
  Distinto de prontuário/evolução clínica, que estão fora do produto.

## Financeiro

- **Mensalidade (Charge)** — cobrança mensal combinada com o paciente: valor (centavos),
  competência (mês/ano), vencimento e status.
- **Status de cobrança**: `em_dia` (paga dentro do prazo), `pendente` (aberta, não vencida),
  `atrasada` (aberta, vencida).
- **Inadimplência (delinquency)** — conjunto de mensalidades atrasadas; visão agregada
  central do produto.
- **Juros simples (simple interest)** — cálculo opcional sobre mensalidade atrasada,
  com taxa configurável; paridade com a calculadora exibida na landing.
- **Competência (reference month)** — mês/ano a que a mensalidade se refere,
  independente da data de pagamento.
- **Valor padrão de sessão (default session fee)** — valor sugerido definido no
  onboarding/configurações, usado como base ao criar cobranças.

## Organização

- **Tarefa (Task)** — pendência administrativa da psicóloga (título, vencimento, concluída).
- **Lembrete (Reminder)** — notificação programada, vinculável a consulta, cobrança ou
  paciente. Canal do MVP: e-mail.
- **Onboarding** — fluxo guiado pós-registro que coleta perfil profissional, valor padrão,
  horários de atendimento e preferências de lembrete.
- **Dashboard** — visão do dia: consultas, pendências financeiras e tarefas.
- **App companion (apps/mobile)** — aplicativo Flutter com o subconjunto do dia a dia
  fora do consultório: dashboard, agenda, pacientes, financeiro e configurações mínimas.

## Técnica

- **Contrato (contract)** — definição na especificação **OpenAPI 3.1** de
  `packages/contracts`, única fonte de DTOs, rotas, erros e eventos. O codegen
  comitado (`gen/ts`, `gen/java`, `gen/dart`) é consumido pelos apps; proibido
  duplicar DTOs (ADR 0008).
- **Adapter** — implementação de uma interface de acesso a dados nos frontends
  (web React e mobile Flutter). `Mock*Adapter` (memória, dev/test) e
  `Http*Adapter`/client HTTP (API real) respeitam o mesmo contrato (ADR 0006).
- **Evento de domínio (domain event)** — fato publicado pelos agregados do backend
  no event bus do **Axon** (ex.: `cobranca.atrasada`, `lembrete.devido`), com schema
  declarado em `packages/contracts`; consumido por event handlers (projeções, e-mail).
- **Deadline (Axon DeadlineManager)** — agendamento futuro dentro do backend que
  dispara lembretes (véspera/dia da consulta) e verificações (cobranças vencidas),
  substituindo filas externas (ADR 0009).
- **Migration Flyway** — script SQL versionado (`V1__`, `V2__`, …) em
  `apps/api/src/main/resources/db/migration/`; sequencial e imutável.
- **Manifesto de tarefa** — arquivo `tasks/PSI-0NN.yaml` que define escopo, caminhos
  permitidos e critérios de aceite de uma tarefa de implementação.
- **shared_change** — flag do manifesto que autoriza alterar arquivos compartilhados
  (lockfile, workflows, contracts, migrations Flyway). Uma por vez em execução.
