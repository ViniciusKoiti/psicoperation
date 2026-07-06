# PsiOps — Escopo do MVP

> Revisado em 2026-07-05 após o pivô de stack (ADRs 0007–0009): backend único
> Spring Boot + Axon, app mobile Flutter incluído no MVP, contratos OpenAPI-first.

## Visão

PsiOps é um SaaS de gestão financeira e administrativa para **psicólogas solo
brasileiras**, com foco em **mensalidades** (cobrança recorrente mensal por paciente).
O produto reduz o trabalho manual de cobrar, lembrar e organizar a rotina
administrativa do consultório.

## Público

- Psicóloga autônoma, atendendo em consultório próprio ou online.
- Sem equipe administrativa; gerencia a própria agenda e cobrança.
- Fluxo de cobrança predominante: mensalidade combinada por paciente, vencimento fixo.

## Produtos deste monorepo

| App | Propósito |
|---|---|
| `apps/landing` | Página pública de marketing e captura de lista de espera (Next.js/React). |
| `apps/clinic` | Aplicação web da psicóloga no desktop (React + Mantine). |
| `apps/mobile` | App companion da psicóloga no celular (Flutter). |
| `apps/api` | Backend único: autenticação, persistência, autorização, regras de negócio e assincronicidade (Spring Boot + Axon). |

## Dentro do escopo do MVP

### Landing
- Reconstrução fiel (pixel-perfect) da referência `project/PsiOps Landing.html`
  como componentes React semânticos (nunca conversão direta de HTML para JSX).
- Captura de lead (nome, WhatsApp, e-mail) com validação e estado de sucesso.

### Aplicação clínica web (apps/clinic)
- Autenticação (registro, login, sessão com refresh).
- Onboarding pós-registro (perfil, valor padrão de sessão, horários, preferências de lembrete).
- Dashboard (dia atual: consultas, pendências financeiras, tarefas).
- Pacientes: cadastro, lista com busca, arquivamento.
- Detalhe do paciente com histórico de consultas, registros e situação financeira.
- Agenda: visão semanal/diária, criação, remarcação, cancelamento, conflito de horário,
  recorrência semanal simples.
- Consultas com registro administrativo (compareceu, faltou, remarcada, anotações administrativas).
- Organização financeira: mensalidades por status (em dia, pendente, atrasada),
  geração mensal, marcação de pagamento, calculadora de juros simples.
- Tarefas e lembretes (canal inicial: e-mail).
- Configurações.

### App mobile (apps/mobile) — companion
Subconjunto focado no dia a dia fora do consultório:
- Autenticação e sessão.
- Dashboard do dia (consultas, pendências, tarefas).
- Agenda (visões diária/semanal; criar, remarcar, cancelar).
- Pacientes (lista, detalhe com histórico e situação financeira, cadastro/edição).
- Financeiro (mensalidades por status, marcar paga, gerar mês).
- Configurações mínimas (perfil, valor padrão, preferências de lembrete, logout).

Fica **fora do mobile no MVP**: onboarding completo (feito na web), registros
administrativos detalhados e relatórios. Push notification fica fora (lembretes por e-mail).

### Backend (apps/api — Spring Boot + Axon)
- Módulos correspondentes a cada capacidade acima, multi-tenant por `userId`.
- Endpoint público de leads para a landing.
- Assincronicidade interna via Axon: eventos de domínio, deadlines de lembrete
  (véspera e dia da consulta), verificação diária de cobranças vencidas e
  envio de e-mail (SMTP; Mailpit em desenvolvimento).

## Fora do escopo do MVP

- **Qualquer funcionalidade clínica**: prontuário, evolução terapêutica, diagnóstico,
  anotações de sessão de conteúdo clínico.
- **Proibido de forma permanente**: diagnóstico automático, recomendações clínicas
  ou decisões de saúde baseadas em IA.
- Pagamentos online (gateway, Pix automático, boleto) — apenas registro manual de pagamento.
- Envio de WhatsApp automatizado (a landing menciona lembretes; o MVP entrega e-mail;
  WhatsApp fica como evolução — ver `open_questions` nos manifestos).
- Push notifications no mobile.
- Multiusuário por clínica (equipes, secretariado, permissões).
- Event sourcing completo / Axon Server (agregados state-stored no MVP — ADR 0007).
- Relatórios fiscais/contábeis, emissão de nota fiscal.
- Internacionalização (produto é pt-BR, moeda BRL).

## Restrições transversais

- Dinheiro sempre em **centavos (inteiro)**, moeda BRL.
- Datas/horas em ISO 8601; fuso de referência America/Sao_Paulo (premissa registrada).
- Contratos em `packages/contracts` (OpenAPI 3.1) são a única fonte de DTOs;
  codegen comitado para TS, Java e Dart (ADR 0008). Proibido duplicar DTOs.
- Dados pessoais tratados sob a ótica da LGPD: coleta mínima, arquivamento em vez de
  exclusão física registrado como decisão a revisar (direito de eliminação — open question
  de produto na PSI-023).

## Critério de sucesso do MVP

Uma psicóloga consegue: registrar-se → completar onboarding (web) → cadastrar
pacientes → montar a agenda da semana → registrar presença/falta → gerar as
mensalidades do mês → ver quem está em atraso → receber lembretes por e-mail —
tudo verificado por testes E2E na web (Playwright) — e, pelo celular, consultar o
dia, remarcar uma consulta e marcar uma mensalidade como paga — verificado por
`integration_test` do Flutter contra a API real.
