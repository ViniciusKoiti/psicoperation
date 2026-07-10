import type { Patient, PatientCreateRequest, PatientUpdateRequest } from "@psiops/contracts";

import { centsToReais, reaisToCents } from "./money";
import { e164ToWhatsAppInput, isValidWhatsAppE164, whatsAppInputToE164 } from "./whatsapp";

/**
 * Validação client-side do formulário de cadastro/edição de pacientes.
 * Campos ESTRITAMENTE administrativos e financeiros (nome, contato, valor de
 * sessão/mensalidade em centavos BRL, dia de vencimento) — nenhum campo
 * clínico (restrição inviolável, CLAUDE.md). As regras espelham em runtime as
 * restrições já documentadas no contrato
 * (`packages/contracts/openapi/components/patient/schemas.yaml`): nome
 * 1–120 caracteres, e-mail válido com até 254 caracteres, WhatsApp no formato
 * `WhatsAppBR`, dia de vencimento entre 1 e 28, anotações até 2000 caracteres.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;
const NOTES_MAX_LENGTH = 2000;
const BILLING_DAY_MIN = 1;
const BILLING_DAY_MAX = 28;

/**
 * Estado do formulário — não é o DTO do contrato: `whatsapp` fica no formato
 * mascarado de UI (`(XX) XXXXX-XXXX`) e `monthlyFeeReais`/`billingDay` ficam
 * como `number | string` (o que os `NumberInput` do Mantine mantêm enquanto a
 * usuária digita). A conversão para `PatientCreateRequest`/`PatientUpdateRequest`
 * acontece só no limite de submissão (`toPatientPayload`).
 */
export interface PatientFormValues {
  name: string;
  /** Valor mascarado (`(XX) XXXXX-XXXX`) ou vazio — campo opcional. */
  whatsapp: string;
  email: string;
  monthlyFeeReais: number | string;
  billingDay: number | string;
  notes: string;
}

export const EMPTY_PATIENT_FORM_VALUES: PatientFormValues = {
  name: "",
  whatsapp: "",
  email: "",
  monthlyFeeReais: "",
  billingDay: "",
  notes: "",
};

export type PatientFormErrors = Partial<Record<keyof PatientFormValues, string>>;

export function validatePatientForm(values: PatientFormValues): PatientFormErrors {
  const errors: PatientFormErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Informe o nome do paciente.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`;
  }

  const whatsappDigits = values.whatsapp.replace(/\D/g, "");
  if (whatsappDigits.length > 0) {
    const e164 = whatsAppInputToE164(values.whatsapp);
    if (!e164 || !isValidWhatsAppE164(e164)) {
      errors.whatsapp = "Informe um WhatsApp válido: (DDD) 9XXXX-XXXX.";
    }
  }

  const email = values.email.trim();
  if (email) {
    if (!EMAIL_PATTERN.test(email)) {
      errors.email = "Informe um e-mail válido.";
    } else if (email.length > EMAIL_MAX_LENGTH) {
      errors.email = `O e-mail deve ter no máximo ${EMAIL_MAX_LENGTH} caracteres.`;
    }
  }

  const monthlyFeeReais =
    typeof values.monthlyFeeReais === "number" ? values.monthlyFeeReais : Number(values.monthlyFeeReais);
  if (values.monthlyFeeReais === "" || Number.isNaN(monthlyFeeReais)) {
    errors.monthlyFeeReais = "Informe o valor da mensalidade.";
  } else if (monthlyFeeReais <= 0) {
    errors.monthlyFeeReais = "Informe um valor maior que zero.";
  }

  const billingDay = typeof values.billingDay === "number" ? values.billingDay : Number(values.billingDay);
  if (values.billingDay === "" || Number.isNaN(billingDay)) {
    errors.billingDay = "Informe o dia de vencimento.";
  } else if (!Number.isInteger(billingDay) || billingDay < BILLING_DAY_MIN || billingDay > BILLING_DAY_MAX) {
    errors.billingDay = `Informe um dia entre ${BILLING_DAY_MIN} e ${BILLING_DAY_MAX}.`;
  }

  if (values.notes.trim().length > NOTES_MAX_LENGTH) {
    errors.notes = `As anotações devem ter no máximo ${NOTES_MAX_LENGTH} caracteres.`;
  }

  return errors;
}

export function hasErrors(errors: PatientFormErrors): boolean {
  return Object.values(errors).some((value) => value !== undefined);
}

/**
 * Converte o estado do formulário (já validado — ver `validatePatientForm`)
 * para o payload do contrato. O mesmo formato serve tanto para
 * `PatientCreateRequest` quanto `PatientUpdateRequest` (o segundo é apenas
 * mais permissivo: todos os campos opcionais); `status` não é definido aqui —
 * arquivamento/desarquivamento usam `PatientsAdapter.archivePatient`/
 * `unarchivePatient` diretamente, fora deste formulário.
 */
export function toPatientPayload(values: PatientFormValues): PatientCreateRequest & PatientUpdateRequest {
  const whatsapp = whatsAppInputToE164(values.whatsapp);
  const email = values.email.trim();
  const notes = values.notes.trim();

  return {
    name: values.name.trim(),
    monthlyFee: reaisToCents(Number(values.monthlyFeeReais)),
    billingDay: Number(values.billingDay),
    ...(whatsapp ? { whatsapp } : {}),
    ...(email ? { email } : {}),
    ...(notes ? { notes } : {}),
  };
}

/**
 * Converte um `Patient` (contrato) de volta para o estado do formulário —
 * usado ao abrir a edição (`PatientFormPage`) com os dados já preenchidos.
 * Inverso de `toPatientPayload` para os campos que o formulário edita
 * (`status` não é editável por este formulário — ver `PatientsAdapter.archivePatient`/`unarchivePatient`).
 */
export function patientToFormValues(patient: Patient): PatientFormValues {
  return {
    name: patient.name,
    whatsapp: e164ToWhatsAppInput(patient.whatsapp),
    email: patient.email ?? "",
    monthlyFeeReais: centsToReais(patient.monthlyFee),
    billingDay: patient.billingDay,
    notes: patient.notes ?? "",
  };
}
