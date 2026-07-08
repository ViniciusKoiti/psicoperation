/**
 * ARQUIVO GERADO — NÃO EDITAR MANUALMENTE.
 *
 * Fonte: packages/contracts/openapi/openapi.yaml
 * Regenerar: pnpm --filter @psiops/contracts generate
 * Drift é reprovado por tests/drift.test.ts e pelo script check:drift.
 */

export interface paths {
    "/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registra uma nova conta
         * @description Cria a conta da psicóloga e já inicia a sessão, retornando a conta criada e o par de tokens (access JWT + refresh). Endpoint público.
         */
        post: operations["registerUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Autentica com e-mail e senha
         * @description Valida as credenciais e retorna a conta autenticada com um novo par de tokens (access JWT + refresh). Endpoint público.
         */
        post: operations["loginUser"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Renova o par de tokens
         * @description Troca um refresh token válido por um novo par de tokens. O refresh token apresentado é invalidado (rotação de uso único). Endpoint público — a credencial é o próprio refresh token no corpo.
         */
        post: operations["refreshToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consulta a sessão corrente
         * @description Retorna a conta autenticada e a expiração do access token apresentado. Requer bearer token JWT válido.
         */
        get: operations["getCurrentSession"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/leads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Entra na lista de espera
         * @description Registra um lead da lista de espera capturado pelo formulário da landing page (nome, WhatsApp brasileiro em E.164 e e-mail). Endpoint público.
         */
        post: operations["createLead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lista pacientes
         * @description Lista paginada dos pacientes da psicóloga autenticada. Filtro opcional por status.
         */
        get: operations["listPatients"];
        put?: never;
        /** Cadastra paciente */
        post: operations["createPatient"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/patients/{patientId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador do paciente. */
                patientId: string;
            };
            cookie?: never;
        };
        /** Obtém um paciente */
        get: operations["getPatient"];
        /** Atualiza um paciente */
        put: operations["updatePatient"];
        post?: never;
        /**
         * Remove (arquiva) um paciente
         * @description Remove o paciente da carteira. A política de arquivamento vs. exclusão definitiva (LGPD) é decidida na implementação; o contrato expõe apenas a operação de remoção.
         */
        delete: operations["deletePatient"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lista consultas
         * @description Lista paginada de consultas da psicóloga autenticada, com filtro opcional por intervalo de datas e por paciente.
         */
        get: operations["listAppointments"];
        put?: never;
        /**
         * Agenda uma consulta
         * @description Agenda uma consulta. Se o horário conflitar com outra consulta existente, responde 409 com Problem Details.
         */
        post: operations["createAppointment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da consulta. */
                appointmentId: string;
            };
            cookie?: never;
        };
        /** Obtém uma consulta */
        get: operations["getAppointment"];
        /**
         * Remarca/edita uma consulta
         * @description Atualiza horário, duração, recorrência ou status. Um novo horário que conflite com outra consulta responde 409 com Problem Details.
         */
        put: operations["updateAppointment"];
        post?: never;
        /** Cancela uma consulta */
        delete: operations["cancelAppointment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/appointments/{appointmentId}/attendance": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da consulta. */
                appointmentId: string;
            };
            cookie?: never;
        };
        get?: never;
        /**
         * Registra a presença (administrativa) de uma consulta
         * @description Registra se o paciente compareceu, faltou ou remarcou, com anotação administrativa. NÃO aceita nem armazena qualquer dado clínico — apenas controle de presença e faturamento.
         */
        put: operations["recordAttendance"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charges": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lista cobranças
         * @description Lista paginada de cobranças, com filtros opcionais por paciente, competência e status.
         */
        get: operations["listCharges"];
        put?: never;
        /** Emite uma cobrança de mensalidade */
        post: operations["createCharge"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charges/{chargeId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da cobrança. */
                chargeId: string;
            };
            cookie?: never;
        };
        /** Obtém uma cobrança */
        get: operations["getCharge"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/charges/{chargeId}/payment": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da cobrança. */
                chargeId: string;
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registra o pagamento de uma cobrança
         * @description Registra o pagamento (administrativo) de uma cobrança e atualiza seu status. Valores em centavos.
         */
        post: operations["registerPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista tarefas */
        get: operations["listTasks"];
        put?: never;
        /** Cria uma tarefa */
        post: operations["createTask"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tasks/{taskId}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da tarefa. */
                taskId: string;
            };
            cookie?: never;
        };
        get?: never;
        /**
         * Atualiza uma tarefa
         * @description Edita título/vencimento ou marca conclusão. `completedAt` presente conclui; ausente reabre.
         */
        put: operations["updateTask"];
        post?: never;
        /** Remove uma tarefa */
        delete: operations["deleteTask"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/reminders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista lembretes */
        get: operations["listReminders"];
        put?: never;
        /**
         * Cria um lembrete
         * @description Cria um lembrete (canal email no MVP), opcionalmente vinculado.
         */
        post: operations["createReminder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Obtém as configurações da conta */
        get: operations["getSettings"];
        /** Atualiza as configurações da conta */
        put: operations["updateSettings"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/settings/onboarding": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Consulta o estado do onboarding */
        get: operations["getOnboardingStatus"];
        put?: never;
        /** Marca um passo do onboarding como concluído */
        post: operations["completeOnboardingStep"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description Erro no formato Problem Details (RFC 9457), retornado com o media type `application/problem+json`. Campos de extensão específicos aparecem em schemas derivados (ex.: ValidationProblem). */
        Problem: {
            /**
             * Format: uri
             * @description URI que identifica o tipo do problema. `about:blank` quando o erro é totalmente descrito pelo status HTTP.
             * @default about:blank
             * @example https://psiops.com.br/problems/validation
             */
            type: string;
            /**
             * @description Resumo curto e legível do tipo de problema (pt-BR). Não muda entre ocorrências do mesmo tipo.
             * @example Requisição inválida
             */
            title: string;
            /**
             * Format: int32
             * @description Código de status HTTP gerado pelo servidor para esta ocorrência.
             * @example 400
             */
            status: number;
            /**
             * @description Explicação legível (pt-BR) específica desta ocorrência.
             * @example O campo whatsapp não está em um formato brasileiro válido.
             */
            detail?: string;
            /**
             * Format: uri-reference
             * @description Referência URI (RFC 9457 permite relativa) que identifica esta ocorrência específica do problema.
             * @example /api/v1/leads
             */
            instance?: string;
        };
        /** @description Violação de validação de um campo específico do payload. */
        FieldViolation: {
            /**
             * @description Caminho do campo violado no payload, em camelCase (ex.: `whatsapp`, `tokens.refreshToken`).
             * @example whatsapp
             */
            field: string;
            /**
             * @description Mensagem legível (pt-BR) descrevendo a violação.
             * @example deve estar no formato +55DDXXXXXXXXX
             */
            message: string;
        };
        /** @description Problem Details (RFC 9457) para erros de validação de payload, com a extensão `violations` listando cada campo violado. */
        ValidationProblem: components["schemas"]["Problem"] & {
            /** @description Lista de violações por campo (ao menos uma). */
            violations: components["schemas"]["FieldViolation"][];
        };
        /** @description Metadados de paginação de uma listagem. A lista em si fica na propriedade `items` do schema de resposta específico de cada recurso. */
        PageMeta: {
            /**
             * Format: int32
             * @description Índice da página retornada (base 0).
             */
            page: number;
            /**
             * Format: int32
             * @description Tamanho de página solicitado.
             */
            size: number;
            /**
             * Format: int64
             * @description Total de itens existentes em todas as páginas.
             */
            totalElements: number;
            /**
             * Format: int32
             * @description Total de páginas disponíveis.
             */
            totalPages: number;
        };
        /**
         * Format: int64
         * @description Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
         * @example 15000
         */
        MoneyBRL: number;
        /**
         * Format: date
         * @description Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de "dia civil" (ex.: dia de vencimento).
         * @example 2026-07-05
         */
        IsoDate: string;
        /**
         * Format: date-time
         * @description Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
         * @example 2026-07-05T12:00:00Z
         */
        IsoDateTime: string;
        /** @description Conta da psicóloga autenticável no PsiOps. */
        User: {
            /**
             * Format: uuid
             * @description Identificador único da conta.
             * @example 6f1d2c4a-8b3e-4f5a-9c7d-1e2f3a4b5c6d
             */
            id: string;
            /**
             * @description Nome completo.
             * @example Ana Beatriz Souza
             */
            name: string;
            /**
             * Format: email
             * @description E-mail de login (único por conta).
             * @example ana@exemplo.com.br
             */
            email: string;
            /** @description Instante de criação da conta (ISO 8601, UTC). */
            createdAt: components["schemas"]["IsoDateTime"];
        };
        /** @description Payload de criação de conta. */
        RegisterRequest: {
            /**
             * @description Nome completo.
             * @example Ana Beatriz Souza
             */
            name: string;
            /**
             * Format: email
             * @description E-mail de login (único por conta).
             * @example ana@exemplo.com.br
             */
            email: string;
            /**
             * Format: password
             * @description Senha em texto claro (transporte sempre via TLS). Mínimo de 8 caracteres; máximo de 72 bytes (limite do BCrypt usado no backend).
             */
            password: string;
        };
        /** @description Credenciais de login. */
        LoginRequest: {
            /**
             * Format: email
             * @example ana@exemplo.com.br
             */
            email: string;
            /** Format: password */
            password: string;
        };
        /** @description Payload de renovação do par de tokens. */
        RefreshTokenRequest: {
            /** @description Refresh token opaco recebido no login/registro/refresh anterior. */
            refreshToken: string;
        };
        /** @description Par de tokens emitido no registro, login e refresh. O access token é um JWT de curta duração enviado em `Authorization: Bearer <token>`; o refresh token é opaco, de uso único (rotacionado a cada refresh). */
        TokenPair: {
            /**
             * @description Tipo do token, sempre `Bearer`.
             * @constant
             */
            tokenType: "Bearer";
            /** @description JWT de acesso, de curta duração. */
            accessToken: string;
            /**
             * Format: int32
             * @description Segundos até a expiração do access token, contados da emissão.
             * @example 900
             */
            expiresIn: number;
            /** @description Refresh token opaco para obter um novo par via /auth/refresh. */
            refreshToken: string;
        };
        /** @description Resposta de registro e login — conta autenticada + tokens. */
        AuthResponse: {
            user: components["schemas"]["User"];
            tokens: components["schemas"]["TokenPair"];
        };
        /** @description Sessão corrente derivada do access token apresentado. */
        SessionResponse: {
            user: components["schemas"]["User"];
            /** @description Instante de expiração do access token corrente (ISO 8601, UTC). */
            expiresAt: components["schemas"]["IsoDateTime"];
        };
        /**
         * @description Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp).
         * @example +5511990000000
         */
        WhatsAppBR: string;
        /** @description Payload de entrada na lista de espera, capturado pelo formulário da landing page (âncora #lista). */
        LeadCreateRequest: {
            /**
             * @description Nome informado no formulário.
             * @example Ana Beatriz Souza
             */
            name: string;
            whatsapp: components["schemas"]["WhatsAppBR"];
            /**
             * Format: email
             * @description E-mail de contato (único na lista de espera).
             * @example ana@exemplo.com.br
             */
            email: string;
        };
        /** @description Lead registrado na lista de espera. */
        Lead: {
            /**
             * Format: uuid
             * @description Identificador único do lead.
             * @example 0b8f4a2d-6c1e-4d3b-8a5f-9e7c6d5b4a3f
             */
            id: string;
            /** @example Ana Beatriz Souza */
            name: string;
            whatsapp: components["schemas"]["WhatsAppBR"];
            /**
             * Format: email
             * @example ana@exemplo.com.br
             */
            email: string;
            /** @description Instante de entrada na lista de espera (ISO 8601, UTC). */
            createdAt: components["schemas"]["IsoDateTime"];
        };
        /** @description Paciente (contato administrativo e de cobrança da psicóloga). */
        Patient: {
            /**
             * Format: uuid
             * @description Identificador único do paciente.
             * @example 3f2b9a1c-7d4e-4a6b-8c9d-0e1f2a3b4c5d
             */
            id: string;
            /**
             * @description Nome do paciente.
             * @example Marina Alves
             */
            name: string;
            whatsapp?: components["schemas"]["WhatsAppBR"];
            /**
             * Format: email
             * @description E-mail de contato (opcional).
             */
            email?: string;
            monthlyFee: components["schemas"]["MoneyBRL"];
            /**
             * Format: int32
             * @description Dia do mês (1–28) de vencimento da mensalidade. Limitado a 28 para existir em todos os meses.
             * @example 10
             */
            billingDay: number;
            status: components["schemas"]["PatientStatus"];
            /** @description Anotações ADMINISTRATIVAS livres (ex.: preferências de contato, combinados de pagamento). NÃO se destinam a conteúdo clínico. */
            notes?: string;
            createdAt: components["schemas"]["IsoDateTime"];
        };
        /**
         * @description Situação cadastral do paciente na carteira da psicóloga. `ativo` recebe cobranças; `inativo` foi arquivado e não gera novas mensalidades.
         * @example ativo
         * @enum {string}
         */
        PatientStatus: "ativo" | "inativo";
        /** @description Payload de cadastro de paciente. */
        PatientCreateRequest: {
            name: string;
            whatsapp?: components["schemas"]["WhatsAppBR"];
            /** Format: email */
            email?: string;
            monthlyFee: components["schemas"]["MoneyBRL"];
            /** Format: int32 */
            billingDay: number;
            notes?: string;
        };
        /** @description Payload de atualização de paciente. Todos os campos são opcionais; apenas os presentes são alterados. */
        PatientUpdateRequest: {
            name?: string;
            whatsapp?: components["schemas"]["WhatsAppBR"];
            /** Format: email */
            email?: string;
            monthlyFee?: components["schemas"]["MoneyBRL"];
            /** Format: int32 */
            billingDay?: number;
            status?: components["schemas"]["PatientStatus"];
            notes?: string;
        };
        /** @description Página de pacientes. */
        PatientPage: {
            items: components["schemas"]["Patient"][];
            meta: components["schemas"]["PageMeta"];
        };
        /** @description Consulta agendada na agenda da psicóloga. */
        Appointment: {
            /**
             * Format: uuid
             * @description Identificador único da consulta.
             */
            id: string;
            /**
             * Format: uuid
             * @description Paciente da consulta.
             */
            patientId: string;
            startsAt: components["schemas"]["IsoDateTime"];
            /**
             * Format: int32
             * @description Duração da consulta em minutos.
             * @example 50
             */
            durationMinutes: number;
            recurrence?: components["schemas"]["WeeklyRecurrence"];
            status: components["schemas"]["AppointmentStatus"];
            createdAt: components["schemas"]["IsoDateTime"];
        };
        /**
         * @description Situação da consulta na agenda.
         * @example agendada
         * @enum {string}
         */
        AppointmentStatus: "agendada" | "realizada" | "cancelada" | "remarcada";
        /** @description Recorrência semanal simples de uma consulta. Ausente/None indica consulta avulsa. A materialização das ocorrências (expandir em instâncias vs. manter como regra) é decisão da API (PSI-024), não deste contrato. */
        WeeklyRecurrence: {
            /**
             * @description Dia da semana da recorrência.
             * @enum {string}
             */
            weekday: "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
            /**
             * Format: int32
             * @description Intervalo em semanas entre ocorrências (1 = toda semana, 2 = quinzenal).
             * @default 1
             */
            interval: number;
            until?: components["schemas"]["IsoDate"];
        };
        /** @description Payload de agendamento de consulta. */
        AppointmentCreateRequest: {
            /** Format: uuid */
            patientId: string;
            startsAt: components["schemas"]["IsoDateTime"];
            /** Format: int32 */
            durationMinutes: number;
            recurrence?: components["schemas"]["WeeklyRecurrence"];
        };
        /** @description Remarcação/edição de consulta. Campos opcionais; apenas os presentes mudam. */
        AppointmentUpdateRequest: {
            startsAt?: components["schemas"]["IsoDateTime"];
            /** Format: int32 */
            durationMinutes?: number;
            recurrence?: components["schemas"]["WeeklyRecurrence"];
            status?: components["schemas"]["AppointmentStatus"];
        };
        /**
         * @description Registro ADMINISTRATIVO de uma consulta: se o paciente compareceu, faltou ou remarcou, mais uma anotação administrativa livre.
         *     AUSÊNCIA PROPOSITAL DE DADOS CLÍNICOS: este schema NÃO contém — e não deve receber — campos de diagnóstico, evolução, queixa, conduta ou qualquer informação clínica/de saúde. Ele existe apenas para controle de presença e faturamento. A restrição é uma decisão de produto inviolável.
         */
        AttendanceRecord: {
            attendance: components["schemas"]["AttendanceStatus"];
            /** @description Anotação ADMINISTRATIVA (ex.: "remarcou por viagem", "faltou sem aviso"). Nunca conteúdo clínico. */
            administrativeNotes?: string;
            recordedAt?: components["schemas"]["IsoDateTime"];
        };
        /**
         * @description Presença administrativa do paciente na consulta.
         * @example compareceu
         * @enum {string}
         */
        AttendanceStatus: "compareceu" | "faltou" | "remarcada";
        /** @description Página de consultas. */
        AppointmentPage: {
            items: components["schemas"]["Appointment"][];
            meta: components["schemas"]["PageMeta"];
        };
        /** @description Cobrança de mensalidade de um paciente, referente a uma competência (mês). O valor é fixado na emissão a partir da mensalidade combinada. */
        Charge: {
            /**
             * Format: uuid
             * @description Identificador único da cobrança.
             */
            id: string;
            /**
             * Format: uuid
             * @description Paciente cobrado.
             */
            patientId: string;
            competence: components["schemas"]["Competence"];
            amount: components["schemas"]["MoneyBRL"];
            dueDate: components["schemas"]["IsoDate"];
            status: components["schemas"]["ChargeStatus"];
            interest?: components["schemas"]["SimpleInterestParams"];
            payment?: components["schemas"]["Payment"];
            createdAt: components["schemas"]["IsoDateTime"];
        };
        /**
         * @description Competência (mês de referência) da mensalidade no formato `AAAA-MM`. Ex.: `2026-07`. Distinta de IsoDate por não ter dia.
         * @example 2026-07
         */
        Competence: string;
        /**
         * @description Situação de pagamento da cobrança. `em_dia` = paga ou dentro do prazo; `pendente` = aguardando pagamento, ainda não vencida; `atrasada` = vencida e não paga.
         * @example pendente
         * @enum {string}
         */
        ChargeStatus: "em_dia" | "pendente" | "atrasada";
        /** @description Parâmetros de juros SIMPLES aplicados sobre cobrança atrasada. O cálculo do montante devido é responsabilidade da API; aqui vão apenas os parâmetros. */
        SimpleInterestParams: {
            /**
             * Format: double
             * @description Percentual de juros ao mês (ex.: 1.0 = 1% a.m.), aplicado de forma linear (simples) por período de atraso.
             * @example 1
             */
            monthlyRatePercent: number;
            /**
             * Format: double
             * @description Percentual de multa única aplicada no vencimento (ex.: 2.0 = 2%).
             * @example 2
             */
            finePercent: number;
        };
        /** @description Registro de pagamento de uma cobrança. */
        Payment: {
            paidAmount: components["schemas"]["MoneyBRL"];
            paidAt: components["schemas"]["IsoDateTime"];
            method: components["schemas"]["PaymentMethod"];
            /** @description Observação administrativa do pagamento (opcional). */
            note?: string;
        };
        /**
         * @description Meio de pagamento informado no registro (administrativo).
         * @example pix
         * @enum {string}
         */
        PaymentMethod: "pix" | "dinheiro" | "transferencia" | "cartao" | "outro";
        /** @description Payload para registrar o pagamento de uma cobrança. */
        RegisterPaymentRequest: {
            paidAmount: components["schemas"]["MoneyBRL"];
            paidAt: components["schemas"]["IsoDateTime"];
            method: components["schemas"]["PaymentMethod"];
            note?: string;
        };
        /** @description Página de cobranças. */
        ChargePage: {
            items: components["schemas"]["Charge"][];
            meta: components["schemas"]["PageMeta"];
        };
        /** @description Tarefa administrativa (lembrete interno de afazer). */
        Task: {
            /** Format: uuid */
            id: string;
            /**
             * @description Descrição curta da tarefa.
             * @example Enviar recibo para Marina
             */
            title: string;
            dueDate?: components["schemas"]["IsoDate"];
            completedAt?: components["schemas"]["IsoDateTime"];
            createdAt: components["schemas"]["IsoDateTime"];
        };
        /** @description Payload de criação de tarefa. */
        TaskCreateRequest: {
            title: string;
            dueDate?: components["schemas"]["IsoDate"];
        };
        /** @description Atualização de tarefa. Campos opcionais; `completedAt` presente marca a tarefa como concluída, ausente/null a reabre. */
        TaskUpdateRequest: {
            title?: string;
            dueDate?: components["schemas"]["IsoDate"];
            completedAt?: components["schemas"]["IsoDateTime"];
        };
        /** @description Página de tarefas. */
        TaskPage: {
            items: components["schemas"]["Task"][];
            meta: components["schemas"]["PageMeta"];
        };
        /** @description Lembrete agendado/enviado pela psicóloga a um paciente. */
        Reminder: {
            /** Format: uuid */
            id: string;
            channel: components["schemas"]["ReminderChannel"];
            /** @description Assunto/título do lembrete. */
            subject: string;
            /** @description Corpo do lembrete (texto administrativo). */
            body: string;
            scheduledFor: components["schemas"]["IsoDateTime"];
            sentAt?: components["schemas"]["IsoDateTime"];
            status: components["schemas"]["ReminderStatus"];
            /**
             * Format: uuid
             * @description Paciente vinculado (opcional).
             */
            patientId?: string;
            /**
             * Format: uuid
             * @description Consulta vinculada (opcional).
             */
            appointmentId?: string;
            /**
             * Format: uuid
             * @description Cobrança vinculada (opcional).
             */
            chargeId?: string;
            createdAt: components["schemas"]["IsoDateTime"];
        };
        /**
         * @description Canal de envio do lembrete. No MVP, apenas `email`.
         * @example email
         * @enum {string}
         */
        ReminderChannel: "email";
        /**
         * @description Situação do lembrete no ciclo de envio.
         * @example agendado
         * @enum {string}
         */
        ReminderStatus: "agendado" | "enviado" | "falhou" | "cancelado";
        /** @description Payload de criação de lembrete. Os vínculos (patientId/appointmentId/ chargeId) são todos opcionais e independentes. */
        ReminderCreateRequest: {
            channel: components["schemas"]["ReminderChannel"];
            subject: string;
            body: string;
            scheduledFor: components["schemas"]["IsoDateTime"];
            /** Format: uuid */
            patientId?: string;
            /** Format: uuid */
            appointmentId?: string;
            /** Format: uuid */
            chargeId?: string;
        };
        /** @description Página de lembretes. */
        ReminderPage: {
            items: components["schemas"]["Reminder"][];
            meta: components["schemas"]["PageMeta"];
        };
        /** @description Configurações da conta da psicóloga. */
        Settings: {
            defaultMonthlyFee?: components["schemas"]["MoneyBRL"];
            /**
             * Format: int32
             * @description Dia de vencimento padrão para novas mensalidades.
             */
            defaultBillingDay?: number;
            defaultInterest?: components["schemas"]["SimpleInterestParams"];
            /**
             * @description Fuso IANA para exibição (ex.: `America/Sao_Paulo`). O backend sempre armazena/emite em UTC; este campo orienta apenas a apresentação.
             * @example America/Sao_Paulo
             */
            timezone: string;
            onboardingCompletedAt?: components["schemas"]["IsoDateTime"];
            updatedAt?: components["schemas"]["IsoDateTime"];
        };
        /** @description Atualização das configurações. Campos opcionais. */
        SettingsUpdateRequest: {
            defaultMonthlyFee?: components["schemas"]["MoneyBRL"];
            /** Format: int32 */
            defaultBillingDay?: number;
            defaultInterest?: components["schemas"]["SimpleInterestParams"];
            timezone?: string;
        };
        /** @description Estado do onboarding da psicóloga: os passos concluídos e se o fluxo terminou. Orienta a UI a retomar de onde parou. */
        OnboardingStatus: {
            /** @description Se o onboarding foi concluído. */
            completed: boolean;
            /** @description Passos do onboarding e sua conclusão. */
            steps: components["schemas"]["OnboardingStep"][];
        };
        OnboardingStep: {
            /**
             * @description Identificador do passo (ex.: `perfil`, `primeiro-paciente`).
             * @example perfil
             */
            key: string;
            done: boolean;
        };
        /** @description Marca um passo do onboarding como concluído. */
        OnboardingCompleteRequest: {
            /** @description Passo a marcar como concluído. */
            stepKey: string;
        };
        /** @description Envelope comum de um evento de domínio. O `payload` é o dado específico do tipo; os schemas concretos (ChargeOverdueEvent, ReminderDueEvent) restringem `type` e `payload`. */
        DomainEvent: {
            /**
             * Format: uuid
             * @description Identificador único do evento (idempotência).
             */
            eventId: string;
            /**
             * @description Tipo do evento no formato `<recurso>.<fato>`.
             * @example cobranca.atrasada
             */
            type: string;
            occurredAt: components["schemas"]["IsoDateTime"];
            /**
             * Format: uuid
             * @description Tenant (psicóloga) dona do fato.
             */
            userId: string;
            /** @description Dado específico do tipo de evento. */
            payload: {
                [key: string]: unknown;
            };
        };
        /** @description Payload do evento `cobranca.atrasada`. */
        ChargeOverduePayload: {
            /** Format: uuid */
            chargeId: string;
            /** Format: uuid */
            patientId: string;
            competence: components["schemas"]["Competence"];
            amount: components["schemas"]["MoneyBRL"];
            dueDate: components["schemas"]["IsoDate"];
        };
        ChargeOverdueEvent: components["schemas"]["DomainEvent"] & {
            /** @constant */
            type: "cobranca.atrasada";
            payload: components["schemas"]["ChargeOverduePayload"];
        };
        /** @description Payload do evento `lembrete.devido`. */
        ReminderDuePayload: {
            /** Format: uuid */
            reminderId: string;
            channel: components["schemas"]["ReminderChannel"];
            scheduledFor: components["schemas"]["IsoDateTime"];
            /**
             * Format: uuid
             * @description Paciente vinculado (opcional).
             */
            patientId?: string;
        };
        ReminderDueEvent: components["schemas"]["DomainEvent"] & {
            /** @constant */
            type: "lembrete.devido";
            payload: components["schemas"]["ReminderDuePayload"];
        };
    };
    responses: {
        /** @description Requisição inválida: payload malformado ou regras de validação violadas. Inclui a lista de violações por campo. */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ValidationProblem"];
            };
        };
        /** @description Não autenticado: credenciais inválidas, token ausente, expirado ou revogado. */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Recurso não encontrado. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Conflito com o estado atual do recurso (ex.: e-mail já cadastrado). */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
        /** @description Erro interno inesperado do servidor. */
        InternalServerError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["Problem"];
            };
        };
    };
    parameters: {
        /** @description Índice da página desejada (base 0). */
        PageParam: number;
        /** @description Quantidade de itens por página. */
        PageSizeParam: number;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    registerUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterRequest"];
            };
        };
        responses: {
            /** @description Conta criada e sessão iniciada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description E-mail já cadastrado. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    loginUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginRequest"];
            };
        };
        responses: {
            /** @description Autenticação bem-sucedida. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Credenciais inválidas. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    refreshToken: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RefreshTokenRequest"];
            };
        };
        responses: {
            /** @description Novo par de tokens emitido. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenPair"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description Refresh token inválido, expirado ou já utilizado. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    getCurrentSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Sessão válida. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionResponse"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    createLead: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LeadCreateRequest"];
            };
        };
        responses: {
            /** @description Lead registrado na lista de espera. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Lead"];
                };
            };
            400: components["responses"]["BadRequest"];
            /** @description E-mail já registrado na lista de espera. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    listPatients: {
        parameters: {
            query?: {
                /** @description Índice da página desejada (base 0). */
                page?: components["parameters"]["PageParam"];
                /** @description Quantidade de itens por página. */
                size?: components["parameters"]["PageSizeParam"];
                /** @description Filtra por situação cadastral. */
                status?: components["schemas"]["PatientStatus"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de pacientes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PatientPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    createPatient: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatientCreateRequest"];
            };
        };
        responses: {
            /** @description Paciente cadastrado. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Patient"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    getPatient: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador do paciente. */
                patientId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Paciente. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Patient"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    updatePatient: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador do paciente. */
                patientId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PatientUpdateRequest"];
            };
        };
        responses: {
            /** @description Paciente atualizado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Patient"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    deletePatient: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador do paciente. */
                patientId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Paciente removido. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    listAppointments: {
        parameters: {
            query?: {
                /** @description Índice da página desejada (base 0). */
                page?: components["parameters"]["PageParam"];
                /** @description Quantidade de itens por página. */
                size?: components["parameters"]["PageSizeParam"];
                /** @description Filtra consultas de um paciente. */
                patientId?: string;
                /** @description Início do intervalo (inclusive). */
                from?: components["schemas"]["IsoDate"];
                /** @description Fim do intervalo (inclusive). */
                to?: components["schemas"]["IsoDate"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de consultas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AppointmentPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    createAppointment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AppointmentCreateRequest"];
            };
        };
        responses: {
            /** @description Consulta agendada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Appointment"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Conflito de horário: já existe uma consulta que se sobrepõe ao intervalo solicitado. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    getAppointment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da consulta. */
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Appointment"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    updateAppointment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da consulta. */
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AppointmentUpdateRequest"];
            };
        };
        responses: {
            /** @description Consulta atualizada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Appointment"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            /** @description Conflito de horário com outra consulta. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    cancelAppointment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da consulta. */
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Consulta cancelada. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    recordAttendance: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da consulta. */
                appointmentId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttendanceRecord"];
            };
        };
        responses: {
            /** @description Presença registrada; consulta atualizada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Appointment"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    listCharges: {
        parameters: {
            query?: {
                /** @description Índice da página desejada (base 0). */
                page?: components["parameters"]["PageParam"];
                /** @description Quantidade de itens por página. */
                size?: components["parameters"]["PageSizeParam"];
                patientId?: string;
                /** @description Filtra por competência (AAAA-MM). */
                competence?: components["schemas"]["Competence"];
                status?: components["schemas"]["ChargeStatus"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de cobranças. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ChargePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    createCharge: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    patientId: string;
                    competence: components["schemas"]["Competence"];
                    amount: components["schemas"]["MoneyBRL"];
                    dueDate: components["schemas"]["IsoDate"];
                    interest?: components["schemas"]["SimpleInterestParams"];
                };
            };
        };
        responses: {
            /** @description Cobrança emitida. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Charge"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            /** @description Já existe cobrança para o paciente nessa competência. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    getCharge: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da cobrança. */
                chargeId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Cobrança. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Charge"];
                };
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    registerPayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da cobrança. */
                chargeId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterPaymentRequest"];
            };
        };
        responses: {
            /** @description Pagamento registrado; cobrança atualizada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Charge"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            /** @description Cobrança já paga. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["Problem"];
                };
            };
            500: components["responses"]["InternalServerError"];
        };
    };
    listTasks: {
        parameters: {
            query?: {
                /** @description Índice da página desejada (base 0). */
                page?: components["parameters"]["PageParam"];
                /** @description Quantidade de itens por página. */
                size?: components["parameters"]["PageSizeParam"];
                /** @description Se `true`, retorna apenas tarefas não concluídas. */
                pending?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de tarefas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    createTask: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskCreateRequest"];
            };
        };
        responses: {
            /** @description Tarefa criada. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Task"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    updateTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da tarefa. */
                taskId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskUpdateRequest"];
            };
        };
        responses: {
            /** @description Tarefa atualizada. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Task"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    deleteTask: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Identificador da tarefa. */
                taskId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Tarefa removida. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            500: components["responses"]["InternalServerError"];
        };
    };
    listReminders: {
        parameters: {
            query?: {
                /** @description Índice da página desejada (base 0). */
                page?: components["parameters"]["PageParam"];
                /** @description Quantidade de itens por página. */
                size?: components["parameters"]["PageSizeParam"];
                patientId?: string;
                status?: components["schemas"]["ReminderStatus"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Página de lembretes. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReminderPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    createReminder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReminderCreateRequest"];
            };
        };
        responses: {
            /** @description Lembrete criado. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Reminder"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    getSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Configurações. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Settings"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    updateSettings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SettingsUpdateRequest"];
            };
        };
        responses: {
            /** @description Configurações atualizadas. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Settings"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    getOnboardingStatus: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Estado do onboarding. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OnboardingStatus"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
    completeOnboardingStep: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OnboardingCompleteRequest"];
            };
        };
        responses: {
            /** @description Estado do onboarding atualizado. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OnboardingStatus"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["InternalServerError"];
        };
    };
}
