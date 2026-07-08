import type { ReactNode, SVGProps } from "react";

import { Button, Pill } from "@psiops/ui";

import { Section } from "./Section";

/**
 * Seção Hero (spec §1.2): grid de duas colunas — headline + CTAs à esquerda,
 * mockup de dashboard com chips flutuantes à direita. Colapsa para uma
 * coluna e oculta os chips em viewports ≤920px (breakpoint fora da escala
 * padrão do Tailwind, tratado via variantes arbitrárias `max-[920px]:`).
 *
 * Componente autossuficiente (PSI-015): não é inserido em `page.tsx` aqui —
 * a composição final da página (junto às demais seções) é responsabilidade
 * da PSI-019.
 */
export function Hero() {
  return (
    <Section
      data-testid="hero"
      paddingTop={74}
      paddingBottom={86}
      className="relative"
      background={HERO_WASH}
    >
      <div className="grid grid-cols-[1.05fr_.95fr] items-center gap-[64px] max-[920px]:grid-cols-1 max-[920px]:gap-[56px]">
        <HeroContent />
        <HeroMockup />
      </div>
    </Section>
  );
}

/** Wash de fundo do hero (spec §1.2): dois radiais sobre o neutral-50 base. */
const HERO_WASH = [
  "radial-gradient(680px 460px at 78% -8%, rgba(160,148,201,.20), transparent 70%)",
  "radial-gradient(560px 420px at 4% 18%, rgba(220,235,232,.55), transparent 65%)",
  "var(--psi-neutral-50)",
].join(", ");

/** Coluna esquerda: pill, headline, subheadline, CTAs e prova social. */
function HeroContent() {
  return (
    <div>
      <Pill dot className="mb-[26px]">
        Feito para psicólogos que trabalham com mensalidade
      </Pill>

      <h1 className="mb-[22px] font-display text-[62px] font-bold leading-[1.08] tracking-[-0.02em] text-psi-neutral-900 [text-wrap:balance] max-[920px]:text-[48px] max-[600px]:text-[38px]">
        Cuidar da sua clínica é cuidar de{" "}
        <em className="font-serif italic text-psi-primary-600">você</em> também.
      </h1>

      <p className="mb-[34px] max-w-[520px] text-[19px] leading-[1.6] text-psi-neutral-600">
        Controle de mensalidades, lembretes automáticos e cobrança pelo WhatsApp — o financeiro do
        seu consultório organizado num só lugar, com a calma que a sua rotina merece.
      </p>

      <div className="flex flex-wrap items-center gap-[14px]">
        <Button variant="primary" href="#lista">
          Quero acesso antecipado
        </Button>
        <Button variant="ghost" href="#solucao" icon={<ArrowIcon />}>
          Ver como funciona
        </Button>
      </div>

      <div className="mt-[30px] flex items-center gap-[13px]">
        <div className="flex">
          <span className="h-8 w-8 rounded-full border-2 border-psi-neutral-50 bg-psi-primary-300" />
          <span className="-ml-2.5 h-8 w-8 rounded-full border-2 border-psi-neutral-50 bg-psi-calm-base" />
          <span className="-ml-2.5 h-8 w-8 rounded-full border-2 border-psi-neutral-50 bg-psi-accent-300" />
        </div>
        <p className="text-[14.5px] text-psi-neutral-600">
          Sendo construído junto com psicólogas autônomas do Brasil
        </p>
      </div>
    </div>
  );
}

/** Coluna direita: mockup de dashboard com chips flutuantes (spec §1.2). */
function HeroMockup() {
  return (
    <div className="relative" data-testid="hero-mockup">
      <FloatingChip position="top-[-26px] right-[6px]" className="px-[20px] py-[16px]">
        <p className="mb-1 font-display text-[12px] uppercase tracking-[.06em] text-psi-neutral-500">
          Receita do mês
        </p>
        <p className="font-display text-[26px] font-bold text-psi-primary-700">R$ 4.200</p>
      </FloatingChip>

      <div className="rounded-[24px] border border-psi-neutral-200 bg-psi-neutral-0 p-[24px] shadow-lift">
        <div className="mb-[20px] flex items-center justify-between gap-[12px]">
          <div>
            <p className="font-display text-[16px] font-semibold text-psi-neutral-900">
              Pacientes — Maio
            </p>
            <p className="text-[13px] text-psi-neutral-500">8 mensalistas ativos</p>
          </div>
          <span className="inline-flex items-center gap-[7px] whitespace-nowrap rounded-full bg-psi-success-light px-[11px] py-[6px] font-display text-[12.5px] font-medium text-psi-success-dark">
            <span className="h-2 w-2 rounded-full bg-psi-success-medium" />5 em dia
          </span>
        </div>

        <div className="flex flex-col gap-[10px]">
          {PATIENT_ROWS.map((row) => (
            <PatientRow key={row.name} {...row} />
          ))}
        </div>
      </div>

      <FloatingChip
        position="bottom-[-30px] left-[-14px]"
        className="flex max-w-[248px] items-center gap-[11px] px-[16px] py-[13px]"
      >
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-psi-success-light text-psi-success-dark">
          <WhatsAppIcon />
        </span>
        <p className="text-[13px] leading-[1.4] text-psi-neutral-700">
          Lembrete enviado{" "}
          <strong className="font-semibold text-psi-success-dark">automaticamente</strong>
        </p>
      </FloatingChip>
    </div>
  );
}

