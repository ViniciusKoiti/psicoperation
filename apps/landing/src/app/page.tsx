/**
 * Página inicial placeholder (PSI-009): comprova o pipeline Tailwind + tokens
 * do design system e as três famílias tipográficas. As seções reais da
 * landing chegam na PSI-019, a partir de docs/design/landing-page-spec.md.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="max-w-xl rounded-3xl bg-psi-neutral-0 p-10 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-widest text-psi-accent-700">
          Em construção
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-psi-neutral-950">
          PsiOps
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-psi-neutral-700">
          O financeiro da sua clínica,{" "}
          <em className="font-serif italic text-psi-primary-700">finalmente em ordem</em>.
        </p>
        <p
          className="mt-8 inline-block rounded-full bg-psi-primary-50 px-4 py-2 text-sm font-medium text-psi-primary-700"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          Landing page completa chega na PSI-019
        </p>
      </section>
    </main>
  );
}
