package com.psiops.api.appointment.domain.command;

import com.psiops.api.appointment.persistence.AppointmentStatus;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.axonframework.modelling.command.TargetAggregateIdentifier;

/**
 * Encerra uma consulta, liberando o horário para novos agendamentos.
 *
 * <p>{@code resultingStatus} é sempre {@link AppointmentStatus#CANCELADA} ou
 * {@link AppointmentStatus#REMARCADA} — os dois status terminais que não
 * contam como conflito de horário (ver {@code AppointmentEntity}). Vindo de
 * {@code DELETE /appointments/{id}} (cancelamento) ou de {@code PUT
 * .../{id}} com {@code status=cancelada|remarcada} sem mudança de horário.
 */
public record CancelAppointmentCommand(
    @TargetAggregateIdentifier UUID appointmentId,
    AppointmentStatus resultingStatus,
    OffsetDateTime cancelledAt) {}
