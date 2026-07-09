import { ComoFunciona } from "../components/ComoFunciona";
import { Faq } from "../components/Faq";
import { FinalCta } from "../components/FinalCta";
import { Hero } from "../components/Hero";
import { LeadForm } from "../components/LeadForm";
import { Problema } from "../components/Problema";
import { Quote } from "../components/Quote";
import { Solucao } from "../components/Solucao";

/**
 * Composição final da landing (PSI-019): monta as seções intermediárias na
 * ordem exata da referência (docs/design/landing-page-spec.md §1) — hero,
 * problema, solução, como funciona, quote, lead form (#lista), FAQ e CTA
 * final. Nav e footer já envolvem a página via `layout.tsx` (PSI-014).
 *
 * Cada seção é um componente autossuficiente entregue por uma tarefa
 * anterior (Hero: PSI-015; Problema/Solução: PSI-016; Como
 * funciona/Quote/FAQ: PSI-017; Lead form: PSI-018) — esta página apenas as
 * compõe, sem alterar sua estrutura interna.
 */
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Problema />
      <Solucao />
      <ComoFunciona />
      <Quote />
      <LeadForm />
      <Faq />
      <FinalCta />
    </main>
  );
}
