/**
 * Endpoints HTTP de registros administrativos de consulta (PSI-025): {@code
 * PUT /appointments/{appointmentId}/attendance} (contrato PSI-020) e {@code
 * GET /patients/{patientId}/session-records} (histórico paginado, endpoint
 * adicional desta implementação).
 *
 * <p><strong>RESTRIÇÃO DE PRODUTO INEGOCIÁVEL — nenhum campo clínico</strong>:
 * nenhum DTO exposto por este pacote contém — ou deve conter — diagnóstico,
 * evolução, queixa, hipótese ou qualquer conteúdo de saúde. Os únicos dados
 * capturados são o status administrativo de comparecimento e uma anotação
 * administrativa livre (texto opaco, nunca processado/interpretado pelo
 * backend). Ver o javadoc completo em {@link
 * com.psiops.api.appointment.persistence.SessionRecordEntity}.
 */
package com.psiops.api.sessionrecord.web;
