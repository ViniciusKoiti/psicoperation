# PsiOps — Escopo do MVP

## Visão

PsiOps é um SaaS de gestão financeira e administrativa para **psicólogas solo brasileiras**,
com foco em **mensalidades** (cobrança recorrente mensal por paciente). O produto reduz o
trabalho manual de cobrar, lembrar e organizar a rotina administrativa do consultório.

## Público

- Psicóloga autônoma, atendendo em consultório próprio ou online.
- Sem equipe administrativa; gerencia a própria agenda e cobrança.
- Fluxo de cobrança predominante: mensalidade combinada por paciente, vencimento fixo.

## Produtos deste monorepo

| App | Propósito |
|---|---|
| `apps/landing` | Página pública de marketing e captura de lista de espera (waitlist). |
| `apps/clinic` | Aplicação usada pela psicóloga no dia a dia. |
| `apps/api` | Backend: autenticação, persistência, autorização, regras de negócio. |
| `apps/automation` | Processamento assíncrono: filas, lembretes, e-mail, integrações. |

## Dentro do escopo do MVP

### Landing
- Reconstrução fiel (pixel-perfect) da referência `project/PsiOps Landing.html`
  como componentes React semânticos (nunca conversão direta de HTML para JSX).
- Captura de lead (nome, WhatsApp, e-mail) com validação e estado de sucesso.

### Aplicação clínica (apps/clinic)
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

### Backend (apps/api)
- Módulos correspondentes a cada capacidade acima, multi-tenant por `userId`.
- Endpoint público de leads para a landing.
- Publicação de eventos de domínio via tabela Outbox (consumidos pela automation).

### Automação (apps/automation)
- Lembrete de consulta (véspera e dia).
- Notificação de cobrança atrasada.
- Envio de e-mail (SMTP; Mailpit em desenvolvimento).

## Fora do escopo do MVP

- **Qualquer funcionalidade clínica**: prontuário, evolução terapêutica, diagnóstico,
  anotações de sessão de conteúdo clínico.
- **Proibido de forma permanente**: diagnóstico automático, recomendações clínicas
  ou decisões de saúde baseadas em IA.
- Pagamentos online (gateway, Pix automático, boleto) — apenas registro manual de pagamento.
- Envio de WhatsApp automatizado (a landing menciona lembretes; o MVP entrega e-mail;
  WhatsApp fica como evolução — ver `open_questions` nos manifestos).
- Multiusuário por clínica (equipes, secretariado, permissões).
- Aplicativo móvel nativo.
- Relatórios fiscais/contábeis, emissão de nota fiscal.
- Internacionalização (produto é pt-BR, moeda BRL).

## Restrições transversais

- Dinheiro sempre em **centavos (inteiro)**, moeda BRL.
- Datas/horas em ISO 8601; fuso de referência America/Sao_Paulo (premissa registrada).
- Contratos compartilhados em `packages/contracts` (Zod) são a única fonte de DTOs.
- Dados pessoais tratados sob a ótica da LGPD: coleta mínima, arquivamento em vez de
  exclusão física registrado como decisão a revisar (direito de eliminação — open question
  de produto na PSI-022).

## Critério de sucesso do MVP

Uma psicóloga consegue: registrar-se → completar onboarding → cadastrar pacientes →
montar a agenda da semana → registrar presença/falta → gerar as mensalidades do mês →
ver quem está em atraso → receber lembretes por e-mail — tudo verificado por testes E2E.
