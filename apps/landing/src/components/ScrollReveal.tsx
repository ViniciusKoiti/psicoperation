"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = ".psi-reveal";
const REVEAL_ARMED_CLASS = "psi-reveal-on";
const REVEAL_VISIBLE_CLASS = "psi-reveal--in";

const OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0.08,
  rootMargin: "0px 0px -40px 0px",
};

// Garantia global (spec §8.1): revela tudo após ~2600ms independentemente
// de scroll/observer — mesmo valor do protótipo (assumption do manifesto
// PSI-019: é o único fallback com valor explícito a reproduzir).
const FALLBACK_MS = 2600;

/**
 * Motor de scroll reveal (spec §8.1), progressive enhancement: sem este
 * componente rodando (JS desabilitado/falhando), nada fica oculto —
 * `globals.css` só arma o estado oculto (`html.psi-reveal-on
 * .psi-reveal:not(.psi-reveal--in)`) quando o efeito abaixo adiciona
 * `psi-reveal-on` ao `<html>`.
 *
 * Opera via `querySelectorAll(".psi-reveal")` sobre todo o documento — como
 * o protótipo original (`project/PsiOps Landing.html`) — em vez de um hook
 * por seção. Isso evita alterar a árvore/estado interno das seções já
 * mescladas (Hero/Problema/Solução/Como funciona/Quote/Lead form/FAQ, PSI-
 * 015 a PSI-018): elas só ganham a marcação aditiva da classe `.psi-reveal`
 * (e o `transitionDelay` inline já usado nos cards/passos escalonados).
 *
 * Decisão de acessibilidade (assumption do manifesto): respeita
 * `prefers-reduced-motion` mesmo o protótipo não fazendo isso — quando
 * ativo, nunca arma o estado oculto, então todo o conteúdo permanece
 * visível sem animação.
 *
 * Não renderiza nada — só o efeito colateral do reveal.
 */
export function ScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    document.documentElement.classList.add(REVEAL_ARMED_CLASS);

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    if (nodes.length === 0) return;

    const reveal = (node: HTMLElement) => node.classList.add(REVEAL_VISIBLE_CLASS);
    const revealAll = () => nodes.forEach(reveal);

    let observer: IntersectionObserver | undefined;

    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver((entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target as HTMLElement);
          obs.unobserve(entry.target);
        }
      }, OBSERVER_OPTIONS);

      for (const node of nodes) observer.observe(node);
    } else {
      // Sem suporte a IntersectionObserver (ambiente muito antigo/teste):
      // revela tudo de imediato em vez de depender só do fallback de 2600ms.
      revealAll();
    }

    // Fallback adicional (spec §8.1): getBoundingClientRect via load/scroll,
    // robusto a observers que não disparam em alguns navegadores/estados.
    const showInView = () => {
      const viewportHeight = window.innerHeight;
      for (const node of nodes) {
        if (node.classList.contains(REVEAL_VISIBLE_CLASS)) continue;
        const rect = node.getBoundingClientRect();
        if (rect.top < viewportHeight - 40 && rect.bottom > 0) reveal(node);
      }
    };

    showInView();
    window.addEventListener("scroll", showInView, { passive: true });
    window.addEventListener("load", showInView);

    // Garantia global: revela tudo após FALLBACK_MS, independentemente do
    // observer/scroll terem disparado (acceptance criteria PSI-019: nenhum
    // conteúdo permanece oculto se o observer falhar ou demorar).
    const fallbackTimeout = window.setTimeout(revealAll, FALLBACK_MS);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", showInView);
      window.removeEventListener("load", showInView);
      window.clearTimeout(fallbackTimeout);
    };
  }, []);

  return null;
}
