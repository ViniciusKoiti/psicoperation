import { Wrap } from "./Wrap";

const NAV_COLUMN_LINKS = [
  { href: "#solucao", label: "Sobre" },
  { href: "#faq", label: "FAQ" },
  { href: "#lista", label: "Contato" },
];

// Rotas reais de privacidade/termos ainda não existem (open_question do
// manifesto PSI-014); usamos os placeholders `#` da spec §1.10 até que uma
// tarefa dedicada crie essas páginas.
const LEGAL_LINKS = [
  { href: "#", label: "Política de Privacidade" },
  { href: "#", label: "Termos de Uso" },
];

/**
 * Rodapé em 3 colunas (spec §1.10): marca + tagline, navegação e links
 * legais, sobre `.psi-footer__grid` (`1.6fr 1fr 1fr`, 1 coluna ≤600px).
 */
export function Footer() {
  return (
    <footer className="psi-footer">
      <Wrap>
        <div className="psi-footer__grid">
          <div>
            <img src="/assets/psiops-logo-trim.png" alt="PsiOps" height={30} className="mb-4" />
            <p className="max-w-[280px] text-[15px] text-psi-neutral-600">
              O financeiro da sua clínica, com a calma que a sua rotina merece.
            </p>
            <p className="mt-4 text-[13.5px] text-psi-neutral-600">© 2026 PsiOps</p>
          </div>

          <nav aria-label="Navegação do rodapé">
            <p className="psi-footer__title">Navegação</p>
            <ul className="psi-footer__list">
              {NAV_COLUMN_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="psi-nav__link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Links legais">
            <p className="psi-footer__title">Legal</p>
            <ul className="psi-footer__list">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="psi-nav__link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Wrap>
    </footer>
  );
}
