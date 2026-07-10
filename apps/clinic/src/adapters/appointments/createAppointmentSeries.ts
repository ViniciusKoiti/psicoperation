import type { Appointment, AppointmentCreateRequest } from "@psiops/contracts";

import type { CreateAppointmentSeriesInput, CreateAppointmentSeriesResult } from "./AgendaAdapter";
import { isAgendaConflictError } from "./AgendaAdapterError";
import { computeWeeklySeriesOccurrences } from "./recurrence";

/**
 * Materializa uma série semanal simples em consultas individuais (critério
 * de aceite do manifesto PSI-035): calcula a data de cada ocorrência
 * (`computeWeeklySeriesOccurrences`) e chama `createAppointment` — o MESMO
 * método usado para uma consulta avulsa, sem o campo `recurrence` do
 * contrato — uma vez por ocorrência.
 *
 * Compartilhada por `MockAgendaAdapter` e `HttpAgendaAdapter`: as duas
 * implementações apenas delegam `createAppointmentSeries` para esta função,
 * passando o próprio `createAppointment`. Isso evita duplicar a lógica de
 * loop/tratamento de conflito em cada uma — a mitigação do risco do
 * manifesto ("regra de sobreposição divergente entre client, mock e API
 * real") depende de existir só UM lugar que decide "isto foi um conflito de
 * horário ou outro tipo de erro".
 *
 * Conflito parcial: assumption do manifesto — ocorrências livres são
 * criadas e as conflitantes voltam com `outcome: "conflict"`, sem abortar as
 * demais. Qualquer erro que NÃO seja conflito de horário (rede, 500, etc.)
 * propaga e interrompe a série — não é uma decisão de negócio que esta
 * função deva engolir.
 */
export async function createAppointmentSeriesWith(
  createAppointment: (payload: AppointmentCreateRequest) => Promise<Appointment>,
  input: CreateAppointmentSeriesInput,
): Promise<CreateAppointmentSeriesResult> {
  const occurrenceDates = computeWeeklySeriesOccurrences(input.startsAt, input);

  const occurrences: CreateAppointmentSeriesResult["occurrences"] = [];
  for (const startsAt of occurrenceDates) {
    try {
      const appointment = await createAppointment({
        patientId: input.patientId,
        startsAt,
        durationMinutes: input.durationMinutes,
      });
      occurrences.push({ startsAt, outcome: "created", appointment });
    } catch (error) {
      if (isAgendaConflictError(error)) {
        occurrences.push({ startsAt, outcome: "conflict" });
      } else {
        throw error;
      }
    }
  }
  return { occurrences };
}
