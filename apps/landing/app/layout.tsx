import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Mudaro · Software para empresas de mudanças",
  description:
    "Da chamada ao orçamento aceite e à mudança documentada, sem WhatsApp nem caderno. Candidata a tua empresa ao piloto da Mudaro.",
  openGraph: {
    title: "Mudaro · Software para empresas de mudanças",
    description:
      "Orçamentos em minutos, inventário preenchido pelo cliente e mudanças com provas. Piloto aberto a 5 a 10 empresas.",
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${bricolage.variable} ${dmSans.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
