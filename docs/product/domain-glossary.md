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

## Técnica

- **Contrato (contract)** — schema Zod + tipo inferido em `packages/contracts`;
  única definição de DTOs e eventos. Proibido duplicar em apps.
- **Adapter** — implementação de uma interface de acesso a dados no frontend.
  `Mock*Adapter` (memória, dev/test) e `Http*Adapter` (API real) respeitam o mesmo contrato.
- **Evento de domínio (domain event)** — fato publicado pela API na tabela **Outbox**
  (ex.: `cobranca.atrasada`, `lembrete.devido`) e consumido pela automation.
- **Outbox** — tabela que desacopla API de fila: a API grava eventos transacionalmente;
  a automation faz poll, publica no BullMQ e marca como processado.
- **Manifesto de tarefa** — arquivo `tasks/PSI-0NN.yaml` que define escopo, caminhos
  permitidos e critérios de aceite de uma tarefa de implementação.
- **shared_change** — flag do manifesto que autoriza alterar arquivos compartilhados
  (lockfile, workflows, contracts, database, migrations). Uma por vez em execução.
