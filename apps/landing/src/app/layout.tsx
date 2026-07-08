import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Fraunces, Inter } from "next/font/google";

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

const fraunces = Fraunces({
  subsets: ["latin"],
  style: "italic",
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
        {children}
      </body>
    </html>
  );
}
