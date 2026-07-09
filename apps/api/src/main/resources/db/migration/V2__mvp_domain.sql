-- V2 — domínio do MVP + tabelas exigidas pelo Axon Framework.
--
-- IMUTÁVEL após o merge (ADR 0009), como a V1: correções vêm em novas
-- migrations, nunca editando este arquivo.
--
-- Convenções (mesmas da V1):
--   * identificadores UUID gerados pela aplicação (sem DEFAULT no banco);
--   * instantes em TIMESTAMPTZ (ISO 8601, UTC); datas civis em DATE;
--   * valores monetários SEMPRE BIGINT em centavos (nunca ponto flutuante).
--
-- Multi-tenant estrito: toda tabela de domínio carrega user_id NOT NULL,
-- referenciando users(id) da V1, com índice próprio (e índices compostos por
-- período onde a listagem por intervalo é um caso de uso central: agenda por
-- horário, cobranças por competência/vencimento).
--
-- session_records contém SOMENTE dado administrativo (compareceu/faltou/
-- remarcada + anotação administrativa) — decisão de produto inviolável, sem
-- nenhuma coluna de diagnóstico, evolução ou prontuário.

-- =============================================================================
-- Domínio: patients
-- =============================================================================
CREATE TABLE patients (
    id                 UUID          NOT NULL,
    user_id            UUID          NOT NULL,
    name               VARCHAR(120)  NOT NULL,
    whatsapp           VARCHAR(14),
    email              VARCHAR(254),
    monthly_fee_cents  BIGINT        NOT NULL,
    billing_day        INTEGER       NOT NULL,
    status             VARCHAR(20)   NOT NULL,
    notes              VARCHAR(2000),
    created_at         TIMESTAMPTZ   NOT NULL,
    CONSTRAINT pk_patients PRIMARY KEY (id),
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT chk_patients_billing_day CHECK (billing_day BETWEEN 1 AND 28)
);

CREATE INDEX idx_patients_user_id ON patients (user_id);
CREATE INDEX idx_patients_user_status ON patients (user_id, status);

-- =============================================================================
-- Domínio: appointments
-- =============================================================================
CREATE TABLE appointments (
    id                   UUID         NOT NULL,
    user_id              UUID         NOT NULL,
    patient_id           UUID         NOT NULL,
    starts_at            TIMESTAMPTZ  NOT NULL,
    duration_minutes     INTEGER      NOT NULL,
    recurrence_weekday   VARCHAR(10),
    recurrence_interval  INTEGER,
    recurrence_until     DATE,
    status               VARCHAR(20)  NOT NULL,
    created_at           TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_appointments PRIMARY KEY (id),
    CONSTRAINT fk_appointments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients (id)
);

-- Índice composto por período: base da listagem de agenda (usuária + intervalo
-- de horário).
CREATE INDEX idx_appointments_user_starts_at ON appointments (user_id, starts_at);
CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);

-- =============================================================================
-- Domínio: session_records (SOMENTE dado administrativo, ver cabeçalho)
-- =============================================================================
CREATE TABLE session_records (
    id                     UUID         NOT NULL,
    user_id                UUID         NOT NULL,
    appointment_id         UUID         NOT NULL,
    attendance             VARCHAR(20)  NOT NULL,
    administrative_notes   VARCHAR(2000),
    recorded_at            TIMESTAMPTZ,
    created_at             TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_session_records PRIMARY KEY (id),
    CONSTRAINT uq_session_records_appointment UNIQUE (appointment_id),
    CONSTRAINT fk_session_records_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_session_records_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id)
);

CREATE INDEX idx_session_records_user_id ON session_records (user_id);

