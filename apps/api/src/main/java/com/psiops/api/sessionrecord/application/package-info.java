/**
 * Casos de uso de registros administrativos de consulta (PSI-025):
 * vincular/atualizar a presença de uma consulta existente e montar o
 * histórico paginado por paciente.
 *
 * <p><strong>RESTRIÇÃO DE PRODUTO INEGOCIÁVEL — nenhum campo clínico</strong>:
 * este módulo manipula exclusivamente o status administrativo de
 * comparecimento (compareceu/faltou/remarcada, {@link
 * com.psiops.contracts.model.AttendanceStatus}) e uma anotação
 * administrativa livre. NENHUM diagnóstico, evolução, queixa, hipótese ou
 * conteúdo de saúde é modelado, aceito ou persistido aqui — ver o javadoc
 * completo em {@link com.psiops.api.appointment.persistence.SessionRecordEntity}
 * (entidade JPA reaproveitada, definida na PSI-021).
 */
package com.psiops.api.sessionrecord.application;
