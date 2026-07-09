import { Eyebrow } from "./Eyebrow";
import { Section } from "./Section";

interface StepData {
  number: string;
  title: string;
  text: string;
}

const STEPS: StepData[] = [
  {
    number: "01",
    title: "Cadastre seus pacientes",
    text: "Em menos de 2 minutos por paciente. Sem complicação.",
  },
  {
    number: "02",
    title: "Configure as regras",
    text: "Defina valores, vencimentos e juros uma única vez.",
  },
  {
    number: "03",
    title: "Acompanhe e cobre",
    text: "Receba alertas, envie lembretes, mantenha tudo em ordem.",
  },
];

/**
 * Seção "Como funciona" (spec §1.5, `#como`): header centralizado + grid de
 * 3 passos numerados (Fraunces normal 60px `--psi-primary-300`, spec §2).
 * Textos idênticos à referência — ver `docs/design/landing-page-spec.md`
 * §1.5.
 */
export function ComoFunciona() {
  return (
    <Section id="como">
      <div className="psi-como__header">
        <Eyebrow>Passo a passo</Eyebrow>
        <h2 className="psi-como__h2">Simples como deve ser</h2>
      </div>
      <div className="psi-como__grid">
        {STEPS.map((step, index) => (
          <div
            key={step.number}
            className="psi-como__step"
            style={{ transitionDelay: index === 0 ? undefined : `${index * 0.08}s` }}
          >
            <span className="psi-como__number">{step.number}</span>
            <h3 className="psi-como__title">{step.title}</h3>
            <p className="psi-como__text">{step.text}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
