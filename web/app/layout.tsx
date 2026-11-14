/* AI assistance: Codex (OpenAI), 2026-11-14; typography update by Antigravity (Gemini), 2026-11-14. Frainer review pending; see AI_USAGE.md. */
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "AgroVision | República Dominicana",
  icons: { icon: "/icon.svg" },
  description: "Consulta la lluvia, organiza tu siembra y calcula el precio mínimo para cubrir tus gastos en el campo dominicano.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f4d2c" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-DO" className={plusJakarta.variable}><body>{children}</body></html>;
}
