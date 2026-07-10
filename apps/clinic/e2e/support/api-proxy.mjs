#!/usr/bin/env node
/* global process, Buffer, fetch, Headers */
// O preset ESLint de apps/clinic (`@psiops/config/eslint`, `react`) é
// focado em código de navegador (React/Vite) e não declara os globals do
// runtime Node — este script roda só via `node`, nunca empacotado pelo
// Vite (fora de `src/**`), então a diretiva acima é o jeito correto de
// dizer isso ao ESLint sem desligar `no-undef` para o resto do arquivo.
/**
 * Proxy reverso local com CORS, usado só pela suíte E2E do clinic
 * (PSI-044) para falar com a API Spring real a partir do navegador.
 *
 * POR QUE ISSO EXISTE: a API (`apps/api`, `SecurityConfig`) não configura
 * `CorsConfigurationSource` nenhum — de propósito, é uma API stateless sem
 * CORS pensada para ser servida atrás de um proxy que compartilhe origem
 * com o front (o próprio default `VITE_API_BASE_URL ?? "/api"`, um caminho
 * RELATIVO, já sugere isso). Rodar o clinic como SPA em `vite dev`/`preview`
 * numa porta e a API Spring em outra faz do navegador uma chamada
 * cross-origin sem os headers `Access-Control-Allow-*` — o preflight
 * `OPTIONS` de qualquer `POST`/`PUT`/`DELETE` com `Content-Type:
 * application/json` (login, registrar paciente, agendar consulta, ...)
 * falharia silenciosamente no navegador.
 *
 * Alterar isso na API (`apps/api`) ou no `vite.config.ts` do clinic
 * (adicionando `server.proxy`) está fora de `allowed_paths` desta tarefa
 * (só `apps/clinic/src/adapters/**`/`apps/clinic/e2e/**` são permitidos) —
 * ver o open_question registrado no PR. Este script fecha a lacuna dentro
 * do escopo permitido: só usado pela suíte E2E local, nunca em produção.
 *
 * Comportamento: encaminha QUALQUER requisição recebida em `PROXY_PORT`
 * para `API_TARGET_URL` (mesmo método, path, query, headers e corpo),
 * adicionando `Access-Control-Allow-Origin`/`-Methods`/`-Headers` na
 * resposta e respondendo `OPTIONS` (preflight) diretamente com 204 — sem
 * nunca repassar o preflight à API real. `GET /__proxy_health` responde
 * 200 sem tocar a API (usado pelo `webServer` do Playwright para saber que
 * o PROCESSO do proxy subiu; a prontidão da API em si é checada à parte
 * pelo orquestrador de infra, ver `e2e/README.md`).
 *
 * Sem dependências novas: só módulos nativos do Node (`node:http`) e
 * `fetch` global (Node >= 18).
 */

import { createServer } from "node:http";

const PROXY_PORT = Number(process.env.PROXY_PORT ?? 8081);
const API_TARGET_URL = (process.env.API_TARGET_URL ?? "http://localhost:8080").replace(/\/+$/, "");
// "*" é seguro aqui: este proxy só roda em localhost, só durante a suíte
// E2E, e nunca carrega cookies/credenciais de navegador (a sessão do
// clinic usa Bearer token em memória, nunca cookie — ver SessionManager).
const ALLOW_ORIGIN = process.env.PROXY_ALLOW_ORIGIN ?? "*";

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "600");
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.url === "/__proxy_health") {
    setCorsHeaders(res);
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }

  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    // Preflight: respondido aqui mesmo, nunca repassado à API real.
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readRequestBody(req);
    const targetUrl = `${API_TARGET_URL}${req.url}`;

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      // "host"/"connection" são específicos da conexão cliente↔proxy; não
      // devem ser repassados à conexão proxy↔API.
      if (name === "host" || name === "connection") continue;
      if (Array.isArray(value)) {
        for (const v of value) headers.append(name, v);
      } else if (value !== undefined) {
        headers.set(name, value);
      }
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body && body.length > 0 ? body : undefined,
    });

    const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
    res.statusCode = upstreamResponse.status;
    upstreamResponse.headers.forEach((value, name) => {
      // Evita duplicar os headers CORS já setados acima e não repassa
      // "content-encoding"/"transfer-encoding" (o corpo já foi
      // descomprimido/consolidado por `fetch` acima).
      if (/^access-control-/i.test(name)) return;
      if (name === "content-encoding" || name === "transfer-encoding") return;
      res.setHeader(name, value);
    });
    res.end(responseBody);
  } catch (error) {
    setCorsHeaders(res);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        title: "Bad Gateway",
        detail: `Proxy E2E não conseguiu alcançar a API real em ${API_TARGET_URL}: ${String(error)}`,
      }),
    );
  }
});

server.listen(PROXY_PORT, () => {
  process.stdout.write(
    `[api-proxy] ouvindo em http://localhost:${PROXY_PORT}, encaminhando para ${API_TARGET_URL}\n`,
  );
});
