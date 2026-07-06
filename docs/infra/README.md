# Infraestrutura local (Docker Compose)

Ambiente de desenvolvimento do PsiOps, definido em `docker-compose.yml` na raiz
do repositório. Dois serviços — e só dois (sem Redis, fila ou broker; a
assincronicidade vive dentro do backend via Axon, ADRs 0007/0009):

| Serviço    | Imagem                 | Portas (host, default)      | Para quê                                             |
| ---------- | ---------------------- | --------------------------- | ---------------------------------------------------- |
| `postgres` | `postgres:16.9-alpine` | `5432`                      | Banco único: tabelas JPA + event store do Axon       |
| `mailpit`  | `axllent/mailpit:v1.24`| `1025` (SMTP), `8025` (UI)  | Captura de e-mails transacionais em desenvolvimento  |

Ambos declaram healthcheck (`pg_isready` no PostgreSQL, HTTP `readyz` no
Mailpit), então dependências futuras podem usar `condition: service_healthy`.

## Pré-requisitos

Docker Engine com Compose v2+ (`docker compose`, sem hífen).

## Configuração

Credenciais e portas são parametrizadas por variáveis de ambiente com defaults
sensatos — sem configuração alguma, tudo funciona. Para customizar (por
exemplo, se a porta 5432 já estiver ocupada na sua máquina):

```bash
cp .env.example .env   # edite os valores desejados
```

Cada variável está documentada em [`.env.example`](../../.env.example).

## Subir

```bash
docker compose up -d
docker compose ps        # aguarde ambos ficarem "healthy"
```

- PostgreSQL: `postgresql://psiops:psiops@localhost:5432/psiops` (defaults)
- Mailpit UI: <http://localhost:8025> — todo e-mail enviado para
  `localhost:1025` (SMTP) aparece aqui.

## Derrubar

```bash
docker compose down
```

Os dados **sobrevivem**: PostgreSQL e Mailpit persistem nos volumes nomeados
`psiops_pgdata` e `psiops_mailpit-data`.

## Resetar os dados

Para voltar ao estado zero (apaga banco e e-mails capturados):

```bash
docker compose down -v
docker compose up -d
```

## Ver logs

```bash
docker compose logs -f postgres
docker compose logs -f mailpit
```
