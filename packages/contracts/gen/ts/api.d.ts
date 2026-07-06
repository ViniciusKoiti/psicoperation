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
}
