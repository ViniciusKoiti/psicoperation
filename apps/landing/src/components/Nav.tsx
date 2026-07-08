"use client";

import { useEffect, useState } from "react";
import { Button } from "@psiops/ui";

import { Wrap } from "./Wrap";

const NAV_LINKS = [
  { href: "#problema", label: "O problema" },
  { href: "#solucao", label: "Recursos" },
  { href: "#como", label: "Como funciona" },
  { href: "#faq", label: "Dúvidas" },
];

/**
 * Navegação sticky (spec §1.1/§8.2): `position: sticky`, blur constante e
 * fundo/borda que ficam opacos quando `scrollY > 12` (classe `.psi-nav
 * --scrolled`, `globals.css`). Cliente: o estado de scroll só existe no
 * navegador, mas o markup renderiza igual em SSR (estado inicial = não
 * rolado), preservando o efeito de "progressive enhancement" da spec.
 */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 12);
    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  const cls = ["psi-nav", scrolled ? "psi-nav--scrolled" : null].filter(Boolean).join(" ");

  return (
    <header className={cls} data-testid="nav">
      <Wrap>
        <div className="psi-nav__inner">
          <a href="#top" aria-label="PsiOps — início" className="psi-nav__logo">
            <img src="/assets/psiops-logo-trim.png" alt="" height={34} />
          </a>
          <nav aria-label="Navegação principal" className="psi-nav__links">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="psi-nav__link">
                {link.label}
              </a>
            ))}
          </nav>
          <Button variant="primary" size="compact" href="#lista">
            Acesso antecipado
          </Button>
        </div>
      </Wrap>
    </header>
  );
}
