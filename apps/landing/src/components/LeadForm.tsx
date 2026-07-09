"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Card } from "@psiops/ui";

import { leadAdapter } from "../lib/lead-adapter";
import {
  type LeadFormErrors,
  type LeadFormField,
  type LeadFormValues,
  validateLeadForm,
} from "../lib/lead-form-validation";
import { maskWhatsApp, toE164 } from "../lib/whatsapp-mask";
import { Eyebrow } from "./Eyebrow";
import { Section } from "./Section";

const INITIAL_VALUES: LeadFormValues = { name: "", whatsapp: "", email: "" };

type SubmitStatus = "idle" | "submitting" | "success";

/**
 * Seção "Lead form" (spec §1.7, `#lista`): formulário de captação da lista
 * de espera (nome, WhatsApp, e-mail). Componente autossuficiente (PSI-018)
 * — não é inserido em `page.tsx` aqui; a composição final é da PSI-019.
 *
 * - Máscara `(XX) XXXXX-XXXX` aplicada no `onChange` do campo WhatsApp
 *   (equivalente ao evento `input` do protótipo).
 * - Validação local inline (obrigatoriedade + formato), sem lib externa;
 *   erro por campo limpa assim que o valor é corrigido.
 * - Envio via `LeadAdapter` (mock em memória nesta fase — PSI-044 troca a
 *   instância por um adapter HTTP real, sem mudar este componente).
 * - Sucesso substitui o formulário pelo estado de confirmação
 *   (`aria-live="polite"` + foco no título, para leitores de tela).
 */
export function LeadForm() {
  const [values, setValues] = useState<LeadFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LeadFormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const nameId = useId();
  const whatsappId = useId();
  const emailId = useId();

  function updateField(field: LeadFormField, raw: string) {
    const next = field === "whatsapp" ? maskWhatsApp(raw) : raw;

    setValues((prev) => ({ ...prev, [field]: next }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function fieldChangeHandler(field: LeadFormField) {
    return (event: ChangeEvent<HTMLInputElement>) => updateField(field, event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLeadForm(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setStatus("submitting");

    try {
      // Handoff PSI-044: `leadAdapter` hoje é a implementação mock em
      // memória; a integração HTTP real troca só esta instância, mantendo
      // a assinatura `LeadAdapter.submit(payload: LeadCreateRequest)`.
      await leadAdapter.submit({
        name: values.name.trim(),
        // Normalização E.164 (schema WhatsAppBR de packages/contracts): a
        // máscara nacional acima é só apresentação (assumption PSI-018).
        whatsapp: toE164(values.whatsapp),
        email: values.email.trim(),
      });
      setStatus("success");
    } catch {
      // Mock em memória não lança; guarda de robustez para quando a
      // PSI-044 introduzir uma implementação que pode falhar.
      setStatus("idle");
    }
  }

  return (
    <Section id="lista" data-testid="lead-form-section">
      <Card shadow="soft" className="psi-lead">
        {status === "success" ? (
          <LeadSuccess />
        ) : (
          <>
            <div className="psi-lead__header">
              <Eyebrow>Lista de espera</Eyebrow>
              <h2 className="psi-lead__title">Entre na lista de espera</h2>
              <p className="psi-lead__subtitle">
                Estamos construindo junto com psicólogas. Quem entrar agora terá acesso antecipado e
                condições especiais no lançamento.
              </p>
            </div>

            <form
              className="psi-lead__form"
              noValidate
              onSubmit={handleSubmit}
              data-testid="lead-form"
            >
              <Field id={nameId} label="Nome completo" error={errors.name}>
                <input
                  id={nameId}
                  name="name"
                  type="text"
                  placeholder="Como podemos te chamar?"
                  autoComplete="name"
                  value={values.name}
                  onChange={fieldChangeHandler("name")}
                  className={inputClassName(errors.name)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? errorId(nameId) : undefined}
                />
              </Field>

              <div className="psi-lead__grid">
                <Field id={whatsappId} label="WhatsApp" error={errors.whatsapp}>
                  <input
                    id={whatsappId}
                    name="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(11) 90000-0000"
                    autoComplete="tel-national"
                    value={values.whatsapp}
                    onChange={fieldChangeHandler("whatsapp")}
                    className={inputClassName(errors.whatsapp)}
                    aria-invalid={errors.whatsapp ? true : undefined}
                    aria-describedby={errors.whatsapp ? errorId(whatsappId) : undefined}
                  />
                </Field>

                <Field id={emailId} label="E-mail" error={errors.email}>
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    placeholder="voce@email.com"
                    autoComplete="email"
                    value={values.email}
                    onChange={fieldChangeHandler("email")}
                    className={inputClassName(errors.email)}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? errorId(emailId) : undefined}
                  />
                </Field>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Enviando…" : "Quero acesso antecipado"}
              </Button>

              <p className="psi-lead__note">Sem spam. Você só recebe quando a gente lançar.</p>
            </form>
          </>
        )}
      </Card>
    </Section>
  );
}

function errorId(fieldId: string): string {
  return `${fieldId}-error`;
}

function inputClassName(error: string | undefined): string {
  return ["psi-lead__input", error ? "psi-lead__input--error" : null].filter(Boolean).join(" ");
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="psi-lead__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="psi-lead__error" id={errorId(id)}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Estado de sucesso (spec §1.7, `#leadSuccess`): substitui o formulário.
 * `aria-live="polite"` + foco programático no título cobrem o risco de
 * leitores de tela não perceberem a confirmação (risks da PSI-018).
 */
function LeadSuccess() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div className="psi-lead__success" role="status" aria-live="polite" data-testid="lead-success">
      <span className="psi-lead__success-icon" aria-hidden="true">
        <CheckIcon />
      </span>
      <h3 className="psi-lead__success-title" tabIndex={-1} ref={titleRef}>
        Você está na lista!
      </h3>
      <p className="psi-lead__success-text">
        Vamos te avisar pelo WhatsApp assim que o PsiOps abrir. Acesso antecipado e condições
        especiais garantidos para você.
      </p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