/**
 * Chip flutuante (`.hero-chip`, spec §1.2/§6): `.card` posicionado de forma
 * absoluta sobre o mockup; some em viewports ≤920px para não sobrepor o
 * conteúdo em telas estreitas (spec §7).
 */
function FloatingChip({
  position,
  className,
  children,
}: {
  position: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-testid="hero-chip"
      className={[
        "absolute z-[3] rounded-[18px] border border-psi-neutral-200 bg-psi-neutral-0 shadow-lift",
        "max-[920px]:hidden",
        position,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

interface PatientRowData {
  initials: string;
  name: string;
  meta: string;
  metaClassName?: string;
  status: string;
  tone: "success" | "warning" | "error";
  avatarClassName: string;
  rowClassName: string;
}

const TONE_TEXT_CLASSES: Record<PatientRowData["tone"], string> = {
  success: "text-psi-success-dark",
  warning: "text-psi-warning-dark",
  error: "text-psi-error-dark",
};

const TONE_DOT_CLASSES: Record<PatientRowData["tone"], string> = {
  success: "bg-psi-success-medium",
  warning: "bg-psi-warning-medium",
  error: "bg-psi-error-medium",
};

/** Linhas de paciente do dashboard hero (spec §1.2, tabela). */
const PATIENT_ROWS: PatientRowData[] = [
  {
    initials: "MR",
    name: "Marcos Rocha",
    meta: "Venc. dia 5 · R$ 350",
    status: "Pago",
    tone: "success",
    avatarClassName: "bg-psi-primary-100 text-psi-primary-700",
    rowClassName: "border-psi-neutral-200 bg-psi-neutral-50",
  },
  {
    initials: "BL",
    name: "Beatriz Lima",
    meta: "Venc. dia 10 · R$ 300",
    status: "Em aberto",
    tone: "warning",
    avatarClassName: "bg-psi-calm-soft text-psi-calm-deep",
    rowClassName: "border-psi-neutral-200 bg-psi-neutral-50",
  },
  {
    initials: "CD",
    name: "Carla Dias",
    meta: "Atrasado 4 dias · R$ 357 com juros",
    metaClassName: "text-psi-error-dark",
    status: "Atrasado",
    tone: "error",
    avatarClassName: "bg-psi-neutral-0 text-psi-error-dark",
    rowClassName: "border-psi-error-medium bg-psi-error-light",
  },
];

function PatientRow({
  initials,
  name,
  meta,
  metaClassName,
  status,
  tone,
  avatarClassName,
  rowClassName,
}: PatientRowData) {
  return (
    <div className={`flex items-center gap-[14px] rounded-[15px] border p-[14px] ${rowClassName}`}>
      <span
        className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full font-display text-[14px] font-semibold ${avatarClassName}`}
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[15px] font-semibold text-psi-neutral-900">{name}</p>
        <p className={`text-[13px] ${metaClassName ?? "text-psi-neutral-500"}`}>{meta}</p>
      </div>
      <span
        className={`flex items-center gap-[6px] whitespace-nowrap font-display text-[12.5px] font-medium ${TONE_TEXT_CLASSES[tone]}`}
      >
        <span className={`h-2 w-2 rounded-full ${TONE_DOT_CLASSES[tone]}`} />
        {status}
      </span>
    </div>
  );
}

/** Ícones inline (`.ico`, spec §4): stroke currentColor 1.6, sem preenchimento. */
function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

function ArrowIcon() {
  return (
    <Icon>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

function WhatsAppIcon() {
  return (
    <Icon>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 1 1 16.1-3.8z" />
    </Icon>
  );
}
