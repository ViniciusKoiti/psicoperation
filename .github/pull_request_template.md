# PSI-0NN — <título da tarefa>

## Objetivo

<!-- O que este PR entrega e por quê. Copie/adapte a description do manifesto. -->

## Manifesto e dependências

- Manifesto: `tasks/PSI-0NN.yaml`
- Dependências (todas integradas à main): <!-- PSI-0XX, PSI-0YY ou "nenhuma" -->
- `shared_change`: <!-- true/false -->

## Arquivos alterados

<!-- Lista dos caminhos tocados. Todos devem casar com allowed_paths do manifesto. -->

## Decisões técnicas

<!-- Escolhas relevantes e alternativas descartadas. Referencie ADRs quando aplicável. -->

## Critérios de aceite

<!-- Copie cada acceptance_criteria do manifesto e marque: -->
- [ ] <critério 1> — <como foi demonstrado>
- [ ] <critério 2> — <como foi demonstrado>

## Testes

- Comandos executados: <!-- validation_commands do manifesto + extras -->
- Resultado: <!-- colar resumo da saída: N passed, 0 failed -->

## Screenshots

<!-- Obrigatório quando houver UI. Desktop e mobile (390px) quando relevante. -->

## Migrations

<!-- "Nenhuma" ou: nome da migration, o que altera, confirmação de que é sequencial
     e não modifica migrations anteriores. -->

## Riscos e limitações

<!-- Riscos do manifesto revisitados + limitações conhecidas desta implementação. -->

## Assumptions / open questions

<!-- Premissas assumidas e perguntas abertas registradas durante a execução. -->

## Validação manual

<!-- Passo a passo para um revisor reproduzir localmente:
     1. docker compose up -d
     2. pnpm install && ...
-->

## Checklist de conformidade

- [ ] `node scripts/validate-task-scope.mjs --task PSI-0NN --base origin/main` passou
- [ ] Lint, typecheck, testes e build verdes
- [ ] Nenhum arquivo fora de `allowed_paths`
- [ ] Nenhum código temporário (TODO de implementação, console.log, código morto)
- [ ] Nenhum secret ou credencial
- [ ] Nenhum mock acidentalmente alcançável em build de produção
- [ ] DTOs importados de `@psiops/contracts` (nenhum duplicado)
- [ ] Sem refatorações fora do escopo da tarefa
