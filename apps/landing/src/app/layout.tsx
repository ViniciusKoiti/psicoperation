import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces, Inter } from "next/font/google";

import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

import "./globals.css";

// Fontes self-hosted via next/font (sem requisições a serviços externos em
// runtime), expostas como variáveis CSS consumidas pelo tailwind.config.ts
// (font-display / font-body / font-serif).
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Estilo "italic" (citação, spec §1.6) e "normal" (números do "Como
// funciona", spec §1.5 — `.serif` com `font-style: normal; font-weight:
// 500`, PSI-017) sob a mesma variável: o CSS escolhe a face correta via
// `font-style`, sem precisar de uma segunda variável.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic", "normal"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PsiOps — O financeiro da sua clínica, finalmente em ordem",
  description:
    "Gestão financeira para psicólogas solo: mensalidades, cobranças e lembretes sem planilha.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${inter.variable} ${fraunces.variable}`}>
      <body className="bg-psi-neutral-50 font-body text-psi-neutral-900 antialiased">
        <Nav />
        {/* Alvo da âncora "#top" (logo da nav), spec §1.1. */}
        <div id="top" />
        {children}
        <Footer />
      </body>
    </html>
  );
}
