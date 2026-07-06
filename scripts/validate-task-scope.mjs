#!/usr/bin/env node
/**
 * Valida manifestos de tarefa (tasks/PSI-0NN.yaml) e o escopo de arquivos de uma branch.
 *
 * Modos:
 *   node scripts/validate-task-scope.mjs --lint-all
 *     Valida estrutura, unicidade, grafo de dependências (existência + ausência de
 *     ciclos) e coerência de caminhos de todos os manifestos.
 *
 *   node scripts/validate-task-scope.mjs --task PSI-013 --base origin/main
 *     Compara o diff (merge-base entre --base e HEAD) com allowed_paths e
 *     forbidden_paths do manifesto. Proibição vence permissão.
 *
 * Sem dependências externas: usa um parser do subconjunto restrito de YAML
 * definido em tasks/_FORMAT.md (chaves raiz, escalares, blocos "|", listas de
 * strings, listas vazias []). Mapas aninhados são rejeitados de propósito.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TASKS_DIR = join(ROOT, 'tasks');

const REQUIRED_KEYS = [
  'id', 'title', 'project', 'shared_change', 'branch', 'commit_message',
  'pr_title', 'description', 'dependencies', 'allowed_paths', 'forbidden_paths',
  'acceptance_criteria', 'validation_commands', 'risks', 'out_of_scope',
  'assumptions', 'open_questions',
];

const LIST_KEYS = new Set([
  'dependencies', 'allowed_paths', 'forbidden_paths', 'acceptance_criteria',
  'validation_commands', 'risks', 'out_of_scope', 'assumptions', 'open_questions',
]);

// Caminhos proibidos por padrão para tarefas sem shared_change.
const SHARED_PATHS = [
  'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'turbo.json',
  '.github/workflows/**', 'packages/contracts/**', '**/db/migration/**',
];
// Sempre proibidos, para qualquer tarefa.
const ALWAYS_FORBIDDEN = ['project/**', 'tasks/**'];

// ---------------------------------------------------------------------------
// Parser do subconjunto restrito de YAML
// ---------------------------------------------------------------------------

function unquote(raw) {
  const s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseManifest(text, file) {
  const doc = {};
  const lines = text.split('\n');
  let i = 0;
  const fail = (msg, ln) => {
    throw new Error(`${file}:${(ln ?? i) + 1}: ${msg}`);
  };

  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*(#|$)/.test(line)) { i += 1; continue; }
    if (/^\s/.test(line)) fail('conteúdo indentado sem chave correspondente');

    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):(.*)$/);
    if (!m) fail(`linha inválida: ${JSON.stringify(line)}`);
    const key = m[1];
    let rest = m[2].replace(/\s+#.*$/, '').trim();
    if (key in doc) fail(`chave duplicada: ${key}`);

    if (rest === '|' || rest === '>') {
      // Bloco literal/dobrado: linhas seguintes indentadas com 2+ espaços.
      const block = [];
      i += 1;
      while (i < lines.length && (/^\s{2,}/.test(lines[i]) || lines[i].trim() === '')) {
        if (lines[i].trim() === '' && !(i + 1 < lines.length && /^\s{2,}/.test(lines[i + 1]))) break;
        block.push(lines[i].replace(/^ {2}/, ''));
        i += 1;
      }
      doc[key] = block.join(rest === '|' ? '\n' : ' ').trim();
      continue;
    }

    if (rest === '[]') { doc[key] = []; i += 1; continue; }

    if (rest === '') {
      // Lista de strings.
      const list = [];
      i += 1;
      while (i < lines.length) {
        const item = lines[i];
        if (/^\s*(#|$)/.test(item)) { i += 1; continue; }
        const im = item.match(/^\s{2,}- (.*)$/);
        if (!im) break;
        const value = im[1].trim();
        if (value.endsWith(':') || /^[A-Za-z_]+:\s/.test(value)) {
          fail('mapas aninhados não são permitidos no subconjunto restrito', i);
        }
        list.push(unquote(value));
        i += 1;
      }
      if (list.length === 0) fail(`chave "${key}" sem valor (use [] para lista vazia)`);
      doc[key] = list;
      continue;
    }

    if (rest === 'true' || rest === 'false') { doc[key] = rest === 'true'; i += 1; continue; }
    doc[key] = unquote(rest);
    i += 1;
  }
  return doc;
}

// ---------------------------------------------------------------------------
// Glob simplificado: **, *, ? — suficiente para os manifestos.
// ---------------------------------------------------------------------------

function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // "**" cruza barras; "**/" também casa com prefixo vazio.
        if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

const matchesAny = (path, globs) => globs.some((g) => globToRegExp(g).test(path));

// ---------------------------------------------------------------------------
// Validação estrutural de um manifesto
// ---------------------------------------------------------------------------

