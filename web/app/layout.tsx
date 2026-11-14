/* AI assistance: Codex (OpenAI), 2026-11-14. Frainer review pending; see AI_USAGE.md. */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroVision | República Dominicana",
  icons: { icon: "/icon.svg" },
  description: "Explora datos y compara ejemplos de rotación agrícola en República Dominicana.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
