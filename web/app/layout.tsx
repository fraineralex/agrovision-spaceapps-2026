/* AI assistance: Codex (OpenAI), 2026-11-14. Frainer review pending; see AI_USAGE.md. */
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroVision | República Dominicana",
  icons: { icon: "/icon.svg" },
  description: "Consulta la lluvia, organiza tu siembra y calcula el precio mínimo para cubrir tus gastos en el campo dominicano.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f4d2c" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-DO"><body>{children}</body></html>;
}