function validateManifest(doc, file) {
  const errors = [];
  const err = (msg) => errors.push(`${file}: ${msg}`);

  for (const key of REQUIRED_KEYS) {
    if (!(key in doc)) err(`chave obrigatória ausente: ${key}`);
  }
  for (const key of Object.keys(doc)) {
    if (!REQUIRED_KEYS.includes(key)) err(`chave desconhecida: ${key}`);
    if (LIST_KEYS.has(key) && !Array.isArray(doc[key])) err(`"${key}" deve ser lista`);
  }
  if (errors.length > 0) return errors;

  if (!/^PSI-\d{3}$/.test(doc.id)) err(`id inválido: ${doc.id}`);
  if (!file.endsWith(`${doc.id}.yaml`)) err(`id ${doc.id} não corresponde ao nome do arquivo`);
  if (typeof doc.shared_change !== 'boolean') err('shared_change deve ser true ou false');
  if (!/^agent\/psi-\d{3}-[a-z0-9-]+$/.test(doc.branch)) err(`branch fora do padrão agent/psi-0nn-slug: ${doc.branch}`);
  if (!doc.commit_message.includes(`[${doc.id}]`)) err(`commit_message sem sufixo [${doc.id}]`);
  if (!doc.pr_title.startsWith(`${doc.id}:`)) err(`pr_title deve começar com "${doc.id}:"`);
  if (doc.allowed_paths.length === 0) err('allowed_paths não pode ser vazio');
  if (doc.acceptance_criteria.length === 0) err('acceptance_criteria não pode ser vazio');
  if (doc.validation_commands.length === 0) err('validation_commands não pode ser vazio');
  for (const dep of doc.dependencies) {
    if (!/^PSI-\d{3}$/.test(dep)) err(`dependência inválida: ${dep}`);
  }

  const overlap = doc.allowed_paths.filter((p) => doc.forbidden_paths.includes(p));
  if (overlap.length > 0) err(`caminhos em allowed e forbidden ao mesmo tempo: ${overlap.join(', ')}`);

  for (const p of ALWAYS_FORBIDDEN) {
    if (!doc.forbidden_paths.includes(p)) err(`forbidden_paths deve incluir "${p}"`);
  }
  if (doc.shared_change === false) {
    for (const p of SHARED_PATHS) {
      if (doc.allowed_paths.includes(p)) err(`tarefa sem shared_change não pode permitir "${p}"`);
      if (!doc.forbidden_paths.includes(p)) err(`forbidden_paths deve incluir "${p}" (shared_change: false)`);
    }
  }
  return errors;
}

function loadAllManifests() {
  const files = readdirSync(TASKS_DIR)
    .filter((f) => /^PSI-\d{3}\.yaml$/.test(f))
    .sort();
  return files.map((f) => {
    const text = readFileSync(join(TASKS_DIR, f), 'utf8');
    return { file: `tasks/${f}`, doc: parseManifest(text, `tasks/${f}`) };
  });
}

function lintAll() {
  const manifests = loadAllManifests();
  const errors = [];
  if (manifests.length === 0) errors.push('nenhum manifesto encontrado em tasks/');

  const byId = new Map();
  for (const { file, doc } of manifests) {
    errors.push(...validateManifest(doc, file));
    if (byId.has(doc.id)) errors.push(`${file}: id duplicado ${doc.id}`);
    byId.set(doc.id, doc);
  }

  // Dependências existem e o grafo é acíclico.
  for (const { file, doc } of manifests) {
    for (const dep of doc.dependencies ?? []) {
      if (!byId.has(dep)) errors.push(`${file}: dependência inexistente ${dep}`);
      if (dep === doc.id) errors.push(`${file}: depende de si mesma`);
    }
  }
  const state = new Map(); // 0 visitando, 1 concluído
  const visit = (id, trail) => {
    if (state.get(id) === 1) return;
    if (state.get(id) === 0) {
      errors.push(`ciclo de dependências: ${[...trail, id].join(' -> ')}`);
      return;
    }
    state.set(id, 0);
    for (const dep of byId.get(id)?.dependencies ?? []) {
      if (byId.has(dep)) visit(dep, [...trail, id]);
    }
    state.set(id, 1);
  };
  for (const id of byId.keys()) visit(id, []);

  return { errors, count: manifests.length };
}

// ---------------------------------------------------------------------------
// Validação de diff
// ---------------------------------------------------------------------------

function changedFiles(baseRef) {
  const mergeBase = execFileSync('git', ['merge-base', baseRef, 'HEAD'], { cwd: ROOT })
    .toString().trim();
  const out = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { cwd: ROOT })
    .toString().trim();
  return out === '' ? [] : out.split('\n');
}

function validateDiff(taskId, baseRef) {
  const file = `tasks/${taskId}.yaml`;
  const text = readFileSync(join(ROOT, file), 'utf8');
  const doc = parseManifest(text, file);
  const structural = validateManifest(doc, file);
  if (structural.length > 0) return structural;

  const errors = [];
  for (const changed of changedFiles(baseRef)) {
    if (matchesAny(changed, doc.forbidden_paths)) {
      errors.push(`${changed}: casa com forbidden_paths de ${taskId} (proibição vence)`);
    } else if (!matchesAny(changed, doc.allowed_paths)) {
      errors.push(`${changed}: fora de allowed_paths de ${taskId}`);
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx === -1 ? undefined : args[idx + 1];
  };

  try {
    if (args.includes('--lint-all')) {
      const { errors, count } = lintAll();
      if (errors.length > 0) {
        console.error(`FALHOU: ${errors.length} problema(s) em ${count} manifesto(s):\n`);
        for (const e of errors) console.error(`  - ${e}`);
        process.exit(1);
      }
      console.log(`OK: ${count} manifestos válidos, grafo de dependências íntegro.`);
      return;
    }

    const task = get('--task');
    if (task) {
      const base = get('--base') ?? 'origin/main';
      const errors = validateDiff(task, base);
      if (errors.length > 0) {
        console.error(`FALHOU: escopo de ${task} violado:\n`);
        for (const e of errors) console.error(`  - ${e}`);
        process.exit(1);
      }
      console.log(`OK: diff dentro do escopo de ${task}.`);
      return;
    }

    console.error('Uso: validate-task-scope.mjs --lint-all | --task PSI-0NN [--base ref]');
    process.exit(2);
  } catch (e) {
    console.error(`ERRO: ${e.message}`);
    process.exit(1);
  }
}

main();
