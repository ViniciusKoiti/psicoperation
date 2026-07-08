-- V1 — esquema inicial do PsiOps.
--
-- Tabelas alinhadas aos contratos de auth (User) e lead (Lead) da PSI-005.
-- IMUTÁVEL após o merge (ADR 0009): correções vêm em novas migrations, nunca
-- editando este arquivo.
--
-- Convenções:
--   * identificadores UUID gerados pela aplicação (sem DEFAULT no banco);
--   * instantes em TIMESTAMPTZ (ISO 8601, UTC);
--   * valores monetários, quando existirem, serão BIGINT em centavos (nunca
--     ponto flutuante) — ainda não há colunas de dinheiro nesta V1.

-- Conta da psicóloga (schema User + hash de senha, que só existe no storage).
CREATE TABLE users (
    id            UUID         NOT NULL,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(254) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Configurações da conta (1‑para‑1 com users). Colunas de negócio chegam em
-- migrations futuras, junto do contrato de settings; aqui só o vínculo.
CREATE TABLE settings (
    id         UUID        NOT NULL,
    user_id    UUID        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_settings PRIMARY KEY (id),
    CONSTRAINT uq_settings_user UNIQUE (user_id),
    CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Lead da lista de espera da landing (schema Lead). whatsapp em E.164 (+55...).
CREATE TABLE leads (
    id         UUID         NOT NULL,
    name       VARCHAR(120) NOT NULL,
    whatsapp   VARCHAR(14)  NOT NULL,
    email      VARCHAR(254) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_leads PRIMARY KEY (id),
    CONSTRAINT uq_leads_email UNIQUE (email)
);