-- =============================================================================
-- Domínio: charges
-- =============================================================================
CREATE TABLE charges (
    id                              UUID          NOT NULL,
    user_id                         UUID          NOT NULL,
    patient_id                      UUID          NOT NULL,
    competence                      VARCHAR(7)    NOT NULL,
    amount_cents                    BIGINT        NOT NULL,
    due_date                        DATE          NOT NULL,
    status                          VARCHAR(20)   NOT NULL,
    interest_monthly_rate_percent   DOUBLE PRECISION,
    interest_fine_percent           DOUBLE PRECISION,
    paid_amount_cents                BIGINT,
    paid_at                          TIMESTAMPTZ,
    payment_method                   VARCHAR(20),
    payment_note                     VARCHAR(500),
    created_at                      TIMESTAMPTZ   NOT NULL,
    CONSTRAINT pk_charges PRIMARY KEY (id),
    CONSTRAINT fk_charges_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_charges_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT chk_charges_competence CHECK (competence ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

-- Índices compostos por período: bases das listagens de cobrança por
-- competência (mensalidade do mês) e por vencimento (inadimplência).
CREATE INDEX idx_charges_user_competence ON charges (user_id, competence);
CREATE INDEX idx_charges_user_due_date ON charges (user_id, due_date);
CREATE INDEX idx_charges_patient_id ON charges (patient_id);

-- =============================================================================
-- Domínio: tasks
-- =============================================================================
CREATE TABLE tasks (
    id            UUID         NOT NULL,
    user_id       UUID         NOT NULL,
    title         VARCHAR(200) NOT NULL,
    due_date      DATE,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_tasks PRIMARY KEY (id),
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_tasks_user_id ON tasks (user_id);
CREATE INDEX idx_tasks_user_due_date ON tasks (user_id, due_date);

-- =============================================================================
-- Domínio: reminders
-- =============================================================================
CREATE TABLE reminders (
    id              UUID         NOT NULL,
    user_id         UUID         NOT NULL,
    channel         VARCHAR(20)  NOT NULL,
    subject         VARCHAR(200) NOT NULL,
    body            VARCHAR(2000) NOT NULL,
    scheduled_for   TIMESTAMPTZ  NOT NULL,
    sent_at         TIMESTAMPTZ,
    status          VARCHAR(20)  NOT NULL,
    patient_id      UUID,
    appointment_id  UUID,
    charge_id       UUID,
    created_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT pk_reminders PRIMARY KEY (id),
    CONSTRAINT fk_reminders_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_reminders_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
    CONSTRAINT fk_reminders_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id),
    CONSTRAINT fk_reminders_charge FOREIGN KEY (charge_id) REFERENCES charges (id)
);

CREATE INDEX idx_reminders_user_scheduled_for ON reminders (user_id, scheduled_for);
CREATE INDEX idx_reminders_patient_id ON reminders (patient_id);
CREATE INDEX idx_reminders_appointment_id ON reminders (appointment_id);
CREATE INDEX idx_reminders_charge_id ON reminders (charge_id);

-- =============================================================================
-- Axon Framework (PSI-011): event store, token store, saga store e dead
-- letter queue JPA embutidos (sem Axon Server). A V1 não criou nenhuma
-- dessas tabelas (ver cabeçalho da V1). DDL obtida de forma determinística:
-- exportada via jakarta.persistence.schema-generation.scripts.action=create
-- (Hibernate 6.5.3, Axon 4.13.2, PostgreSQL 16.9) a partir das próprias
-- entidades JPA do Axon já em uso pela aplicação (ver
-- com.psiops.api.axon.config), e transcrita aqui ajustada às convenções
-- deste projeto (nomes de constraint explícitos). Nenhuma coluna foi
-- inventada — a íntegra do script gerado está referenciada no PR desta
-- tarefa (PSI-021).
-- =============================================================================

-- Sequências usadas pelos identificadores gerados de duas das tabelas abaixo.
CREATE SEQUENCE domain_event_entry_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE association_value_entry_seq START WITH 1 INCREMENT BY 50;

-- Event store: eventos de domínio (JpaEventStorageEngine).
CREATE TABLE domain_event_entry (
    global_index         BIGINT        NOT NULL,
    aggregate_identifier  VARCHAR(255)  NOT NULL,
    sequence_number       BIGINT        NOT NULL,
    event_identifier      VARCHAR(255)  NOT NULL,
    payload_revision      VARCHAR(255),
    payload_type          VARCHAR(255)  NOT NULL,
    "time_stamp"          VARCHAR(255)  NOT NULL,
    type                  VARCHAR(255),
    meta_data             OID,
    payload               OID           NOT NULL,
    CONSTRAINT pk_domain_event_entry PRIMARY KEY (global_index),
    CONSTRAINT uq_domain_event_entry_event_identifier UNIQUE (event_identifier),
    CONSTRAINT uq_domain_event_entry_aggregate_sequence UNIQUE (aggregate_identifier, sequence_number)
);

-- Event store: snapshots de agregados (opcional no MVP, ver PSI-011 out_of_scope
-- — a tabela é criada porque a entidade JPA do Axon é registrada de qualquer
-- forma; snapshotting em si não é usado nesta fase).
CREATE TABLE snapshot_event_entry (
    sequence_number       BIGINT        NOT NULL,
    aggregate_identifier  VARCHAR(255)  NOT NULL,
    type                  VARCHAR(255)  NOT NULL,
    event_identifier      VARCHAR(255)  NOT NULL,
    payload_revision      VARCHAR(255),
    payload_type          VARCHAR(255)  NOT NULL,
    "time_stamp"          VARCHAR(255)  NOT NULL,
    meta_data             OID,
    payload               OID           NOT NULL,
    CONSTRAINT pk_snapshot_event_entry PRIMARY KEY (sequence_number, aggregate_identifier, type),
    CONSTRAINT uq_snapshot_event_entry_event_identifier UNIQUE (event_identifier)
);

-- Token store: progresso dos tracking event processors (JpaTokenStore).
CREATE TABLE token_entry (
    processor_name  VARCHAR(255)  NOT NULL,
    segment         INTEGER       NOT NULL,
    owner           VARCHAR(255),
    "timestamp"     VARCHAR(255)  NOT NULL,
    token_type      VARCHAR(255),
    token           OID,
    CONSTRAINT pk_token_entry PRIMARY KEY (segment, processor_name)
);

-- Saga store: sagas persistidas (JpaSagaStore; nenhuma saga é implementada
-- nesta fase, mas a infraestrutura é registrada pela autoconfiguração do Axon).
CREATE TABLE saga_entry (
    saga_id           VARCHAR(255)  NOT NULL,
    revision          VARCHAR(255),
    saga_type         VARCHAR(255),
    serialized_saga   OID,
    CONSTRAINT pk_saga_entry PRIMARY KEY (saga_id)
);

CREATE TABLE association_value_entry (
    id                  BIGINT        NOT NULL,
    association_key     VARCHAR(255)  NOT NULL,
    association_value   VARCHAR(255),
    saga_id             VARCHAR(255)  NOT NULL,
    saga_type           VARCHAR(255),
    CONSTRAINT pk_association_value_entry PRIMARY KEY (id)
);

CREATE INDEX idx_association_value_entry_saga_lookup
    ON association_value_entry (saga_type, association_key, association_value);
CREATE INDEX idx_association_value_entry_saga
    ON association_value_entry (saga_id, saga_type);

-- Dead letter queue: mensagens de event processors que falharam
-- repetidamente (JpaSequencedDeadLetterQueue).
CREATE TABLE dead_letter_entry (
    dead_letter_id        VARCHAR(255)  NOT NULL,
    sequence_identifier   VARCHAR(255)  NOT NULL,
    sequence_index        BIGINT        NOT NULL,
    processing_group      VARCHAR(255)  NOT NULL,
    event_identifier      VARCHAR(255)  NOT NULL,
    message_type          VARCHAR(255)  NOT NULL,
    payload_type          VARCHAR(255)  NOT NULL,
    payload_revision      VARCHAR(255),
    type                  VARCHAR(255),
    "time_stamp"          VARCHAR(255)  NOT NULL,
    token_type            VARCHAR(255),
    aggregate_identifier  VARCHAR(255),
    cause_type            VARCHAR(255),
    cause_message         VARCHAR(1023),
    enqueued_at           TIMESTAMPTZ   NOT NULL,
    last_touched          TIMESTAMPTZ,
    processing_started    TIMESTAMPTZ,
    sequence_number       BIGINT,
    diagnostics           OID,
    meta_data             OID,
    payload               OID           NOT NULL,
    token                 OID,
    CONSTRAINT pk_dead_letter_entry PRIMARY KEY (dead_letter_id),
    CONSTRAINT uq_dead_letter_entry_sequence UNIQUE (processing_group, sequence_identifier, sequence_index)
);

CREATE INDEX idx_dead_letter_entry_processing_group ON dead_letter_entry (processing_group);
CREATE INDEX idx_dead_letter_entry_group_sequence ON dead_letter_entry (processing_group, sequence_identifier);

-- =============================================================================
-- Suporte ao agregado exemplo do Axon (com.psiops.api.axonsample, PSI-011)
-- =============================================================================
-- SampleTaskAggregate é uma entidade JPA state-stored comum (não é
-- infraestrutura do Axon nem tabela de domínio do MVP desta tarefa) que já
-- existe no código desde a PSI-011 como gabarito de agregado. Como todas as
-- entidades JPA da aplicação compartilham a mesma unidade de persistência,
-- sem esta tabela o Hibernate em ddl-auto=validate falha para a aplicação
-- inteira (não só para o fluxo de exemplo). Criada aqui para que V1+V2
-- casem exatamente com TODAS as entidades JPA existentes — decisão registrada
-- como assumption no PR da PSI-021.
CREATE TABLE sample_task_aggregate (
    task_id             VARCHAR(255)  NOT NULL,
    title               VARCHAR(255),
    reminder_scheduled  BOOLEAN       NOT NULL,
    reminder_due        BOOLEAN       NOT NULL,
    CONSTRAINT pk_sample_task_aggregate PRIMARY KEY (task_id)
);
